import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Switch, Alert, Image, ActivityIndicator, TextInput
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../config/AuthContext';
import { auth, database } from '../../config/firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { ref, update } from 'firebase/database';
import { useTheme } from '../../theme/ThemeContext';

export default function ProfileScreen() {
  const { user } = useAuth();
  const { colors, mode, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || '');

  const initial = user?.displayName?.charAt(0).toUpperCase()
    ?? user?.email?.charAt(0).toUpperCase()
    ?? 'U';

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: newName });
        if (auth.currentUser.uid) {
          await update(ref(database, 'users/' + auth.currentUser.uid), { fullName: newName });
        }
      }
      setEditingName(false);
      Alert.alert('Success', 'Profile name updated!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update name');
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  const handleUpdatePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery access is required to update your photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets.length) return;

    setPhotoLoading(true);
    try {
      const photoURL = result.assets[0].uri;
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL });
        if (auth.currentUser.uid) {
          await update(ref(database, 'users/' + auth.currentUser.uid), { photoURL });
        }
      }
      Alert.alert('Success', 'Profile photo updated!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update photo');
    } finally {
      setPhotoLoading(false);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingTop: 50 },
    header: { paddingHorizontal: 20, marginBottom: 20 },
    title: { fontSize: 26, fontWeight: 'bold', color: colors.primary },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    // Avatar card
    card: {
      backgroundColor: colors.cardBackground, borderRadius: 16, padding: 24,
      alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 24,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
    },
    avatarWrap: {
      width: 88, height: 88, borderRadius: 44, overflow: 'hidden',
      backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
      marginBottom: 12,
    },
    avatarImage: { width: '100%', height: '100%' },
    avatarText: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
    updatePhotoBtn: {
      borderWidth: 1, borderColor: colors.primary, borderRadius: 20,
      paddingVertical: 6, paddingHorizontal: 16, marginBottom: 12,
    },
    updatePhotoText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
    userName: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 2 },
    userEmail: { fontSize: 13, color: colors.textLight },
    // Section
    sectionTitle: {
      fontSize: 12, fontWeight: 'bold', color: colors.textLight, marginBottom: 10,
      textTransform: 'uppercase', letterSpacing: 1,
    },
    // Setting rows
    settingItem: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: colors.cardBackground, padding: 16, borderRadius: 12,
      marginBottom: 10, borderWidth: 1, borderColor: colors.border,
    },
    settingLabel: { fontSize: 15, color: colors.text, fontWeight: '500' },
    settingSubLabel: { fontSize: 12, color: colors.textLight, marginTop: 2 },
    settingIcon: { fontSize: 20, marginRight: 10 },
    settingRow: { flexDirection: 'row', alignItems: 'center' },
    // Logout
    logoutBtn: {
      marginTop: 24, backgroundColor: '#FFEBEE', padding: 16, borderRadius: 12,
      alignItems: 'center', borderWidth: 1, borderColor: '#FFCDD2',
    },
    logoutText: { color: '#C62828', fontSize: 16, fontWeight: 'bold' },
    modeSection: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    modeLabel: { fontSize: 14, color: colors.textLight, fontWeight: '500' },
    modeActive: { fontWeight: '700', color: colors.primary },
  });

  const photoURL = user?.photoURL;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>My Profile</Text>
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={s.card}>
          <View style={s.avatarWrap}>
            {photoURL
              ? <Image source={{ uri: photoURL }} style={s.avatarImage} />
              : <Text style={s.avatarText}>{initial}</Text>
            }
          </View>
          <TouchableOpacity style={s.updatePhotoBtn} onPress={handleUpdatePhoto} disabled={photoLoading}>
            {photoLoading
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Text style={s.updatePhotoText}>📷  Update Profile Photo</Text>
            }
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
            {editingName ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput
                  style={[s.userName, { borderBottomWidth: 1, borderBottomColor: colors.primary, minWidth: 150 }]}
                  value={newName}
                  onChangeText={setNewName}
                  autoFocus
                />
                <TouchableOpacity onPress={handleUpdateName}>
                  <Text style={{ fontSize: 18 }}>✅</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setEditingName(false); setNewName(user?.displayName || ''); }}>
                  <Text style={{ fontSize: 18 }}>❌</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={s.userName}>{user?.displayName || 'TerraAssist User'}</Text>
                <TouchableOpacity onPress={() => setEditingName(true)} style={{ marginLeft: 8 }}>
                  <Text style={{ fontSize: 16 }}>✏️</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          <Text style={s.userEmail}>{user?.email}</Text>
        </View>

        {/* Preferences */}
        <Text style={s.sectionTitle}>Preferences</Text>

        {/* Dark / Light mode */}
        <View style={s.settingItem}>
          <View style={s.settingRow}>
            <Text style={s.settingIcon}>{mode === 'dark' ? '🌙' : '☀️'}</Text>
            <View>
              <Text style={s.settingLabel}>Theme</Text>
              <Text style={s.settingSubLabel}>
                Currently in{' '}
                <Text style={s.modeActive}>{mode === 'dark' ? 'Dark' : 'Light'} Mode</Text>
              </Text>
            </View>
          </View>
          <View style={s.modeSection}>
            <Text style={[s.modeLabel, mode === 'light' && s.modeActive]}>Light</Text>
            <Switch
              value={mode === 'dark'}
              onValueChange={toggleTheme}
              thumbColor={mode === 'dark' ? colors.primary : '#fff'}
              trackColor={{ false: '#ddd', true: '#1B5E20' }}
            />
            <Text style={[s.modeLabel, mode === 'dark' && s.modeActive]}>Dark</Text>
          </View>
        </View>

        {/* Notifications */}
        <View style={s.settingItem}>
          <View style={s.settingRow}>
            <Text style={s.settingIcon}>🔔</Text>
            <View>
              <Text style={s.settingLabel}>Disease Alerts</Text>
              <Text style={s.settingSubLabel}>Notify when a disease is detected</Text>
            </View>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            thumbColor={notifications ? colors.primary : '#fff'}
            trackColor={{ false: '#ddd', true: colors.accent }}
          />
        </View>

        {/* About */}
        <TouchableOpacity style={s.settingItem}>
          <View style={s.settingRow}>
            <Text style={s.settingIcon}>ℹ️</Text>
            <Text style={s.settingLabel}>About TerraAssist</Text>
          </View>
          <Text style={{ color: colors.textLight }}>v1.0.0  ›</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>🚪  Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
