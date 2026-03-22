import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface ControlCardProps {
  title: string;
  icon: string;
  isAuto: boolean;
  isOn: boolean;
  autoMessage: string;
  onToggleMode: (isAuto: boolean) => void;
  onToggleDevice: (isOn: boolean) => void;
  disabledOverride?: boolean;
  overrideMessage?: string;
  customStatusLabel?: string;
}

export default function ControlCard({
  title,
  icon,
  isAuto,
  isOn,
  autoMessage,
  onToggleMode,
  onToggleDevice,
  disabledOverride = false,
  overrideMessage = '',
  customStatusLabel
}: ControlCardProps) {
  const { colors } = useTheme();
  const isDeviceToggleDisabled = disabledOverride;

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <View style={[styles.headerRow, { borderBottomColor: colors.grey }]}>
        <View style={styles.titleInfo}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={[styles.title, { color: colors.primary }]}>{title}</Text>
        </View>

        {/* <View style={styles.modeToggleContainer}>
          <Text style={[styles.modeLabel, { color: !isAuto ? colors.primary : colors.textLight }]}>MANUAL</Text>
          <Switch
            trackColor={{ false: colors.grey, true: colors.primary }}
            thumbColor={colors.secondary}
            onValueChange={(val) => onToggleMode(!val)}
            value={!isAuto}
          />
          <Text style={[styles.modeLabel, { color: isAuto ? colors.primary : colors.textLight }]}>AUTO</Text>
        </View> */}
      </View>

      {/* Main Control Area */}
      <View style={styles.controlRow}>
        <View style={styles.statusInfo}>
          <Text style={[styles.statusTitle, { color: colors.textLight }]}>Device Status</Text>
          
          <Text style={[
            styles.statusValue, 
            { color: customStatusLabel ? colors.text : (isOn ? colors.success : colors.error) }
          ]}>
            {customStatusLabel ? customStatusLabel : (isOn ? 'Transmitting ON' : 'Transmitting OFF')}
          </Text>

          {!!autoMessage && (
            <Text style={[styles.autoMessageText, { color: colors.textLight }]}>{autoMessage}</Text>
          )}

          {disabledOverride && (
            <Text style={[styles.overrideMessageText, { color: colors.warning }]}>{overrideMessage}</Text>
          )}
        </View>

        <View style={styles.mainToggle}>
          <Switch
            trackColor={{ false: colors.grey, true: colors.success }}
            thumbColor={colors.secondary}
            onValueChange={onToggleDevice}
            value={isOn}
            disabled={isDeviceToggleDisabled}
            style={styles.largeSwitch}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  titleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginHorizontal: 4,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
    paddingRight: 16,
  },
  statusTitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  autoMessageText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  overrideMessageText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  mainToggle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  largeSwitch: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
  },
});
