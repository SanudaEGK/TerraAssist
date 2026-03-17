import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Switch
} from 'react-native';
import { useAuth } from '../../config/AuthContext';
import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import { colors } from '../../theme/colors';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => signOut(auth) },
      ]
    );
  };

  const initial = user?.displayName
    ? user.displayName.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'U';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.userName}>{user?.displayName || 'TerraAssist User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Settings */}
        <Text style={styles.sectionTitle}>Settings</Text>

        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>Disease Alerts</Text>
            <Text style={styles.settingSubLabel}>Notify me when a disease is detected</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            thumbColor={notificationsEnabled ? colors.primary : '#ccc'}
            trackColor={{ false: '#ddd', true: colors.accent }}
          />
        </View>

        <TouchableOpacity style={styles.settingItemRow}>
          <Text style={styles.settingLabel}>Language</Text>
          <Text style={styles.settingValue}>English  ›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItemRow}>
          <Text style={styles.settingLabel}>About TerraAssist</Text>
          <Text style={styles.settingValue}>v1.0.0  ›</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪  Log Out</Text>
        </TouchableOpacity>
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
  profileCard: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textLight,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textLight,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingLabel: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  settingSubLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  settingValue: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 20,
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  logoutText: {
    color: '#C62828',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
