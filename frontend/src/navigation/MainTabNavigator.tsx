import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import HomeScreen from '../screens/main/HomeScreen';
import ControlScreen from '../screens/main/ControlScreen';
import DiseaseDetectionScreen from '../screens/main/DiseaseDetectionScreen';
import HistoryScreen from '../screens/main/HistoryScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import { useTheme } from '../theme/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type MainTabParamList = {
  Home: undefined;
  Controls: undefined;
  Detect: undefined;
  Statistics: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TABS = [
  { name: 'Home' as const, activeIcon: 'home-variant', inactiveIcon: 'home-variant-outline', label: 'Home', component: HomeScreen },
  { name: 'Controls' as const, activeIcon: 'toggle-switch', inactiveIcon: 'toggle-switch-outline', label: 'Controls', component: ControlScreen },
  { name: 'Detect' as const, activeIcon: 'qrcode-scan', inactiveIcon: 'qrcode-scan', label: 'Detect', component: DiseaseDetectionScreen },
  { name: 'Statistics' as const, activeIcon: 'chart-box', inactiveIcon: 'chart-box-outline', label: 'Statistics', component: HistoryScreen },
  { name: 'Profile' as const, activeIcon: 'account-circle', inactiveIcon: 'account-circle-outline', label: 'Profile', component: ProfileScreen },
];

export default function MainTabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 65,
          paddingBottom: 8,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarShowLabel: false,
        tabBarButton: (props) => {
          const tabDef = TABS.find(t => t.name === route.name);
          const focused = props.accessibilityState?.selected;
          
          return (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={props.onPress as any}
              style={[
                styles.tabBtn,
                focused && { 
                  borderTopWidth: 5, 
                  borderTopColor: colors.primary, 
                  marginTop: -1,
                  backgroundColor: colors.primary + '15',
                  borderBottomLeftRadius: 10,
                  borderBottomRightRadius: 10,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={focused ? (tabDef?.activeIcon as any) : (tabDef?.inactiveIcon as any)}
                size={focused ? 28 : 24}
                color={focused ? colors.primary : colors.textLight}
                style={focused ? { transform: [{ translateY: -2 }] } : {}}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: focused ? colors.primary : colors.textLight },
                  focused && styles.tabLabelFocused,
                ]}
              >
                {tabDef?.label}
              </Text>
            </TouchableOpacity>
          );
        },
      })}
    >
      {TABS.map(tab => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
    color: '#9E9E9E',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  tabLabelFocused: {
    fontWeight: '700',
  },
});
