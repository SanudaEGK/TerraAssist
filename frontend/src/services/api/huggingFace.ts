// src/services/api/huggingFace.ts
import axios from 'axios';
import { Platform } from 'react-native';

const HF_API_URL = 'https://ksanu-terraassist.hf.space/predict';

export interface DiseasePredictionResponse {
  plant_status: 'HEALTHY' | 'DISEASED';
  predicted_class: string;
  confidence: number;
  is_diseased: boolean;
  all_probabilities: Record<string, number>;
  crops_scanned: number;
  diseased_crops: number;
  enhancement_applied: boolean;
}

/**
 * Converts a local file URI to a Blob for web, or uses the URI directly for native.
 * This is necessary because web browsers can't POST raw local URIs.
 */
const uriToBlob = (uri: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = () => reject(new Error('Failed to convert image to blob'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
};

export const analyzeLeafImage = async (imageUri: string): Promise<DiseasePredictionResponse> => {
  try {
    const formData = new FormData();

    if (Platform.OS === 'web') {
      // On web, convert the object URL to a Blob first
      const blob = await uriToBlob(imageUri);
      formData.append('file', blob, 'leaf.jpg');
    } else {
      // On native (Android/iOS), React Native's FormData accepts {uri, name, type}
      const filename = imageUri.split('/').pop() || 'leaf.jpg';
      const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

      // @ts-ignore - React Native specific FormData override
      formData.append('file', {
        uri: imageUri,
        name: filename,
        type: mimeType,
      });
    }

    const response = await axios.post<DiseasePredictionResponse>(
      HF_API_URL,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds — HuggingFace free tier can be slow on cold starts
      }
    );

    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(`Server Error ${error.response.status}: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      throw new Error(
        'Cannot reach the AI model. Make sure:\n1. You have internet access\n2. The HuggingFace Space is awake (visit https://ksanu-terraassist.hf.space and wait for it to load)'
      );
    } else {
      throw new Error('Analysis failed. Please try again.');
    }
  }
};
