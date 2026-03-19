import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, database } from '../../config/firebase';
import { ref, set } from 'firebase/database';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { colors } from '../../theme/colors';

type SignUpScreenProp = NativeStackNavigationProp<RootStackParamList, 'SignUp'>;

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<SignUpScreenProp>();

  const generateStrongPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    let pwd = '';
    for (let i = 0; i < 16; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pwd);
    setConfirmPassword(pwd);
  };

  const handleSignUp = async () => {
    setError('');

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (!validateEmail(email)) {
      setError('Invalid email format');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: fullName });
      await set(ref(database, 'users/' + userCredential.user.uid), {
        fullName,
        email,
        createdAt: new Date().toISOString(),
      });
    } catch (e: any) {
      setError(e.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.logoIcon}>🌱</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join TerraAssist today</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor={colors.textLight}
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor={colors.textLight}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor={colors.textLight}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.showHideBtn}>
            <Text style={styles.showHideText}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor={colors.textLight}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
        />

        <TouchableOpacity style={styles.genPasswordBtn} onPress={generateStrongPassword}>
          <Text style={styles.genPasswordText}>🔐  Generate Strong Password</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton} onPress={handleSignUp} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.primaryButtonText}>Create Account</Text>
          }
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 24, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 32, marginTop: 40 },
  logoIcon: { fontSize: 56, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  subtitle: { fontSize: 14, color: colors.textLight, marginTop: 4 },
  errorText: { color: colors.error, marginBottom: 16, textAlign: 'center', fontSize: 13 },
  input: {
    backgroundColor: colors.secondary,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 15,
  },
  passwordContainer: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    alignItems: 'center',
  },
  passwordInput: { flex: 1, padding: 16, color: colors.text, fontSize: 15 },
  showHideBtn: { padding: 16 },
  showHideText: { color: colors.primary, fontWeight: 'bold' },
  genPasswordBtn: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.accent + '30',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  genPasswordText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: colors.textLight },
  footerLink: { color: colors.primary, fontWeight: 'bold' },
});
