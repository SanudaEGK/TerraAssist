import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { ref, query, orderByKey, limitToLast, onValue } from 'firebase/database';
import { database } from '../../config/firebase';
import { colors } from '../../theme/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function HistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [currentTemp, setCurrentTemp] = useState(0);
  const [currentHumidity, setCurrentHumidity] = useState(0);

  useEffect(() => {
    const terrariumRef = ref(database, 'terrarium');
    const unsubscribe = onValue(terrariumRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setCurrentTemp(data.temperature || 0);
        setCurrentHumidity(data.humidity || 0);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Chart uses current value to anchor a simulated day-trend (replace with real history node later)
  const tempData = [
    currentTemp - 3,
    currentTemp - 1,
    currentTemp + 1,
    currentTemp + 2,
    currentTemp,
    currentTemp - 1,
  ].map(v => parseFloat(v.toFixed(1)));

  const humData = [
    currentHumidity - 5,
    currentHumidity,
    currentHumidity + 3,
    currentHumidity - 2,
    currentHumidity + 1,
    currentHumidity,
  ].map(v => parseFloat(v.toFixed(1)));

  const chartConfig = {
    backgroundColor: colors.secondary,
    backgroundGradientFrom: colors.secondary,
    backgroundGradientTo: colors.secondary,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(80, 80, 80, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: '5', strokeWidth: '2', stroke: colors.primary },
  };

  const tempChartData = {
    labels: ['6am', '9am', '12pm', '3pm', '6pm', '9pm'],
    datasets: [{ data: tempData, strokeWidth: 2 }],
  };

  const humChartData = {
    labels: ['6am', '9am', '12pm', '3pm', '6pm', '9pm'],
    datasets: [{ data: humData, color: (opacity = 1) => `rgba(129, 199, 132, ${opacity})`, strokeWidth: 2 }],
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History & Trends</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionTitle}>🌡️ Temperature (°C)</Text>
        <View style={styles.chartCard}>
          <LineChart
            data={tempChartData}
            width={SCREEN_WIDTH - 48}
            height={180}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        <Text style={styles.sectionTitle}>💧 Humidity (%)</Text>
        <View style={styles.chartCard}>
          <LineChart
            data={humChartData}
            width={SCREEN_WIDTH - 48}
            height={180}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(129, 199, 132, ${opacity})`,
            }}
            bezier
            style={styles.chart}
          />
        </View>

        <Text style={styles.sectionTitle}>🔬 Disease Scan History</Text>
        <View style={styles.emptyHistory}>
          <Text style={styles.emptyHistoryIcon}>📋</Text>
          <Text style={styles.emptyHistoryText}>No scans recorded yet.</Text>
          <Text style={styles.emptyHistorySubText}>
            Tap "Detect" to scan a leaf — results will appear here.
          </Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  chartCard: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  chart: {
    borderRadius: 12,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  emptyHistoryIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyHistoryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  emptyHistorySubText: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
