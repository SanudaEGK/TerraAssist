import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../config/AuthContext';
import SplashScreen from '../screens/auth/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import MainTabNavigator from './MainTabNavigator';
import DiseaseAlertScreen from '../screens/main/DiseaseAlertScreen';
import PlantCameraScreen from '../screens/main/PlantCameraScreen';
import { colors } from '../theme/colors';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  Main: { screen: string } | undefined;
  DiseaseAlert: { diseaseInfo: any }; 
  PlantCamera: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // Unauthenticated Flow
          <Stack.Group>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </Stack.Group>
        ) : (
          // Authenticated Flow
          <Stack.Group>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="DiseaseAlert" component={DiseaseAlertScreen} options={{ headerShown: true, title: 'Alert' }} />
            <Stack.Screen name="PlantCamera" component={PlantCameraScreen} options={{ headerShown: true, title: 'Plant Camera' }} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
