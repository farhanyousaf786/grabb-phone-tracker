import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface JourneyProgressProps {
  elapsedDaysCount: number;
  planProgressPercent: number;
}

export const JourneyProgress: React.FC<JourneyProgressProps> = ({ elapsedDaysCount, planProgressPercent }) => {
  const { colors, isDark } = useTheme();

  return (
    <Animated.View 
      entering={FadeInUp.delay(200)} 
      style={[
        styles.heroCard, 
        { 
          backgroundColor: colors.surface, 
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          shadowColor: colors.primary
        }
      ]}
    >
      <View style={styles.heroHeader}>
        <View style={[styles.badgeContainer, { backgroundColor: colors.primary + '1A' }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>PLAN TIMELINE</Text>
        </View>
        <Text style={[styles.heroProgressLabel, { color: colors.text }]}>
          Day {elapsedDaysCount} <Text style={{ fontSize: 13, color: colors.textMuted }}>of 56</Text>
        </Text>
      </View>

      {/* Premium Progress Bar Track */}
      <View style={[styles.heroProgressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
        <View style={[styles.heroProgressFill, { width: `${planProgressPercent}%`, backgroundColor: colors.primary }]} />
      </View>

      <View style={styles.heroFooter}>
        <Text style={[styles.heroMutedText, { color: colors.textMuted }]}>
          {56 - elapsedDaysCount} days remaining in roadmap
        </Text>
        <Text style={[styles.heroPercentText, { color: colors.primary }]}>
          {planProgressPercent}% Completed
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroProgressLabel: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroProgressTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 14,
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroMutedText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  heroPercentText: {
    fontSize: 11,
    fontWeight: '900',
  },
});
