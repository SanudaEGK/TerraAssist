import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, Modal, ScrollView
} from 'react-native';
import { ref, onValue, set, update } from 'firebase/database';
import { database } from '../../config/firebase';
import { useAuth } from '../../config/AuthContext';
import { calculateFertilizerDaysRemaining, getTodayDateString } from '../../utils/fertilizerLogic';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../../navigation/MainTabNavigator';
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
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const pendingUpdates = React.useRef<Record<string, number>>({});

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    sensors: {
      temperature: 0,
      humidity: 0,
      soil: 0,
      soilStatus: '',
      waterLevel: 0,
      fertilizerLevel: 0,
      lastUpdated: '',
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
        reminderTomorrow: false,
        firstRunDone: false
      },
    }
  });
  const [profile, setProfile] = useState<{ fullName?: string, photoURL?: string }>({});
  
  const [hasAlertedWater, setHasAlertedWater] = useState(false);
  const [hasAlertedFert, setHasAlertedFert] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [cameraPred, setCameraPred] = useState<any>({});
  const [cameraStatus, setCameraStatus] = useState('offline');
  const [latestAlertInfo, setLatestAlertInfo] = useState<any>(null);
  const [hasShownSessionWarning, setHasShownSessionWarning] = useState(false);
  const [hasShownFertReminder, setHasShownFertReminder] = useState(false);

  useEffect(() => {
    // 1. Current Sensors Listener
    const sensorsRef = ref(database, 'terrarium/sensors/current');
    const unsubscribeSensors = onValue(sensorsRef, (snapshot) => {
      if (snapshot.exists()) {
        const d = snapshot.val();
        setData(prev => ({
          ...prev,
          sensors: {
            temperature: d.temperature || 0,
            humidity: d.humidity || 0,
            soil: d.soil || 0,
            soilStatus: d.soilStatus || '',
            waterLevel: d.waterLevel ?? 0,
            fertilizerLevel: d.fertilizerLevel ?? 0,
            lastUpdated: d.lastUpdated || new Date().toLocaleTimeString(),
          }
        }));
      }
      setLoading(false);
    });

    // 2. Device State Listener
    const stateRef = ref(database, 'terrarium/state');
    const unsubscribeState = onValue(stateRef, (snapshot) => {
      if (snapshot.exists()) {
        const s = snapshot.val();
        setData(prev => ({
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
              reminderTomorrow: !!s.fertilizer?.reminderTomorrow,
              firstRunDone: !!s.fertilizer?.firstRunDone,
            }
          }
        }));
      }
    });

    const camPredRef = ref(database, 'terrarium/latest_camera_prediction');
    const unsubCamPred = onValue(camPredRef, snap => setCameraPred(snap.val() || {}));

    const camStatRef = ref(database, 'terrarium/camera/status');
    const unsubCamStat = onValue(camStatRef, snap => setCameraStatus(snap.val() || 'offline'));

    const alertRef = ref(database, 'terrarium/latest_camera_alert');
    const unsubAlert = onValue(alertRef, snap => {
      if (snap.exists()) {
        setLatestAlertInfo(snap.val());
      } else {
        setLatestAlertInfo(null);
      }
    });

    return () => {
      unsubscribeSensors();
      unsubscribeState();
      unsubCamPred();
      unsubCamStat();
      unsubAlert();
    };
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

  // 3. Soil Status Logic (Hardcoded thresholds as requested)
  let displaySoilStatus = 'Wet';
  if (data.sensors.soil > 2800) displaySoilStatus = 'Dry';
  else if (data.sensors.soil > 1500) displaySoilStatus = 'Normal';

  let soilColor = colors.success;
  if (displaySoilStatus === 'Dry') {
    soilColor = colors.error;
  } else if (displaySoilStatus === 'Wet') {
    soilColor = '#1976D2';
  }

  useEffect(() => {
    if (!loading) {
      if (data.sensors.waterLevel === 0 && !hasAlertedWater) {
        Alert.alert(
          '⚠️ Low Water Level',
          'The water level in the tank is low. Please refill it soon to ensure proper watering.',
          [{ text: 'OK' }]
        );
        setHasAlertedWater(true);
      } else if (data.sensors.waterLevel === 1 && hasAlertedWater) {
        setHasAlertedWater(false);
      }

      if (data.sensors.fertilizerLevel === 0 && !hasAlertedFert) {
        Alert.alert(
          '⚠️ Low Fertilizer Level',
          '\nDirections for use:\n\nDilute 5 grams (1 teaspoon) of Albert\'s solution in 1 liter of water and apply as a foliar spray.',
          [{ text: 'OK' }]
        );
        setHasAlertedFert(true);
      } else if (data.sensors.fertilizerLevel === 1 && hasAlertedFert) {
        setHasAlertedFert(false);
      }

      // --- Automated Fertilizer Logic (Using Hardware Status) ---
      if (data.devices.fertilizer.reminderTomorrow && !hasShownFertReminder) {
          setHasShownFertReminder(true);
          Alert.alert(
            'Fertilizer Reminder',
            'Fertilizer will be sprayed again tomorrow',
            [{ text: 'OK' }]
          );
      } else if (!data.devices.fertilizer.reminderTomorrow) {
          setHasShownFertReminder(false);
      }
      // ----------------------------------------------------

      // Camera Alert persistent login popup
      const isActivelyDiseased = cameraPred && (cameraPred.isDiseased === true || cameraPred.plantStatus === 'DISEASED');
      const activeData = cameraPred;

      if (isActivelyDiseased && !hasShownSessionWarning && activeData?.predictedClass) {
        setHasShownSessionWarning(true);
        Alert.alert(
          '⚠️ Disease Detected by Camera',
          `A recent scan indicates your plant may be diseased.\n\nPredicted: ${activeData.predictedClass} (${activeData.confidence ? Math.round(activeData.confidence) + '%' : 'N/A'})`,
          [
            { text: 'Dismiss', style: 'cancel' },
            { text: 'View Treatment Guide', onPress: () => {
              navigation.navigate('DiseaseAlert', {
                diseaseInfo: {
                  predicted_class: activeData.predictedClass,
                  confidence: activeData.confidence || 100,
                  is_diseased: true,
                  isCameraAlert: true
                }
              });
            }}
          ]
        );
      }
    }
  }, [loading, data.sensors.waterLevel, data.sensors.fertilizerLevel, hasAlertedWater, hasAlertedFert, cameraPred, latestAlertInfo, hasShownSessionWarning]);

  const notifications: any[] = [];
  if (data.sensors.waterLevel === 0) {
    notifications.push({ id: 1, title: 'Low Water Level', desc: 'The water level in the tank is low. Please refill it.', icon: '💧' });
  }
  if (data.sensors.fertilizerLevel === 0) {
    notifications.push({ id: 2, title: 'Low Fertilizer', desc: `Dilute 5g/L of Albert's solution.`, icon: '🌾' });
  }
  
  const isActivelyDiseased = cameraPred && (cameraPred.isDiseased === true || cameraPred.plantStatus === 'DISEASED');
  const activeData = cameraPred;

  if (isActivelyDiseased && activeData?.predictedClass) {
    notifications.push({ 
      id: 3, 
      title: 'Disease Detected by Camera', 
      desc: `Tap to view the treatment guide for ${activeData.predictedClass}.`, 
      icon: '🔴',
      isDisease: true,
      alertData: activeData
    });
  }

  const hasNotifications = notifications.length > 0;

  const s = StyleSheet.create({
    container: { 
      flex: 1, backgroundColor: colors.background, paddingTop: 44, paddingBottom: 10, paddingHorizontal: 16,
      justifyContent: 'space-evenly' 
    },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    avatar: {
      width: 52, height: 52, borderRadius: 26,
      backgroundColor: colors.grey, justifyContent: 'center', alignItems: 'center',
      marginRight: 12, overflow: 'hidden',
    },
    avatarImage: { width: '100%', height: '100%' },
    avatarText: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
    greetingBlock: { flex: 1 },
    greetingText: { fontSize: 14, color: colors.textLight },
    usernameText: { fontSize: 18, fontWeight: 'bold', color: colors.text },
    bellBtn: { padding: 8, position: 'relative' },
    bellIcon: { fontSize: 28 },
    redDot: {
      position: 'absolute', top: 5, right: 5, width: 12, height: 12, borderRadius: 6,
      backgroundColor: colors.error, borderWidth: 1, borderColor: colors.cardBackground,
    },
    welcomeContainer: { alignItems: 'center' },
    welcomeText: { fontSize: 20, fontWeight: 'bold', color: colors.primary, textAlign: 'center' },
    sensorRow: { flexDirection: 'row', gap: 10 },
    sensorCard: {
      flex: 1, backgroundColor: colors.cardBackground, borderRadius: 12,
      paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
      elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width:0, height:1 }
    },
    sensorIcon: { fontSize: 22, marginBottom: 4 },
    sensorLabel: { fontSize: 11, color: colors.textLight, fontWeight: '500' },
    sensorValue: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
    sensorUnit: { fontSize: 11, fontWeight: 'normal', color: colors.textLight },
    sensorStatus: { fontSize: 12, fontWeight: '600', marginTop: 4 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    gridCard: {
      width: '48%', backgroundColor: colors.cardBackground, borderRadius: 12, padding: 12,
      borderWidth: 1, borderColor: colors.border, elevation: 1
    },
    gridIcon: { fontSize: 22, marginBottom: 4 },
    gridLabel: { fontSize: 13, color: colors.text, fontWeight: '600', marginBottom: 4 },
    statusRow: { flexDirection: 'row', alignItems: 'center' },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    statusText: { fontSize: 13, fontWeight: '600' },
    cameraCard: {
      backgroundColor: colors.cardBackground, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border,
      elevation: 1,
    },
    camHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    cameraCardTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
    redBadgeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.error },
    camRow: { flexDirection: 'row' },
    camSmallText: { fontSize: 13, color: colors.text, marginBottom: 4 },
    badgeBox: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 8, alignSelf: 'flex-start' },
    badgeTxt: { fontSize: 11, color: '#fff', fontWeight: 'bold' },
    cameraBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' },
    cameraBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    
    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContainer: { backgroundColor: colors.cardBackground, borderRadius: 16, width: '100%', padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
    closeBtn: { padding: 4 },
    closeIcon: { fontSize: 20, color: colors.textLight, fontWeight: 'bold' },
    emptyNotif: { textAlign: 'center', color: colors.textLight, marginTop: 10, marginBottom: 10 },
    notifCard: {
      flexDirection: 'row', backgroundColor: colors.background, borderRadius: 12, padding: 12, marginBottom: 10,
      borderWidth: 1, borderColor: colors.border, alignItems: 'center'
    },
    notifIcon: { fontSize: 24, marginRight: 12 },
    notifContent: { flex: 1 },
    notifTitle: { fontSize: 15, fontWeight: 'bold', color: colors.error, marginBottom: 2 },
    notifDesc: { fontSize: 12, color: colors.text, lineHeight: 16 },
  });

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  const StatusDot = ({ isOn, rec }: { isOn: boolean, rec?: boolean }) => (
    <View>
      <View style={s.statusRow}>
        <View style={[s.dot, { backgroundColor: isOn ? colors.success : colors.error }]} />
        <Text style={[s.statusText, { color: isOn ? colors.success : colors.error }]}>
          {isOn ? 'ON' : 'OFF'}
        </Text>
      </View>
      {rec && (
        <View style={{ marginTop: 2, backgroundColor: '#E3F2FD', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, alignSelf: 'flex-start' }}>
          <Text style={{ fontSize: 8, color: '#1565C0', fontWeight: 'bold' }}>AUTO REC</Text>
        </View>
      )}
    </View>
  );

  const waterLevelHigh = data.sensors.waterLevel === 1;
  const fertLevelHigh = data.sensors.fertilizerLevel === 1;

  return (
    <View style={s.container}>
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
        <TouchableOpacity style={s.bellBtn} onPress={() => setShowModal(true)}>
          <Text style={s.bellIcon}>🔔</Text>
          {hasNotifications && <View style={s.redDot} />}
        </TouchableOpacity>
      </View>

      <View style={s.welcomeContainer}>
        <Text style={s.welcomeText}>Welcome to TerraAssist</Text>
      </View>

      <View style={s.sensorRow}>
        <View style={s.sensorCard}>
          <Text style={s.sensorIcon}>🌡️</Text>
          <Text style={s.sensorLabel}>Temperature</Text>
          <Text style={s.sensorValue}>{data.sensors.temperature.toFixed(1)} <Text style={s.sensorUnit}>°C</Text></Text>
        </View>
        <View style={s.sensorCard}>
          <Text style={s.sensorIcon}>💧</Text>
          <Text style={s.sensorLabel}>Humidity</Text>
          <Text style={s.sensorValue}>{data.sensors.humidity.toFixed(1)} <Text style={s.sensorUnit}>%</Text></Text>
        </View>
        <View style={s.sensorCard}>
          <Text style={s.sensorIcon}>🪴</Text>
          <Text style={s.sensorLabel}>Soil</Text>
          <Text style={[s.sensorStatus, { color: soilColor, marginTop: 4 }]}>{displaySoilStatus}</Text>
        </View>
      </View>

      <Text style={s.sectionTitle}>Terrarium Controls</Text>
      
      <View style={s.grid}>
        <View style={s.gridCard}>
          <Text style={s.gridIcon}>💡</Text>
          <Text style={s.gridLabel}>Grow Light</Text>
          <StatusDot isOn={data.devices.growLight.isOn} rec={data.devices.growLight.autoRecommended} />
        </View>
        <View style={s.gridCard}>
          <Text style={s.gridIcon}>𖣘</Text>
          <Text style={s.gridLabel}>Fan</Text>
          <StatusDot isOn={data.devices.fan.isOn} rec={data.devices.fan.autoRecommended} />
        </View>
        <View style={s.gridCard}>
          <Text style={s.gridIcon}>🚿</Text>
          <Text style={s.gridLabel}>Watering</Text>
          <StatusDot isOn={data.devices.waterPump.isOn} rec={data.devices.waterPump.autoRecommended} />
        </View>
        <View style={s.gridCard}>
          <Text style={s.gridIcon}>🌱</Text>
          <Text style={s.gridLabel}>Fertilizer</Text>
          <View style={s.statusRow}>
            <View style={[s.dot, { backgroundColor: data.devices.fertilizer.isOn ? colors.success : colors.error }]} />
            <Text style={[s.statusText, { color: data.devices.fertilizer.isOn ? colors.success : colors.error }]}>
              {data.devices.fertilizer.isOn ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        <View style={s.gridCard}>
          <Text style={s.gridIcon}>📶</Text>
          <Text style={s.gridLabel}>Water Level</Text>
          <View style={s.statusRow}>
            <View style={[s.dot, { backgroundColor: waterLevelHigh ? colors.success : colors.error }]} />
            <Text style={[s.statusText, { color: waterLevelHigh ? colors.success : colors.error }]}>{waterLevelHigh ? 'High' : 'Low'}</Text>
          </View>
        </View>
        <View style={s.gridCard}>
          <Text style={s.gridIcon}>📊</Text>
          <Text style={s.gridLabel}>Fertilizer Level</Text>
          <View style={s.statusRow}>
            <View style={[s.dot, { backgroundColor: fertLevelHigh ? colors.success : colors.error }]} />
            <Text style={[s.statusText, { color: fertLevelHigh ? colors.success : colors.error }]}>{fertLevelHigh ? 'High' : 'Low'}</Text>
          </View>
        </View>
      </View>

      {/* Plant Camera Card */}
      <View style={s.cameraCard}>
        <View style={s.camHeader}>
          <Text style={s.cameraCardTitle}>📷 Plant Camera</Text>
          {cameraPred.isDiseased && <View style={s.redBadgeDot} />}
        </View>
        <View style={s.camRow}>
          <View style={{flex: 1}}>
            <Text style={s.camSmallText}>Status: {cameraStatus}</Text>
            <Text style={s.camSmallText}>Pred: {cameraPred.predictedClass || '--'} ({cameraPred.confidence ? Math.round(cameraPred.confidence)+'%' : ''})</Text>
            <Text style={s.camSmallText}>Time: {cameraPred.timestamp ? new Date(cameraPred.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
             {cameraPred.predictedClass ? (
               cameraPred.isDiseased ? (
                 <View style={[s.badgeBox, { backgroundColor: colors.error }]}><Text style={s.badgeTxt}>Diseased</Text></View>
               ) : (
                 <View style={[s.badgeBox, { backgroundColor: colors.success }]}><Text style={s.badgeTxt}>Healthy</Text></View>
               )
             ) : (
                 <View style={[s.badgeBox, { backgroundColor: colors.grey }]}><Text style={s.badgeTxt}>No Scans</Text></View>
             )}
             <TouchableOpacity style={s.cameraBtn} onPress={() => navigation.navigate('PlantCamera')}>
               <Text style={s.cameraBtnText}>View Plant</Text>
             </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal visible={showModal} animationType="fade" transparent={true}>
        <View style={s.modalOverlay}>
          <View style={s.modalContainer}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={s.closeBtn}>
                <Text style={s.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {notifications.length === 0 ? (
                <Text style={s.emptyNotif}>You have no new notifications.</Text>
              ) : (
                notifications.map(n => (
                  <TouchableOpacity 
                    key={n.id} 
                    style={s.notifCard}
                    activeOpacity={n.isDisease ? 0.7 : 1}
                    onPress={() => {
                      if (n.isDisease && cameraPred) {
                        setShowModal(false);
                        navigation.navigate('DiseaseAlert', {
                          diseaseInfo: {
                            predicted_class: cameraPred.predictedClass,
                            confidence: cameraPred.confidence,
                            is_diseased: true
                          }
                        });
                      }
                    }}
                  >
                    <Text style={s.notifIcon}>{n.icon}</Text>
                    <View style={s.notifContent}>
                      <Text style={s.notifTitle}>{n.title}</Text>
                      <Text style={s.notifDesc}>{n.desc}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
