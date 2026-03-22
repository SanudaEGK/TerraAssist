import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ref, onValue, set, update } from 'firebase/database';
import { database } from '../../config/firebase';
import ControlCard from '../../components/ControlCard';
import { calculateFertilizerDaysRemaining, getTodayDateString } from '../../utils/fertilizerLogic';
import { useTheme } from '../../theme/ThemeContext';

export default function ControlScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [soilMoisture, setSoilMoisture] = useState<number>(0);
  
  const [controls, setControls] = useState({
    sensors: {
      soil: 0,
      waterLevel: 0,
      fertilizerLevel: 0,
    },
    devices: {
      fan: { isOn: false, autoRecommended: false },
      waterPump: { isOn: false, autoRecommended: false },
      growLight: { isOn: false, autoRecommended: false },
      fertilizer: {
        isOn: false,
        status: 'idle',
        daysRemaining: 0,
        lastActivatedAt: '',
        nextActivationAt: '',
        durationSec: 15,
        reminderTomorrow: false,
        firstRunDone: false,
      }
    }
  });

  useEffect(() => {
    // 1. Listen for LIVE SENSORS
    const sensorsRef = ref(database, 'terrarium/sensors/current');
    const unsubscribeSensors = onValue(sensorsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setControls(prev => ({
          ...prev,
          sensors: {
            soil: data.soil || 0,
            waterLevel: data.waterLevel ?? 0,
            fertilizerLevel: data.fertilizerLevel ?? 0,
          }
        }));
      }
      setLoading(false);
    });

    // 2. Listen for DEVICE STATE
    const stateRef = ref(database, 'terrarium/state');
    const unsubscribeState = onValue(stateRef, (snapshot) => {
      if (snapshot.exists()) {
        const s = snapshot.val();
        setControls(prev => ({
          ...prev,
          devices: {
            fan: { 
              isOn: !!s.fan?.isOn, 
              autoRecommended: !!s.fan?.autoRecommended 
            },
            waterPump: { 
              isOn: !!s.waterPump?.isOn, 
              autoRecommended: !!s.waterPump?.autoRecommended 
            },
            growLight: { 
              isOn: !!s.growLight?.isOn, 
              autoRecommended: !!s.growLight?.autoRecommended 
            },
            fertilizer: {
              isOn: !!s.fertilizer?.isOn,
              status: s.fertilizer?.status || 'idle',
              daysRemaining: s.fertilizer?.daysRemaining || 0,
              lastActivatedAt: s.fertilizer?.lastActivatedAt || '',
              nextActivationAt: s.fertilizer?.nextActivationAt || '',
              durationSec: s.fertilizer?.durationSec || 15,
              reminderTomorrow: !!s.fertilizer?.reminderTomorrow,
              firstRunDone: !!s.fertilizer?.firstRunDone,
            }
          }
        }));
      }
    });

    return () => {
      unsubscribeSensors();
      unsubscribeState();
    };
  }, []);

  const handleDeviceToggle = (device: string, nextOn: boolean) => {
    if (nextOn) {
      set(ref(database, `terrarium/commands/${device}/manualRequest`), 1);
    } else {
      const deviceData = (controls.devices as any)[device];
      if (deviceData?.autoRecommended) {
        Alert.alert(
          'Warning',
          `The ${device.replace(/([A-Z])/g, ' $1').toLowerCase()} should be on at this time. Do you still want to turn it off?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Confirm', style: 'destructive', onPress: () => {
              set(ref(database, `terrarium/commands/${device}/forceOffRequest`), 1);
            }}
          ]
        );
      } else {
        set(ref(database, `terrarium/commands/${device}/forceOffRequest`), 1);
      }
    }
  };

  const handleFertilizerFirstRun = (nextOn: boolean) => {
    if (!nextOn) return; // Logic only handles activation
    if (controls.devices.fertilizer.firstRunDone) {
      Alert.alert('Automatic Mode', 'The first run is complete. The system now operates fully automatically every 30 days.');
      return;
    }
    
    Alert.alert(
      'Start Fertilizer Cycle',
      'This will set today as the start day for the 30-day automatic cycle. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => set(ref(database, 'terrarium/commands/fertilizer/firstRunRequest'), 1) }
      ]
    );
  };

  useEffect(() => {
    if (controls.devices.fertilizer.reminderTomorrow) {
      Alert.alert(
        'Fertilizer Reminder',
        'The fertilizer is scheduled to be sprayed automatically tomorrow.',
        [{ text: 'Dismiss' }]
      );
    }
  }, [controls.devices.fertilizer.reminderTomorrow]);

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isFertilizerLocked = (controls.devices.fertilizer.daysRemaining || 0) > 0;
  
  let fertilizerStatusLabel = 'Ready';
  if (isFertilizerLocked) {
    fertilizerStatusLabel = 'Locked';
  } else if (controls.devices.fertilizer.status === 'running' || controls.devices.fertilizer.isOn) {
    fertilizerStatusLabel = 'Spraying';
  } else if (controls.sensors.fertilizerLevel === 0 || controls.devices.fertilizer.status === 'tank_low') {
    fertilizerStatusLabel = 'Tank Low';
  }
  
  const fertilizerDaysRemaining = controls.devices.fertilizer.daysRemaining || 0;

  const fertilizerLocked = controls.devices.fertilizer.firstRunDone;
  const fertilizerMessage = `Last: ${controls.devices.fertilizer.lastActivatedAt || 'Never'}
Duration: ${controls.devices.fertilizer.durationSec}s
Next run in: ${fertilizerDaysRemaining} days`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.primary }]}>Terrarium Controls</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ControlCard
          title="Fan"
          icon="𖣘"
          isAuto={true}
          isOn={controls.devices.fan.isOn}
          autoMessage={controls.devices.fan.isOn ? "Fan is ON (Auto Recommendation)" : "Fan is OFF"}
          onToggleDevice={(val) => handleDeviceToggle('fan', val)}
          onToggleMode={() => { }}
          disabledOverride={false}
        />

        <ControlCard
          title="Grow Light"
          icon="💡"
          isAuto={true}
          isOn={controls.devices.growLight.isOn}
          autoMessage={controls.devices.growLight.isOn ? "runs daily from 8:00 AM to 6:00 PM" : "Light is OFF"}
          onToggleDevice={(val) => handleDeviceToggle('growLight', val)}
          onToggleMode={() => { }}
          disabledOverride={false}
        />

        <ControlCard
          title="Water Pump"
          icon="🚿"
          isAuto={true}
          isOn={controls.devices.waterPump.isOn}
          autoMessage={controls.devices.waterPump.isOn ? "Watering in progress" : "Watering system idle"}
          onToggleDevice={(val) => handleDeviceToggle('waterPump', val)}
          onToggleMode={() => { }}
          disabledOverride={false}
        />

        <ControlCard
          title="Fertilizer"
          icon="🌾"
          isAuto={true}
          isOn={controls.devices.fertilizer.status === 'running' || controls.devices.fertilizer.isOn}
          autoMessage="Automatic — runs every 30 days"
          onToggleDevice={handleFertilizerFirstRun}
          onToggleMode={() => { }}
          disabledOverride={fertilizerLocked}
          overrideMessage={fertilizerLocked ? fertilizerMessage : 'Tap to set Start Day (Manual First Run)'}
          customStatusLabel={fertilizerStatusLabel}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  durationContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 20,
  },
  durationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  durationBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  durationText: {
    fontSize: 14,
  }
});
