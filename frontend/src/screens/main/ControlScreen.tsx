import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { ref, onValue, set } from 'firebase/database';
import { database } from '../../config/firebase';
import ControlCard from '../../components/ControlCard';
import { calculateFertilizerDaysRemaining, getTodayDateString } from '../../utils/fertilizerLogic';
import { colors } from '../../theme/colors';

export default function ControlScreen() {
  const [loading, setLoading] = useState(true);
  const [soilMoisture, setSoilMoisture] = useState<number>(0);

  const [controls, setControls] = useState({
    fan: 0,
    fanMode: 'auto',
    light: 0,
    lightMode: 'auto',
    water_pump: 0,
    water_pumpMode: 'auto',
    fertilizerMotor: 0,
    fertilizerLastActivated: '',
  });

  useEffect(() => {
    const terrariumRef = ref(database, 'terrarium');

    const unsubscribe = onValue(terrariumRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setControls({
          fan: data.fan || 0,
          fanMode: data.fanMode || 'auto',
          light: data.growLight || 0,
          lightMode: data.growLightMode || 'auto',
          water_pump: data.waterPump || data.water_pump || 0,
          water_pumpMode: data.waterPumpMode || data.water_pumpMode || 'auto',
          fertilizerMotor: data.fertilizerMotor || 0,
          fertilizerLastActivated: data.fertilizerLastActivated || '',
        });
        setSoilMoisture(data.soil || 0);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const updateControl = async (device: string, value: any) => {
    try {
      await set(ref(database, `terrarium/${device}`), value);
    } catch (error) {
      console.error(`Error updating ${device}: `, error);
      Alert.alert('Error', 'Failed to update control. Please try again.');
    }
  };

  const handleFanToggle = (isOn: boolean) => updateControl('fan', isOn ? 1 : 0);
  const handleFanModeToggle = (isAuto: boolean) => updateControl('fanMode', isAuto ? 'auto' : 'manual');

  const handleLightToggle = (isOn: boolean) => updateControl('growLight', isOn ? 1 : 0);
  const handleLightModeToggle = (isAuto: boolean) => updateControl('growLightMode', isAuto ? 'auto' : 'manual');

  const handleWaterPumpModeToggle = (isAuto: boolean) => updateControl('waterPumpMode', isAuto ? 'auto' : 'manual');

  const handleWaterPumpToggle = (isOn: boolean) => {
    // Turning OFF is always allowed safely
    if (!isOn) {
      updateControl('waterPump', 0);
      return;
    }

    // Turning ON requires checking soil moisture logic. > 2800 is Dry.
    if (soilMoisture <= 2800) {
      Alert.alert(
        'No water needed at this time.',
        'Please confirm if you want to add water.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            style: 'destructive',
            onPress: () => updateControl('waterPump', 1)
          }
        ]
      );
    } else {
      // Actually dry, turn on directly
      updateControl('waterPump', 1);
    }
  };

  const handleFertilizerToggle = (isOn: boolean) => {
    if (isOn) {
      // Activate fertilizer and save today's date
      updateControl('fertilizerMotor', 1);
      updateControl('fertilizerLastActivated', getTodayDateString());
    } else {
      updateControl('fertilizerMotor', 0);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const fertilizerDaysRemaining = calculateFertilizerDaysRemaining(controls.fertilizerLastActivated);
  const isFertilizerLocked = fertilizerDaysRemaining > 0 && controls.fertilizerLastActivated !== '';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Terrarium Controls</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Fan Control */}
        <ControlCard
          title="Fan"
          icon="🌀"
          isAuto={controls.fanMode === 'auto'}
          isOn={controls.fan === 1}
          autoMessage="Auto — controlled by temp & humidity"
          onToggleDevice={handleFanToggle}
          onToggleMode={handleFanModeToggle}
        />

        {/* Grow Light Control */}
        <ControlCard
          title="Grow Light"
          icon="💡"
          isAuto={controls.lightMode === 'auto'}
          isOn={controls.light === 1}
          autoMessage="Auto — controlled by system schedule"
          onToggleDevice={handleLightToggle}
          onToggleMode={handleLightModeToggle}
        />

        {/* Water Pump Control */}
        <ControlCard
          title="Water Pump"
          icon="🚿"
          isAuto={controls.water_pumpMode === 'auto'}
          isOn={controls.water_pump === 1}
          autoMessage="Auto — controlled by soil moisture"
          onToggleDevice={handleWaterPumpToggle}
          onToggleMode={handleWaterPumpModeToggle}
        />

        {/* Fertilizer Control (Manual Only logic as per prompt implicitly, no mode toggle mentioned, but we will keep consistent UI) */}
        <ControlCard
          title="Fertilizer"
          icon="🌾"
          isAuto={false} // Assuming fertilizer doesn't have an auto/manual mode switch based on prompt description
          isOn={controls.fertilizerMotor === 1}
          autoMessage="" // Not used since isAuto is false
          onToggleDevice={handleFertilizerToggle}
          // mode toggle is hidden by passing isAuto={false} and adjusting card if we want, or stubbing it
          onToggleMode={() => { }}
          disabledOverride={isFertilizerLocked}
          overrideMessage={`Available in ${fertilizerDaysRemaining} days. (Last added ${30 - fertilizerDaysRemaining} days ago)`}
          customStatusLabel={isFertilizerLocked ? 'Locked' : (controls.fertilizerMotor === 1 ? 'Transmitting ON' : 'Ready')}
        />

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
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
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
});
