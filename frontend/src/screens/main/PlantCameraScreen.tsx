import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Linking, ScrollView } from 'react-native';
import { ref, onValue } from 'firebase/database';
import { database } from '../../config/firebase';
import { useTheme } from '../../theme/ThemeContext';
import { WebView } from 'react-native-webview';

export default function PlantCameraScreen() {
  const { colors } = useTheme();
  const [camera, setCamera] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [streamError, setStreamError] = useState(false);

  useEffect(() => {
    const camRef = ref(database, 'terrarium/camera');
    const predRef = ref(database, 'terrarium/latest_camera_prediction');
    const jobRef = ref(database, 'terrarium/cameraJobStatus');

    const unsubCam = onValue(camRef, snap => setCamera(snap.val() || {}));
    const unsubJob = onValue(jobRef, snap => setJobStatus(snap.val() || {}));
    const unsubPred = onValue(predRef, snap => {
      setPrediction(snap.val() || {});
      setLoading(false);
    });

    return () => {
      unsubCam();
      unsubPred();
      unsubJob();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const { streamUrl, snapshotUrl, status, lastSeen, lastCaptureType } = camera || {};
  const { predictedClass, confidence, isDiseased, plantStatus, timestamp, captureType } = prediction || {};
  
  const displayTime = timestamp ? new Date(timestamp).toLocaleString() : 'N/A';
  const displayLastSeen = lastSeen ? new Date(lastSeen).toLocaleString() : 'N/A';

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={s.videoContainer}>
        {streamUrl && !streamError ? (
          <WebView
            source={{ uri: streamUrl }}
            style={{ flex: 1 }}
            onError={() => setStreamError(true)}
            scrollEnabled={false}
          />
        ) : snapshotUrl ? (
          <Image source={{ uri: snapshotUrl }} style={{ flex: 1, width: '100%' }} resizeMode="contain" />
        ) : (
          <View style={s.noVideoStream}>
            <Text style={{ color: '#aaa' }}>No Camera Stream Available</Text>
          </View>
        )}
      </View>
      
      <ScrollView style={s.infoScroll}>
        {/* <View style={s.infoCard}>
          <Text style={[s.sectionTitle, { color: colors.primary }]}>Camera Status</Text>
          <Text style={[s.infoText, { color: colors.text }]}>Status: {status || 'Unknown'}</Text>
          <Text style={[s.infoText, { color: colors.textLight }]}>Last Seen: {displayLastSeen}</Text>
          <Text style={[s.infoText, { color: colors.textLight }]}>Last Capture Type: {lastCaptureType || 'N/A'}</Text>
          
          {streamUrl && (
            <TouchableOpacity style={s.browserBtn} onPress={() => Linking.openURL(streamUrl)}>
              <Text style={s.browserBtnText}>Open Stream in Browser</Text>
            </TouchableOpacity>
          )}
        </View>

        {jobStatus && jobStatus.status && (
        <View style={s.infoCard}>
          <Text style={[s.sectionTitle, { color: colors.primary }]}>Current Job</Text>
          <Text style={[s.infoText, { color: colors.text }]}>Status: {jobStatus.status}</Text>
          {jobStatus.message && <Text style={[s.infoText, { color: colors.text }]}>Message: {jobStatus.message}</Text>}
          {jobStatus.timestamp && <Text style={[s.infoText, { color: colors.textLight }]}>Time: {new Date(jobStatus.timestamp).toLocaleString()}</Text>}
        </View>
        )} */}

        <View style={s.infoCard}>
          <Text style={[s.sectionTitle, { color: colors.primary }]}>Latest Prediction</Text>
          <Text style={[s.infoText, { color: colors.text }]}>Time: {displayTime}</Text>
          <Text style={[s.infoText, { color: colors.text }]}>Result: {predictedClass || 'None'}</Text>
          <Text style={[s.infoText, { color: colors.text }]}>
            Confidence: {confidence ? (confidence).toFixed(1) + '%' : 'N/A'}
          </Text>
          <Text style={[s.infoText, { color: colors.textLight }]}>Capture Type: {captureType || 'N/A'}</Text>
          <View style={s.badgeRow}>
            <View style={[s.badge, { backgroundColor: isDiseased ? colors.error : colors.success }]}>
              <Text style={s.badgeText}>{isDiseased ? 'Diseased' : 'Healthy'}</Text>
            </View>
            {/* {plantStatus && (
              <View style={[s.badge, { backgroundColor: '#B0BEC5', marginLeft: 8 }]}>
                <Text style={[s.badgeText, { color: '#000' }]}>{plantStatus}</Text>
              </View>
            )} */}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  videoContainer: {
    height: 300,
    backgroundColor: '#000',
    width: '100%',
  },
  noVideoStream: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  infoScroll: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  browserBtn: {
    marginTop: 12,
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  browserBtnText: {
    color: '#1565C0',
    fontWeight: 'bold',
  }
});
