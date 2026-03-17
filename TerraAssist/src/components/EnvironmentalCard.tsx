import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface EnvironmentalCardProps {
  icon: string;
  title: string;
  value: string | number;
  unit: string;
}

export default function EnvironmentalCard({ icon, title, value, unit }: EnvironmentalCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>{icon}</Text>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.value}>
          {value}
          <Text style={styles.unit}>{unit}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  title: {
    fontSize: 14,
    color: colors.textLight,
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  unit: {
    fontSize: 14,
    fontWeight: 'normal',
  },
});
