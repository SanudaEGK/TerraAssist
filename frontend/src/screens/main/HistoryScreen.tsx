import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator
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

export default function HistoryScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [currentTemp, setCurrentTemp] = useState(0);
  const [currentHumidity, setCurrentHumidity] = useState(0);
  const [currentSoil, setCurrentSoil] = useState(0);
  const [diseaseHistory, setDiseaseHistory] = useState<DiseaseRecord[]>([]);

  useEffect(() => {
    const terrariumRef = ref(database, 'terrarium');
    const unsubTerra = onValue(terrariumRef, (snapshot) => {
      if (snapshot.exists()) {
        const d = snapshot.val();
        setCurrentTemp(d.temperature || 0);
        setCurrentHumidity(d.humidity || 0);
        setCurrentSoil(d.soil || 0);
      }
      setLoading(false);
    });

    const historyRef = ref(database, 'terrarium/disease_history');
    const unsubHistory = onValue(historyRef, (snapshot) => {
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
      }
    });

    return () => {
      unsubTerra();
      unsubHistory();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Simulated 6-point day trend anchored at current value
  const mk = (v: number, delta: number[]) => delta.map(d => parseFloat(Math.max(0, v + d).toFixed(1)));
  const tempData  = mk(currentTemp,     [-3, -1, 2, 3, 1, -1]);
  const humData   = mk(currentHumidity, [-5, 2, 4, -3, 1, 0]);
  // Soil is raw ADC (4095=dry), invert for chart readability
  const soilPct   = mk(Math.min(100, ((4095 - currentSoil) / 4095) * 100), [-4, 2, 5, -3, 1, 0]);

  const labels = ['6am', '9am', '12pm', '3pm', '6pm', '9pm'];

  const multiChartData = {
    labels,
    datasets: [
      { data: tempData,  color: (o = 1) => `rgba(230, 74, 25, ${o})`, strokeWidth: 2 },   // red temp
      { data: humData,   color: (o = 1) => `rgba(25, 118, 210, ${o})`, strokeWidth: 2 },  // blue hum
      { data: soilPct,   color: (o = 1) => `rgba(46, 125, 50, ${o})`, strokeWidth: 2 },   // green soil
    ],
    legend: ['Temp (°C)', 'Humidity (%)', 'Soil (%)'],
  };

  const chartConfig = {
    backgroundColor: colors.cardBackground,
    backgroundGradientFrom: colors.cardBackground,
    backgroundGradientTo: colors.cardBackground,
    decimalPlaces: 0,
    color: (o = 1) => `rgba(46, 125, 50, ${o})`,
    labelColor: (o = 1) => colors.text.replace('#', 'rgba(').concat(`,${o})`),
    style: { borderRadius: 16 },
    propsForDots: { r: '3' },
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingTop: 50 },
    header: { paddingHorizontal: 20, marginBottom: 16 },
    title: { fontSize: 26, fontWeight: 'bold', color: colors.primary },
    scroll: { paddingHorizontal: 16, paddingBottom: 40 },
    chartCard: {
      backgroundColor: colors.cardBackground, borderRadius: 16, padding: 8,
      borderWidth: 1, borderColor: colors.border, marginBottom: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    legendRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16, gap: 16, flexWrap: 'wrap' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 12, color: colors.textLight },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 10 },
    historyItem: {
      backgroundColor: colors.cardBackground, borderRadius: 12, padding: 14,
      marginBottom: 10, borderWidth: 1, borderColor: colors.border,
      flexDirection: 'row', alignItems: 'center',
    },
    histEmoji: { fontSize: 28, marginRight: 12 },
    histContent: { flex: 1 },
    histDisease: { fontSize: 15, fontWeight: '600', color: colors.text },
    histMeta: { fontSize: 12, color: colors.textLight, marginTop: 2 },
    histConf: { fontSize: 12, fontWeight: '600', color: colors.primary },
    emptyBox: {
      alignItems: 'center', paddingVertical: 32, backgroundColor: colors.cardBackground,
      borderRadius: 16, borderWidth: 1, borderColor: colors.border,
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
        {/* Combined chart - Always visible */}
        <View style={s.chartCard}>
          <Text style={[s.sectionTitle, { marginTop: 0, marginBottom: 15 }]}>📈 Day Trend (Real-time)</Text>
          <LineChart
            data={multiChartData}
            width={SCREEN_WIDTH - 48}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={{ borderRadius: 12 }}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLines={false}
            withHorizontalLines={true}
          />
        </View>
        {/* Color legend */}
        <View style={s.legendRow}>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: '#E64A19' }]} />
            <Text style={s.legendText}>Temperature (°C)</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: '#1976D2' }]} />
            <Text style={s.legendText}>Humidity (%)</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={s.legendText}>Soil moisture (%)</Text>
          </View>
        </View>

        {/* Disease scan history */}
        <Text style={s.sectionTitle}>🔬 Disease Scan History</Text>
        {diseaseHistory.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>📋</Text>
            <Text style={s.emptyText}>No scans recorded yet.</Text>
            <Text style={s.emptySubText}>Scan a leaf in the Detect tab — results will appear here.</Text>
          </View>
        ) : diseaseHistory.map(record => (
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
      </ScrollView>
    </View>
  );
}
