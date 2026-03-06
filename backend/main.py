from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from PIL import Image
import json
import io
import tflite_runtime.interpreter as tflite

# ============================================================
# CONFIGURATION — update this path if needed
# ============================================================
MODEL_PATH  = "efficientnetb0.tflite"
LABELS_PATH = "class_labels.json"

# ============================================================
# LOAD MODEL AND LABELS (runs once when server starts)
# ============================================================
print("Loading EfficientNetB0 model...")
interpreter = tf.lite.Interpreter(model_path=MODEL_PATH)
interpreter.allocate_tensors()
input_details  = interpreter.get_input_details()
output_details = interpreter.get_output_details()
print("Model loaded successfully!")

with open(LABELS_PATH, "r") as f:
    class_indices = json.load(f)
idx_to_class = {v: k for k, v in class_indices.items()}
CLASS_NAMES  = list(class_indices.keys())
NUM_CLASSES  = len(CLASS_NAMES)
print(f"Classes: {CLASS_NAMES}")

# ============================================================
# CREATE FASTAPI APP
# ============================================================
app = FastAPI(
    title="TerraAssist Disease Detection API",
    description="Upload a plant image and get disease prediction using EfficientNetB0",
    version="1.0.0"
)

# Allow requests from any origin (needed for Flutter app and ESP32)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# HELPER FUNCTIONS
# ============================================================

def preprocess_image(img_pil):
    """
    Resize and prepare image for EfficientNetB0.
    Note: EfficientNetB0 expects raw 0-255 pixel values (NOT divided by 255).
    """
    img_resized = img_pil.resize((224, 224))
    arr = np.array(img_resized, dtype=np.float32)  # keep as 0-255
    return np.expand_dims(arr, axis=0)              # shape: (1, 224, 224, 3)


def run_prediction(img_pil):
    """Run the TFLite model and return prediction results."""
    img_array = preprocess_image(img_pil)

    interpreter.set_tensor(input_details[0]["index"], img_array)
    interpreter.invoke()
    probs = interpreter.get_tensor(output_details[0]["index"])[0]

    predicted_idx   = int(np.argmax(probs))
    predicted_class = idx_to_class[predicted_idx]
    confidence      = float(probs[predicted_idx]) * 100.0
    all_probs       = {CLASS_NAMES[i]: round(float(probs[i]) * 100, 2) for i in range(NUM_CLASSES)}

    return predicted_class, confidence, all_probs

# ============================================================
# API ENDPOINTS
# ============================================================

@app.get("/")
def root():
    """Health check — visit this to confirm the server is running."""
    return {
        "status":  "TerraAssist API is running",
        "model":   "EfficientNetB0",
        "classes": CLASS_NAMES,
        "tip":     "Go to /docs to test the prediction API in your browser"
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Upload a plant image and receive a disease prediction.

    - Accepts: JPG, JPEG, PNG images
    - Returns: predicted class, confidence, and all class probabilities
    """
    # Step 1: Read the uploaded image bytes
    image_bytes = await file.read()

    # Step 2: Convert bytes to a PIL image (same as opening a file)
    try:
        img_pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception:
        return {"error": "Could not read image. Please upload a valid JPG or PNG file."}

    # Step 3: Run prediction (reuses the same logic as test_model_locally.py)
    predicted_class, confidence, all_probs = run_prediction(img_pil)

    # Step 4: Determine plant status
    is_diseased  = predicted_class.lower() != "healthy"
    plant_status = "DISEASED" if is_diseased else "HEALTHY"

    # Step 5: Return result as JSON
    return {
        "plant_status":    plant_status,
        "predicted_class": predicted_class,
        "confidence":      round(confidence, 2),
        "is_diseased":     is_diseased,
        "all_probabilities": all_probs,
        "image_size":      f"{img_pil.width}x{img_pil.height}"
    }
