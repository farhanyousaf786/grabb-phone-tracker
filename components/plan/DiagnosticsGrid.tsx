import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface DiagnosticsGridProps {
  hoursReclaimed: string;
  daysUnderLimit: number;
  clearMornings: number;
  currentStreak: number;
}

export const DiagnosticsGrid: React.FC<DiagnosticsGridProps> = ({
  hoursReclaimed,
  daysUnderLimit,
  clearMornings,
  currentStreak,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View>
      <Animated.Text entering={FadeInUp.delay(250)} style={[styles.sectionHeading, { color: colors.textMuted }]}>
        DIAGNOSTIC METRICS
      </Animated.Text>
      
      <Animated.View entering={FadeInUp.delay(300)} style={styles.gridRow}>
        {/* Card 1: Hours Reclaimed */}
        <View style={[styles.gridCell, { backgroundColor: colors.surface, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
          <View style={[styles.cellIconWrapper, { backgroundColor: '#A78BFA' + '1A' }]}>
            <Ionicons name="stopwatch-outline" size={16} color="#A78BFA" />
          </View>
          <Text style={[styles.cellValue, { color: '#A78BFA' }]}>{hoursReclaimed}</Text>
          <Text style={[styles.cellLabel, { color: colors.text }]}>Hours reclaimed</Text>
          <Text style={[styles.cellDesc, { color: colors.textMuted }]}>Productivity boost</Text>
        </View>

        {/* Card 2: Days Under Limit */}
        <View style={[styles.gridCell, { backgroundColor: colors.surface, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
          <View style={[styles.cellIconWrapper, { backgroundColor: '#34D399' + '1A' }]}>
            <Ionicons name="calendar-outline" size={16} color="#34D399" />
          </View>
          <Text style={[styles.cellValue, { color: '#34D399' }]}>{daysUnderLimit} days</Text>
          <Text style={[styles.cellLabel, { color: colors.text }]}>Days under limit</Text>
          <Text style={[styles.cellDesc, { color: colors.textMuted }]}>Success logs</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(350)} style={styles.gridRow}>
        {/* Card 3: Clear Mornings */}
        <View style={[styles.gridCell, { backgroundColor: colors.surface, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
          <View style={[styles.cellIconWrapper, { backgroundColor: '#F59E0B' + '1A' }]}>
            <Ionicons name="sunny-outline" size={16} color="#F59E0B" />
          </View>
          <Text style={[styles.cellValue, { color: '#F59E0B' }]}>{clearMornings} days</Text>
          <Text style={[styles.cellLabel, { color: colors.text }]}>Clear mornings</Text>
          <Text style={[styles.cellDesc, { color: colors.textMuted }]}>Zero morning grabs</Text>
        </View>

        {/* Card 4: Current Streak */}
        <View style={[styles.gridCell, { backgroundColor: colors.surface, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
          <View style={[styles.cellIconWrapper, { backgroundColor: '#EF4444' + '1A' }]}>
            <Ionicons name="flame-outline" size={16} color="#EF4444" />
          </View>
          <Text style={[styles.cellValue, { color: '#EF4444' }]}>{currentStreak} days</Text>
          <Text style={[styles.cellLabel, { color: colors.text }]}>Current streak</Text>
          <Text style={[styles.cellDesc, { color: colors.textMuted }]}>Consecutive target hits</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeading: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10, marginTop: 14 },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  gridCell: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.015,
    shadowRadius: 8,
    elevation: 1,
  },
  cellIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cellValue: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  cellLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  cellDesc: {
    fontSize: 9,
    fontWeight: '600',
  },
});
