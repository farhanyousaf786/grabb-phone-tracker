import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface DayDot {
  date: string;
  label: string;
  status: 'success' | 'fail' | 'empty';
}

interface StreakTrackerProps {
  streak: number;
  dayDots: DayDot[];
  bestStreak: number;
}

export const StreakTracker: React.FC<StreakTrackerProps> = ({ streak, dayDots, bestStreak }) => {
  const { colors, isDark } = useTheme();

  return (
    <Animated.View
      entering={FadeInUp.delay(520).duration(500)}
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          borderWidth: 1,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.streakMain}>
          <View style={[styles.flameCircle, { backgroundColor: '#FF7A00' + '18' }]}>
            <Ionicons name="flame" size={22} color="#FF7A00" />
          </View>
          <View>
            <Text style={[styles.streakCount, { color: colors.text }]}>
              {streak} <Text style={[styles.streakUnit, { color: colors.textMuted }]}>day{streak === 1 ? '' : 's'}</Text>
            </Text>
            <Text style={[styles.streakLabel, { color: colors.textMuted }]}>
              {streak > 0 ? 'Current streak' : 'No active streak'}
            </Text>
          </View>
        </View>
        <View style={styles.bestStreak}>
          <Ionicons name="trophy" size={12} color={colors.primary} />
          <Text style={[styles.bestText, { color: colors.primary }]}>Best: {bestStreak}</Text>
        </View>
      </View>

      {/* Visual continuity dots */}
      <View style={styles.dotsRow}>
        {dayDots.map((dot, idx) => (
          <View key={idx} style={styles.dotWrapper}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    dot.status === 'success'
                      ? '#34D399'
                      : dot.status === 'fail'
                      ? colors.danger
                      : isDark
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(0,0,0,0.04)',
                  borderColor:
                    dot.status === 'success'
                      ? '#34D399'
                      : dot.status === 'fail'
                      ? colors.danger
                      : 'transparent',
                  borderWidth: dot.status !== 'empty' ? 2 : 0,
                },
              ]}
            />
            <Text style={[styles.dotLabel, { color: colors.textMuted }]}>{dot.label}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.015,
    shadowRadius: 8,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  streakMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flameCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCount: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  streakUnit: {
    fontSize: 13,
    fontWeight: '700',
  },
  streakLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  bestStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139,92,246,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bestText: {
    fontSize: 10,
    fontWeight: '900',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  dotWrapper: {
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
});
