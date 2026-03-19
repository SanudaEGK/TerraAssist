import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, Alert, ScrollView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { analyzeLeafImage } from '../../services/api/huggingFace';
import { ref, push, set } from 'firebase/database';
import { database } from '../../config/firebase';
import { useTheme } from '../../theme/ThemeContext';
import { getTodayDateString } from '../../utils/fertilizerLogic';

type DiseaseScreenProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

export default function DiseaseDetectionScreen() {
  const { colors } = useTheme();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const navigation = useNavigation<DiseaseScreenProp>();

  const requestPermissions = async () => {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return cam.status === 'granted' && lib.status === 'granted';
  };

  const openCamera = async () => {
    const ok = await requestPermissions();
    if (!ok) { Alert.alert('Permission needed', 'Camera & gallery permissions are required'); return; }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) setImageUri(result.assets[0].uri);
  };

  const openGallery = async () => {
    const ok = await requestPermissions();
    if (!ok) { Alert.alert('Permission needed', 'Gallery permission is required'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) setImageUri(result.assets[0].uri);
  };

  const handleAnalyze = async () => {
    if (!imageUri) { Alert.alert('Error', 'Please select a leaf image first'); return; }
    setAnalyzing(true);
    try {
      const response = await analyzeLeafImage(imageUri);
      const parsedDisease = response.predicted_class.replace(/_/g, ' ');
      const historyRef = ref(database, 'terrarium/disease_history');
      const newRef = push(historyRef);
      await set(newRef, {
        date: getTodayDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        disease: parsedDisease,
        confidence: response.confidence,
        status: response.is_diseased ? 'untreated' : 'treated',
      });
      navigation.navigate('DiseaseAlert', { diseaseInfo: response });
    } catch (error: any) {
      Alert.alert('Analysis Failed', error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingTop: 50 },
    header: { paddingHorizontal: 20, marginBottom: 20 },
    title: { fontSize: 26, fontWeight: 'bold', color: colors.primary },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    imageCard: {
      backgroundColor: colors.cardBackground, borderRadius: 16, overflow: 'hidden',
      height: 280, justifyContent: 'center', alignItems: 'center',
      borderWidth: 1.5, borderColor: colors.border, marginBottom: 16, borderStyle: 'dashed',
    },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    placeholder: { alignItems: 'center' },
    placeholderIcon: { fontSize: 64, opacity: 0.4, marginBottom: 8 },
    placeholderText: { color: colors.textLight, fontSize: 14 },
    buttonRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    mediaBtn: {
      flex: 1, backgroundColor: colors.cardBackground, padding: 14, borderRadius: 12,
      alignItems: 'center', borderWidth: 1, borderColor: colors.primary,
      flexDirection: 'row', justifyContent: 'center', gap: 6,
    },
    mediaBtnText: { color: colors.primary, fontWeight: 'bold', fontSize: 14 },
    analyzeBtn: {
      backgroundColor: colors.primary, padding: 16, borderRadius: 12,
      alignItems: 'center',
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35, shadowRadius: 6, elevation: 4,
    },
    analyzeBtnDisabled: { opacity: 0.5 },
    analyzeBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
    loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Plant Health Check</Text>
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Image Preview */}
        <View style={s.imageCard}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={s.previewImage} />
          ) : (
            <View style={s.placeholder}>
              <Text style={s.placeholderIcon}>🌿</Text>
              <Text style={s.placeholderText}>No image selected</Text>
            </View>
          )}
        </View>

        {/* Camera / Gallery buttons */}
        <View style={s.buttonRow}>
          <TouchableOpacity style={s.mediaBtn} onPress={openCamera}>
            <Text>📷</Text>
            <Text style={s.mediaBtnText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.mediaBtn} onPress={openGallery}>
            <Text>🖼️</Text>
            <Text style={s.mediaBtnText}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Analyze button */}
        <TouchableOpacity
          style={[s.analyzeBtn, (!imageUri || analyzing) && s.analyzeBtnDisabled]}
          onPress={handleAnalyze}
          disabled={!imageUri || analyzing}
        >
          {analyzing ? (
            <View style={s.loadingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={s.analyzeBtnText}>Analyzing...</Text>
            </View>
          ) : (
            <Text style={s.analyzeBtnText}>Analyze Leaf 🔍</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
