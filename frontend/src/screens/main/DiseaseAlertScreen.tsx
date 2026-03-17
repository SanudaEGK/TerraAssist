import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { colors } from '../../theme/colors';
import { DiseasePredictionResponse } from '../../services/api/huggingFace';

type DiseaseAlertRouteProp = RouteProp<RootStackParamList, 'DiseaseAlert'>;
type DiseaseAlertNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DiseaseAlert'>;

export default function DiseaseAlertScreen() {
  const route = useRoute<DiseaseAlertRouteProp>();
  const navigation = useNavigation<DiseaseAlertNavigationProp>();
  const { diseaseInfo } = route.params;

  // Example diseaseInfo structure as per docs
  const result: DiseasePredictionResponse = diseaseInfo;
  
  const parsedDiseaseName = result.predicted_class.replace(/_/g, ' ');
  const confidence = result.confidence;
  const isDiseased = result.is_diseased;

  let severityBadge = { label: 'Mild', color: 'yellow', icon: '🟡' };
  if (confidence >= 80) severityBadge = { label: 'Severe', color: colors.error, icon: '🔴' };
  else if (confidence >= 50) severityBadge = { label: 'Moderate', color: 'orange', icon: '🟠' };

  const renderTreatmentGuide = () => {
    if (!isDiseased) {
      return (
        <View style={[styles.guideCard, { borderColor: colors.success, backgroundColor: '#E8F5E9' }]}>
          <Text style={styles.guideTitle}>✅ Your plant looks healthy!</Text>
          <Text style={styles.guideText}>Keep up the good work. Maintain current temperature and moisture levels.</Text>
        </View>
      );
    }

    if (result.predicted_class === 'Bacterial_wilt_disease') {
      return (
        <View style={styles.guideCard}>
          <Text style={styles.guideSubTitle}>What it is:</Text>
          <Text style={styles.guideText}>A bacterial infection causing wilting and yellowing of leaves.</Text>
          
          <Text style={styles.guideSubTitle}>Symptoms:</Text>
          <Text style={styles.guideText}>Drooping leaves, brown streaks, yellowing edges.</Text>

          <Text style={styles.guideSubTitle}>Treatment Steps:</Text>
          <Text style={styles.guideBullet}>1. Remove and isolate affected leaves immediately.</Text>
          <Text style={styles.guideBullet}>2. Avoid overwatering — let soil dry between waterings.</Text>
          <Text style={styles.guideBullet}>3. Improve air circulation (turn on fan from Controls).</Text>
          <Text style={styles.guideBullet}>4. Apply copper-based bactericide if available.</Text>
          <Text style={styles.guideBullet}>5. Monitor remaining leaves daily for spread.</Text>
        </View>
      );
    }

    if (result.predicted_class === 'Manganese_Toxicity') {
      return (
        <View style={styles.guideCard}>
          <Text style={styles.guideSubTitle}>What it is:</Text>
          <Text style={styles.guideText}>Excess manganese in soil causing leaf damage.</Text>
          
          <Text style={styles.guideSubTitle}>Symptoms:</Text>
          <Text style={styles.guideText}>Brown spots, yellow patches, leaf curling.</Text>

          <Text style={styles.guideSubTitle}>Treatment Steps:</Text>
          <Text style={styles.guideBullet}>1. Check and adjust soil pH to 6.0–6.5.</Text>
          <Text style={styles.guideBullet}>2. Flush soil with clean water to reduce mineral buildup.</Text>
          <Text style={styles.guideBullet}>3. Reduce fertilizer — do not add more for at least 30 days.</Text>
          <Text style={styles.guideBullet}>4. Replace top layer of soil if problem persists.</Text>
          <Text style={styles.guideBullet}>5. Ensure proper drainage inside terrarium.</Text>
        </View>
      );
    }

    // Default fallback for unknown diseases
    return (
      <View style={styles.guideCard}>
         <Text style={styles.guideSubTitle}>Treatment Steps:</Text>
         <Text style={styles.guideBullet}>1. Isolate the plant if possible.</Text>
         <Text style={styles.guideBullet}>2. Ensure optimal watering and lighting conditions.</Text>
         <Text style={styles.guideBullet}>3. Monitor closely over the next few days.</Text>
      </View>
    );
  };

  const markAsTreated = () => {
    // In a real app, you would pass the Firebase key from the DetectionScreen here 
    // and update that specific record to { status: 'treated' }
    Alert.alert('Success', 'Marked as Treated in history.', [
      { text: 'OK', onPress: () => navigation.navigate('Main') }
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      
      <View style={[styles.statusBanner, isDiseased ? styles.bannerError : styles.bannerSuccess]}>
         <Text style={styles.bannerText}>
           {isDiseased ? '⚠️ Disease Detected!' : '✅ Plant is Healthy!'}
         </Text>
      </View>

      <Text style={styles.title}>{parsedDiseaseName} {isDiseased ? '⚠️' : ''}</Text>
      
      <View style={styles.badgeRow}>
        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceText}>{confidence.toFixed(1)}% Confident</Text>
        </View>
        
        {isDiseased && (
          <View style={[styles.severityBadge, { borderColor: severityBadge.color }]}>
            <Text style={{ color: severityBadge.color, fontWeight: 'bold' }}>
              {severityBadge.icon} {severityBadge.label} Severity
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.sectionHeader}>Treatment Guide</Text>
      {renderTreatmentGuide()}

      <View style={styles.buttonContainer}>
        {isDiseased && (
          <TouchableOpacity style={styles.primaryButton} onPress={markAsTreated}>
            <Text style={styles.primaryButtonText}>Mark as Treated</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.secondaryButton, !isDiseased && { marginTop: 20 }]} 
          onPress={() => navigation.navigate('Main')}
        >
          <Text style={styles.secondaryButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statusBanner: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  bannerError: {
    backgroundColor: '#FFCDD2',
    borderWidth: 1,
    borderColor: colors.error,
  },
  bannerSuccess: {
    backgroundColor: '#C8E6C9',
    borderWidth: 1,
    borderColor: colors.success,
  },
  bannerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  confidenceBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 10,
    marginBottom: 8,
  },
  confidenceText: {
    color: colors.secondary,
    fontWeight: 'bold',
  },
  severityBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  guideCard: {
    backgroundColor: colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 30,
  },
  guideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: 8,
  },
  guideSubTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 12,
    marginBottom: 4,
  },
  guideText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  guideBullet: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
    marginLeft: 8,
  },
  buttonContainer: {
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
