import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image
} from 'react-native';
import { ref, onValue } from 'firebase/database';
import { database } from '../../config/firebase';
import { useAuth } from '../../config/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../../navigation/MainTabNavigator';
import { getSoilMoistureStatus } from '../../utils/sensorLogic';
import { useTheme } from '../../theme/ThemeContext';

type HomeScreenProp = BottomTabNavigationProp<MainTabParamList, 'Home'>;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning,';
  if (hour < 17) return 'Good Afternoon,';
  return 'Good Evening,';
}

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<HomeScreenProp>();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    temperature: 0,
    humidity: 0,
    soil: 0,
    waterLevel: 0,
    fertilizerLevel: 0,
    growLight: 0,
    fan: 0,
    waterPump: 0,
    fertilizerMotor: 0,
  });
  const [profile, setProfile] = useState<{ fullName?: string, photoURL?: string }>({});
  const [hasAlertedWater, setHasAlertedWater] = useState(false);
  const [hasAlertedFert, setHasAlertedFert] = useState(false);

  useEffect(() => {
    const terrariumRef = ref(database, 'terrarium');
    const unsubscribe = onValue(terrariumRef, (snapshot) => {
      if (snapshot.exists()) {
        const d = snapshot.val();
        setData({
          temperature: d.temperature || 0,
          humidity: d.humidity || 0,
          soil: d.soil || 0,
          waterLevel: d.waterLevel ?? 0,
          fertilizerLevel: d.fertilizerLevel ?? 0,
          growLight: d.growLight || 0,
          fan: d.fan || 0,
          waterPump: d.waterPump || d.water_pump || 0,
          fertilizerMotor: d.fertilizerMotor || 0,
        });
      }
      setLoading(false);
    }, (error) => {
      console.error('Sensor listener error:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const userRef = ref(database, `users/${user.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setProfile(snapshot.val());
      }
    }, (error) => {
      console.error('User profile listener error:', error);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const firstName = profile.fullName || user?.displayName || user?.email?.split('@')[0] || 'User';
  const photoURL = profile.photoURL || user?.photoURL;
  const soilStatus = getSoilMoistureStatus(data.soil);

  // Warning Pop-ups
  useEffect(() => {
    if (!loading) {
      if (data.waterLevel === 0 && !hasAlertedWater) {
        Alert.alert(
          '⚠️ Low Water Level',
          'The water level in the tank is low. Please refill it soon to ensure proper watering.',
          [{ text: 'OK' }]
        );
        setHasAlertedWater(true);
      } else if (data.waterLevel === 1 && hasAlertedWater) {
        setHasAlertedWater(false);
      }

      if (data.fertilizerLevel === 0 && !hasAlertedFert) {
        Alert.alert(
          '⚠️ Low Fertilizer Level',
          '\nDirections for use:\n\nDilute 5 grams (1 teaspoon) of Albert\'s solution in 1 liter of water and apply as a foliar spray.',
          [{ text: 'OK' }]
        );
        setHasAlertedFert(true);
      } else if (data.fertilizerLevel === 1 && hasAlertedFert) {
        setHasAlertedFert(false);
      }
    }
  }, [loading, data.waterLevel, data.fertilizerLevel, hasAlertedWater, hasAlertedFert]);

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingTop: 44, paddingHorizontal: 16 },
    // Header row
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    avatar: {
      width: 60, height: 60, borderRadius: 30,
      backgroundColor: colors.grey,
      justifyContent: 'center', alignItems: 'center',
      marginRight: 15,
      overflow: 'hidden',
    },
    avatarImage: { width: '100%', height: '100%' },
    avatarText: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
    greetingBlock: { flex: 1 },
    greetingText: { fontSize: 16, color: colors.textLight },
    usernameText: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginTop: 2 },
    bellBtn: { padding: 8 },
    bellIcon: { fontSize: 26 },
    // Welcome text
    welcomeContainer: { alignItems: 'center', marginVertical: 15 },
    welcomeText: { fontSize: 22, fontWeight: 'bold', color: colors.primary, textAlign: 'center' },
    // Sensor row
    sensorRow: { flexDirection: 'row', marginBottom: 18, gap: 8 },
    sensorCard: {
      flex: 1, backgroundColor: colors.cardBackground, borderRadius: 14,
      padding: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
    },
    sensorIcon: { fontSize: 22, marginBottom: 4 },
    sensorLabel: { fontSize: 11, color: colors.textLight, fontWeight: '500' },
    sensorValue: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginTop: 2 },
    sensorUnit: { fontSize: 11, fontWeight: 'normal', color: colors.textLight },
    sensorStatus: { fontSize: 12, fontWeight: '600', marginTop: 2 },
    // Section title
    sectionTitle: {
      fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 10,
    },
    // 2x2 Grid
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
    gridCard: {
      width: '47.5%', backgroundColor: colors.cardBackground,
      borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
    },
    gridIcon: { fontSize: 24, marginBottom: 6 },
    gridLabel: { fontSize: 13, color: colors.text, fontWeight: '600', marginBottom: 6 },
    statusRow: { flexDirection: 'row', alignItems: 'center' },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    statusText: { fontSize: 13, fontWeight: '600' },
    // Bottom two cards
    bottomRow: { flexDirection: 'row', gap: 10 },
    bottomCard: {
      flex: 1, backgroundColor: colors.cardBackground, borderRadius: 14,
      padding: 14, borderWidth: 1, borderColor: colors.border,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
    },
    // Loading
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  });

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  const StatusDot = ({ isOn }: { isOn: boolean }) => (
    <View style={s.statusRow}>
      <View style={[s.dot, { backgroundColor: isOn ? colors.success : colors.error }]} />
      <Text style={[s.statusText, { color: isOn ? colors.success : colors.error }]}>
        {isOn ? 'ON' : 'OFF'}
      </Text>
    </View>
  );

  const waterLevelHigh = data.waterLevel === 1;
  const fertLevelHigh = data.fertilizerLevel === 1;

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.headerRow}>
        <View style={s.avatar}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={s.avatarImage} />
          ) : (
            <Text style={s.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <View style={s.greetingBlock}>
          <Text style={s.greetingText}>{getGreeting()}</Text>
          <Text style={s.usernameText}>{firstName}</Text>
        </View>
        <TouchableOpacity style={s.bellBtn}>
          <Text style={s.bellIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* Welcome Message */}
      <View style={s.welcomeContainer}>
        <Text style={s.welcomeText}>Welcome to TerraAssist</Text>
      </View>

      {/* Sensor Row: Temp | Humidity | Soil */}
      <View style={s.sensorRow}>
        <View style={s.sensorCard}>
          <Text style={s.sensorIcon}>🌡️</Text>
          <Text style={s.sensorLabel}>Temperature</Text>
          <Text style={s.sensorValue}>
            {data.temperature.toFixed(1)}
            <Text style={s.sensorUnit}>°C</Text>
          </Text>
        </View>
        <View style={s.sensorCard}>
          <Text style={s.sensorIcon}>💧</Text>
          <Text style={s.sensorLabel}>Humidity</Text>
          <Text style={s.sensorValue}>
            {data.humidity.toFixed(1)}
            <Text style={s.sensorUnit}>%</Text>
          </Text>
        </View>
        <View style={s.sensorCard}>
          <Text style={s.sensorIcon}>🪴</Text>
          <Text style={s.sensorLabel}>Soil</Text>
          <Text style={[s.sensorStatus, { color: soilStatus.color === 'red' ? colors.error : colors.success }]}>
            • {soilStatus.label}
          </Text>
        </View>
      </View>

      {/* Terrarium Status */}
      <Text style={s.sectionTitle}>Terrarium Status</Text>
      <View style={s.grid}>
        <View style={s.gridCard}>
          <Text style={s.gridIcon}>💡</Text>
          <Text style={s.gridLabel}>Grow Light</Text>
          <StatusDot isOn={data.growLight === 1} />
        </View>
        <View style={s.gridCard}>
          <Text style={s.gridIcon}>🌀</Text>
          <Text style={s.gridLabel}>Fan</Text>
          <StatusDot isOn={data.fan === 1} />
        </View>
        <View style={s.gridCard}>
          <Text style={s.gridIcon}>🚿</Text>
          <Text style={s.gridLabel}>Watering</Text>
          <StatusDot isOn={data.waterPump === 1} />
        </View>
        <View style={s.gridCard}>
          <Text style={s.gridIcon}>🌿</Text>
          <Text style={s.gridLabel}>Fertilizer</Text>
          <View style={s.statusRow}>
            <View style={[s.dot, { backgroundColor: data.fertilizerMotor === 1 ? colors.success : colors.error }]} />
            <Text style={[s.statusText, { color: data.fertilizerMotor === 1 ? colors.success : colors.error }]}>
              {data.fertilizerMotor === 1 ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>

      {/* Water Level & Fertilizer Level */}
      <View style={s.bottomRow}>
        <View style={s.bottomCard}>
          <Text style={s.gridIcon}>📶</Text>
          <Text style={s.gridLabel}>Water Level</Text>
          <View style={s.statusRow}>
            <View style={[s.dot, { backgroundColor: waterLevelHigh ? colors.success : colors.error }]} />
            <Text style={[s.statusText, { color: waterLevelHigh ? colors.success : colors.error }]}>
              {waterLevelHigh ? 'High' : 'Low'}
            </Text>
          </View>
        </View>
        <View style={s.bottomCard}>
          <Text style={s.gridIcon}>📊</Text>
          <Text style={s.gridLabel}>Fertilizer Level</Text>
          <View style={s.statusRow}>
            <View style={[s.dot, { backgroundColor: fertLevelHigh ? colors.success : colors.error }]} />
            <Text style={[s.statusText, { color: fertLevelHigh ? colors.success : colors.error }]}>
              {fertLevelHigh ? 'High' : 'Low'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
