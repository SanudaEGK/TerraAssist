import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, Image, TouchableOpacity
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { database } from '../../config/firebase';
import { useTheme } from '../../theme/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface DiseaseRecord {
  id: string;
  date: string;
  time: string;
  disease: string;
  confidence: number;
  status: string;
}

interface SensorHistoryRecord {
  id: string;
  ts: number;
  timestamp: string;
  temperature: number;
  humidity: number;
  soil: number;
}

interface CameraPredRecord {
  id: string;
  timestamp: string;
  captureType: string;
  imageUrl: string;
  predictedClass: string;
  confidence: number;
  isDiseased: boolean;
  plantStatus: string;
  source: string;
}

export default function HistoryScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [sensorHistory, setSensorHistory] = useState<SensorHistoryRecord[]>([]);
  const [diseaseHistory, setDiseaseHistory] = useState<DiseaseRecord[]>([]);
  const [cameraHistory, setCameraHistory] = useState<CameraPredRecord[]>([]);
  const [showAllCameraHistory, setShowAllCameraHistory] = useState(false);
  const [showAllDiseaseHistory, setShowAllDiseaseHistory] = useState(false);

  useEffect(() => {
    // Read actual history from the new sensors/history path
    const historyRef = ref(database, 'terrarium/sensors/history');
    const queryRef = query(historyRef, orderByChild('ts'), limitToLast(30));
    
    const unsubHistory = onValue(queryRef, (snapshot) => {
      if (snapshot.exists()) {
        const raw = snapshot.val();
        const records: SensorHistoryRecord[] = Object.entries(raw).map(([id, val]: any) => ({
          id,
          ts: val.ts || 0,
          timestamp: val.timestamp || '',
          temperature: val.temperature || 0,
          humidity: val.humidity || 0,
          soil: val.soil || 0,
        }));
        // Sort ascending by ts
        records.sort((a, b) => a.ts - b.ts);
        setSensorHistory(records);
      } else {
        setSensorHistory([]);
      }
      setLoading(false);
    });

    const diseaseRef = ref(database, 'terrarium/disease_history');
    const unsubDisease = onValue(diseaseRef, (snapshot) => {
      if (snapshot.exists()) {
        const raw = snapshot.val();
        const records: DiseaseRecord[] = Object.entries(raw).map(([id, val]: any) => ({
          id,
          date: val.date || '',
          time: val.time || '',
          disease: val.disease || 'Unknown',
          confidence: val.confidence || 0,
          status: val.status || 'unknown',
        })).reverse(); // newest first
        setDiseaseHistory(records);
      } else {
        setDiseaseHistory([]);
      }
    });

    const camHistRef = ref(database, 'terrarium/camera_predictions');
    const unsubCamHist = onValue(camHistRef, (snapshot) => {
      if (snapshot.exists()) {
        const raw = snapshot.val();
        const records: CameraPredRecord[] = Object.entries(raw).map(([id, val]: any) => ({
           id,
           timestamp: val.timestamp || '',
           captureType: val.captureType || '',
           imageUrl: val.imageUrl || '',
           predictedClass: val.predictedClass || 'Unknown',
           confidence: val.confidence || 0,
           isDiseased: val.isDiseased || false,
           plantStatus: val.plantStatus || '',
           source: val.source || ''
        }));
        
        // sort newest first
        records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setCameraHistory(records);
      } else {
        setCameraHistory([]);
      }
    });

    return () => {
      unsubHistory();
      unsubDisease();
      unsubCamHist();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Format labels from timestamps
  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) {
        // Fallback if not standard ISO, try to get time part if exists
        const parts = isoString.split('T');
        if (parts.length > 1) {
          return parts[1].substring(0, 5);
        }
        return isoString.substring(0, 5);
      }
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '';
    }
  };

  const labels = sensorHistory.map(r => formatTime(r.timestamp));
  // Limit labels to avoid overcrowding (e.g. show every 5th label if many points)
  const displayLabels = labels.map((l, i) => {
    if (labels.length > 8) {
      return i % Math.ceil(labels.length / 6) === 0 ? l : '';
    }
    return l;
  });

  const tempData = sensorHistory.map(r => r.temperature);
  const humData = sensorHistory.map(r => r.humidity);
  const soilData = sensorHistory.map(r => (((r.soil)) / 100));

  const hasData = sensorHistory.length > 0;

  const chartConfig = {
    backgroundColor: colors.cardBackground,
    backgroundGradientFrom: colors.cardBackground,
    backgroundGradientTo: colors.cardBackground,
    decimalPlaces: 0,
    color: (o = 1) => `rgba(46, 125, 50, ${o})`,
    labelColor: (o = 1) => colors.text.replace('#', 'rgba(').concat(`,${o})`),
    style: { borderRadius: 16 },
    propsForDots: { r: '2' },
  };

  const renderChart = (title: string, dataArr: number[], colorRgba: string, ySuffix = '') => {
    if (!hasData) return null;
    
    // Safety check just in case all data is 0 or array is empty
    const safeData = dataArr.length > 0 ? dataArr : [0];
    const safeLabels = displayLabels.length > 0 ? displayLabels : [''];

    return (
      <View style={s.chartCard}>
        <Text style={[s.sectionTitle, { marginTop: 0, marginBottom: 10, alignSelf: 'center' }]}>{title}</Text>
        <LineChart
          data={{
            labels: safeLabels,
            datasets: [{ data: safeData, color: (o = 1) => colorRgba.replace('1)', `${o})`), strokeWidth: 2 }]
          }}
          width={SCREEN_WIDTH - 48}
          height={180}
          yAxisSuffix={ySuffix}
          chartConfig={{
            ...chartConfig,
            color: (o = 1) => colorRgba.replace('1)', `${o})`)
          }}
          bezier
          style={{ borderRadius: 12 }}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLines={false}
          withHorizontalLines={true}
        />
      </View>
    );
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingTop: 50 },
    header: { paddingHorizontal: 20, marginBottom: 16 },
    title: { fontSize: 26, fontWeight: 'bold', color: colors.primary },
    scroll: { paddingHorizontal: 16, paddingBottom: 40 },
    chartCard: {
      backgroundColor: colors.cardBackground, borderRadius: 16, padding: 8,
      borderWidth: 1, borderColor: colors.border, marginBottom: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 10 },
    historyItem: {
      backgroundColor: colors.cardBackground, borderRadius: 12, padding: 14,
      marginBottom: 10, borderWidth: 1, borderColor: colors.border,
      flexDirection: 'row', alignItems: 'center',
    },
    histEmoji: { fontSize: 28, marginRight: 12 },
    histThumb: { width: 50, height: 50, borderRadius: 8, marginRight: 12, backgroundColor: colors.grey },
    histContent: { flex: 1 },
    histDisease: { fontSize: 15, fontWeight: '600', color: colors.text },
    histMeta: { fontSize: 12, color: colors.textLight, marginTop: 2 },
    histConf: { fontSize: 12, fontWeight: '600', color: colors.primary },
    histMetaStatus: { fontSize: 10, color: colors.textLight, marginTop: 4 },
    emptyBox: {
      alignItems: 'center', paddingVertical: 32, backgroundColor: colors.cardBackground,
      borderRadius: 16, borderWidth: 1, borderColor: colors.border,
      marginBottom: 16,
    },
    emptyIcon: { fontSize: 36, marginBottom: 10 },
    emptyText: { fontSize: 15, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
    emptySubText: { fontSize: 12, color: colors.textLight, textAlign: 'center', paddingHorizontal: 24 },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Statistics</Text>
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[s.sectionTitle, { padding: 8 }]}>📈 Live Sensor History</Text>
        
        {!hasData ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>📊</Text>
            <Text style={s.emptyText}>No history data yet</Text>
            <Text style={s.emptySubText}>Live sensor history will appear here after the device runs for a while.</Text>
          </View>
        ) : (
          <>
            {renderChart('Temperature', tempData, 'rgba(230, 74, 25, 1)', '°C')}
            {renderChart('Humidity', humData, 'rgba(25, 118, 210, 1)', '%')}
            {renderChart('Soil Moisture', soilData, 'rgba(46, 125, 50, 1)', '%')}
          </>
        )}

        {/* Camera Prediction history */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'space-between', padding: 8 }}>
          <Text style={[s.sectionTitle, { marginBottom: 0, flex: 1 }]}>📷 Camera Prediction History</Text>
          
          {cameraHistory.length > 2 && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: colors.textLight, marginRight: 4 }}>
                View all
              </Text>
              <TouchableOpacity 
                onPress={() => setShowAllCameraHistory(!showAllCameraHistory)}
                style={{ padding: 4, backgroundColor: colors.grey + '30', borderRadius: 4 }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 18, color: colors.primary, fontWeight: 'bold' }}>
                  {showAllCameraHistory ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
        </View>

        {cameraHistory.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>🔍</Text>
            <Text style={s.emptyText}>No predictions recorded yet.</Text>
            <Text style={s.emptySubText}>Camera predictions will appear here.</Text>
          </View>
        ) : (
          <View>
            {(showAllCameraHistory ? cameraHistory : cameraHistory.slice(0, 2)).map(record => (
              <View key={record.id} style={s.historyItem}>
                <Text style={s.histEmoji}>🎯</Text>
                <View style={s.histContent}>
                  <Text style={s.histDisease}>{record.predictedClass}</Text>
                  <Text style={s.histMeta}>{record.timestamp ? new Date(record.timestamp).toLocaleString() : ''} · {record.captureType}</Text>
                  <Text style={s.histMeta}>Confidence: {Math.round(record.confidence)}%</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[s.histConf, { color: record.isDiseased ? colors.error : colors.success }]}>
                    {record.isDiseased ? 'Diseased' : 'Healthy'}
                  </Text>
                </View>
              </View>
            ))}
            {showAllCameraHistory && cameraHistory.length > 2 && (
              <TouchableOpacity 
                style={{ alignItems: 'center', paddingVertical: 12 }} 
                onPress={() => setShowAllCameraHistory(false)}
              >
                <Text style={{ fontSize: 24, color: colors.primary, fontWeight: 'bold' }}>ᐱ</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Disease scan history */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'space-between', padding: 8 }}>
          <Text style={[s.sectionTitle, { marginBottom: 0, flex: 1 }]}>🔬 Manual Scan History</Text>
          
          {diseaseHistory.length > 2 && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: colors.textLight, marginRight: 4 }}>
                View all
              </Text>
              <TouchableOpacity 
                onPress={() => setShowAllDiseaseHistory(!showAllDiseaseHistory)}
                style={{ padding: 4, backgroundColor: colors.grey + '30', borderRadius: 4 }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 18, color: colors.primary, fontWeight: 'bold' }}>
                  {showAllDiseaseHistory ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
        </View>

        {diseaseHistory.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>📋</Text>
            <Text style={s.emptyText}>No scans recorded yet.</Text>
            <Text style={s.emptySubText}>Scan a leaf in the Detect tab — results will appear here.</Text>
          </View>
        ) : (
          <View>
            {(showAllDiseaseHistory ? diseaseHistory : diseaseHistory.slice(0, 2)).map(record => (
              <View key={record.id} style={s.historyItem}>
                <Text style={s.histEmoji}>{record.status === 'treated' ? '✅' : '⚠️'}</Text>
                <View style={s.histContent}>
                  <Text style={s.histDisease}>{record.disease}</Text>
                  <Text style={s.histMeta}>{record.date}  {record.time}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[s.histConf, { color: record.status === 'treated' ? colors.success : colors.error }]}>
                    {record.status === 'treated' ? 'Healthy' : 'Diseased'}
                  </Text>
                </View>
              </View>
            ))}
            {showAllDiseaseHistory && diseaseHistory.length > 2 && (
              <TouchableOpacity 
                style={{ alignItems: 'center', paddingVertical: 12 }} 
                onPress={() => setShowAllDiseaseHistory(false)}
              >
                <Text style={{ fontSize: 24, color: colors.primary, fontWeight: 'bold' }}>ᐱ</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
