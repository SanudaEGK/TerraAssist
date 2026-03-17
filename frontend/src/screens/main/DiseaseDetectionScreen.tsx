import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { analyzeLeafImage, DiseasePredictionResponse } from '../../services/api/huggingFace';
import { ref, push, set } from 'firebase/database';
import { database } from '../../config/firebase';
import { colors } from '../../theme/colors';
import { getTodayDateString } from '../../utils/fertilizerLogic';

type DiseaseScreenProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

export default function DiseaseDetectionScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const navigation = useNavigation<DiseaseScreenProp>();

  const requestPermissions = async () => {
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return cameraStatus.status === 'granted' && libraryStatus.status === 'granted';
  };

  const openCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission needed', 'Camera permissions are required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission needed', 'Gallery permissions are required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleAnalyze = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Please select a leaf image first');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await analyzeLeafImage(imageUri);
      
      // Save history to Firebase
      // TODO: Replace 'dummy_url' with actual Firebase Storage URL if uploading the image later
      const parsedDisease = response.predicted_class.replace(/_/g, ' ');

      const historyRef = ref(database, 'terrarium/disease_history');
      const newRecordRef = push(historyRef);
      
      const newRecord = {
        date: getTodayDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        disease: parsedDisease,
        confidence: response.confidence,
        image_url: 'dummy_url_awaiting_storage', 
        status: response.is_diseased ? 'untreated' : 'treated' // Healthy means no treatment needed
      };

      await set(newRecordRef, newRecord);

      // Navigate to Alert Screen
      navigation.navigate('DiseaseAlert', { diseaseInfo: response });

    } catch (error: any) {
      Alert.alert('Analysis Failed', error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Plant Health Check</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Step 1 — Select Image</Text>
          
          <View style={styles.imageCard}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderIcon}>🌿</Text>
                <Text style={styles.placeholderText}>No image selected</Text>
              </View>
            )}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.mediaButton} onPress={openCamera}>
              <Text style={styles.mediaIcon}>📷</Text>
              <Text style={styles.mediaButtonText}>Open Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mediaButton} onPress={openGallery}>
              <Text style={styles.mediaIcon}>🖼️</Text>
              <Text style={styles.mediaButtonText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Step 2 — Analyze</Text>
          
          <TouchableOpacity 
            style={[styles.analyzeButton, !imageUri && styles.analyzeButtonDisabled]} 
            onPress={handleAnalyze}
            disabled={!imageUri || analyzing}
          >
            {analyzing ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.secondary} size="small" />
                <Text style={styles.analyzeButtonText}>Analyzing your plant...</Text>
              </View>
            ) : (
              <Text style={styles.analyzeButtonText}>Analyze Leaf 🔍</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  stepContainer: {
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  imageCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    overflow: 'hidden',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    borderStyle: 'dashed',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: 8,
    opacity: 0.5,
  },
  placeholderText: {
    color: colors.textLight,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mediaButton: {
    flex: 1,
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  mediaIcon: {
    marginRight: 8,
    fontSize: 18,
  },
  mediaButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  analyzeButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  analyzeButtonDisabled: {
    backgroundColor: colors.grey,
    opacity: 0.7,
  },
  analyzeButtonText: {
    color: colors.secondary,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
