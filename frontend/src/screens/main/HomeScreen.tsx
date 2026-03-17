import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ref, onValue } from 'firebase/database';
import { database } from '../../config/firebase';
import { useAuth } from '../../config/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../../navigation/MainTabNavigator';
import EnvironmentalCard from '../../components/EnvironmentalCard';
import PlantStatusCard from '../../components/PlantStatusCard';
import { getSoilMoistureStatus } from '../../utils/sensorLogic';
import { colors } from '../../theme/colors';

type HomeScreenProp = BottomTabNavigationProp<MainTabParamList, 'Home'>;

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<HomeScreenProp>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Realtime state
  const [sensors, setSensors] = useState({
    temperature: 0,
    humidity: 0,
    soil: 0,
    waterLevel: 0,
    fertilizerLevel: 0,
  });

  const [controls, setControls] = useState({
    fan: 0,
    light: 0,
    water_pump: 0,
    fertilizerMotor: 0,
  });

  useEffect(() => {
    const terrariumRef = ref(database, 'terrarium');

    // Listener for all Terrarium Data (Flat Structure)
    const unsubscribe = onValue(terrariumRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setSensors({
          temperature: data.temperature || 0,
          humidity: data.humidity || 0,
          soil: data.soil || 0,
          waterLevel: data.waterLevel || 0,
          fertilizerLevel: data.fertilizerLevel || 0,
        });
        setControls({
          fan: data.fan || 0,
          light: data.growLight || 0,
          water_pump: data.waterPump || data.water_pump || 0,
          fertilizerMotor: data.fertilizerMotor || 0,
        });
        setLoading(false);
      } else {
        setError('No terrarium data found');
        setLoading(false);
      }
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Fetching terrarium data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.errorSubText}>Please check your connection or Firebase config.</Text>
      </View>
    );
  }

  const soilStatus = getSoilMoistureStatus(sensors.soil);

  return (
    <View style={styles.container}>
      {/* Top Bar Area */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.iconText}>🔔</Text>
          {/* TODO: Add red dot badge logic for unread alerts */}
        </TouchableOpacity>
        
        <Text style={styles.logoText}>TerraAssist</Text>
        
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileCircle}>
           <Text style={styles.profileInitials}>
             {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
           </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.welcomeText}>
          Welcome to TerraAssist 🌿
        </Text>

        {/* Environmental Cards Row */}
        <View style={styles.envRow}>
          <EnvironmentalCard 
            icon="🌡️" 
            title="Temperature" 
            value={sensors.temperature.toFixed(1)} 
            unit="°C" 
          />
          <EnvironmentalCard 
            icon="💧" 
            title="Humidity" 
            value={sensors.humidity} 
            unit="%" 
          />
        </View>

        <Text style={styles.sectionTitle}>Plant Status</Text>

        {/* Plant Status Grid */}
        <View style={styles.grid}>
          <PlantStatusCard 
            icon="🌱" 
            label="Soil Moisture" 
            valueText={soilStatus.label} 
            statusDotColor={soilStatus.color as 'green' | 'red'} 
          />
          <PlantStatusCard 
            icon="💡" 
            label="Grow Light" 
            valueText={controls.light === 1 ? 'ON' : 'OFF'} 
            statusDotColor={controls.light === 1 ? 'green' : 'red'} 
          />
          <PlantStatusCard 
            icon="🌀" 
            label="Fan" 
            valueText={controls.fan === 1 ? 'ON' : 'OFF'} 
            statusDotColor={controls.fan === 1 ? 'green' : 'red'} 
          />
          <PlantStatusCard 
            icon="🚿" 
            label="Watering" 
            valueText={controls.water_pump === 1 ? 'ON' : 'OFF'} 
            statusDotColor={controls.water_pump === 1 ? 'green' : 'red'} 
          />
          <PlantStatusCard 
            icon="🌿" 
            label="Fertilizer" 
            valueText={controls.fertilizerMotor === 1 ? 'Active' : 'Inactive'} 
            statusDotColor={controls.fertilizerMotor === 1 ? 'green' : 'red'} 
          />
          <PlantStatusCard 
            icon="💧" 
            label="Water Level" 
            valueText={sensors.waterLevel === 1 ? 'High' : 'Low'} 
            statusDotColor={sensors.waterLevel === 1 ? 'green' : 'red'} 
          />
          <PlantStatusCard 
            icon="🌾" 
            label="Fertilizer Level" 
            valueText={sensors.fertilizerLevel === 1 ? 'High' : 'Low'} 
            statusDotColor={sensors.fertilizerLevel === 1 ? 'green' : 'red'} 
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => navigation.navigate('Detect')}
          >
             <Text style={styles.actionButtonText}>Check Plant Health 🌿</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryAction]} 
            onPress={() => navigation.navigate('History')}
          >
             <Text style={[styles.actionButtonText, styles.secondaryActionText]}>View History 📊</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: colors.primary,
    fontSize: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubText: {
    color: colors.textLight,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 50, // Safe area approx
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  iconButton: {
    padding: 8,
  },
  iconText: {
    fontSize: 24,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: colors.secondary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 20,
  },
  envRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionsContainer: {
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryAction: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryActionText: {
    color: colors.primary,
  },
});
