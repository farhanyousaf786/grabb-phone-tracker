import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { PlanConfig } from '@/utils/storage';

interface QuestRoadmapProps {
  elapsedDaysCount: number;
  currentWeek: number;
  planConfig: PlanConfig;
}

export const QuestRoadmap: React.FC<QuestRoadmapProps> = ({
  elapsedDaysCount,
  currentWeek,
  planConfig,
}) => {
  const { colors, isDark } = useTheme();

  // Dynamic roadmap tickmarks mapped from current active PlanConfig!
  const roadmap = [
    { week: 'Wk 1–2', limit: planConfig.phase1Limit, wMin: 1, wMax: 2 },
    { week: 'Wk 3–4', limit: planConfig.phase2Limit, wMin: 3, wMax: 4 },
    { week: 'Wk 5–6', limit: planConfig.phase3Limit, wMin: 5, wMax: 6 },
    { week: 'Wk 7–8', limit: planConfig.phase4Limit, wMin: 7, wMax: 8 },
  ];

  return (
    <View>
      <Animated.Text entering={FadeInUp.delay(450)} style={[styles.sectionHeading, { color: colors.textMuted }]}>
        ROADMAP QUEST LINE
      </Animated.Text>

      <Animated.View entering={FadeInUp.delay(500)} style={[styles.card, { backgroundColor: colors.surface, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
        {roadmap.map((road, index) => {
          const isCompleted = elapsedDaysCount >= road.wMax * 7;
          const isActive = currentWeek >= road.wMin && currentWeek <= road.wMax;
          const isLocked = !isCompleted && !isActive;

          return (
            <View key={road.week} style={[styles.roadRow, index === 3 && styles.noBorder, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              
              {/* Glowing check / numbering badge */}
              <View 
                style={[
                  styles.roadCircle, 
                  { 
                    backgroundColor: isCompleted ? '#34D399' + '1A' : 
                                    isActive ? colors.primary + '1A' : 
                                    (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                    borderColor: isCompleted ? '#34D399' : 
                                 isActive ? colors.primary : 
                                 (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
                    borderWidth: 1.5
                  }
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark-sharp" size={12} color="#34D399" />
                ) : isActive ? (
                  <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
                ) : (
                  <Text style={[styles.roadCircleText, { color: colors.textMuted }]}>{index + 1}</Text>
                )}
              </View>

              <View style={styles.roadTextContainer}>
                <Text style={[
                  styles.roadWeek, 
                  { 
                    color: isCompleted ? colors.text : isActive ? colors.text : colors.textMuted,
                    fontWeight: isCompleted || isActive ? '800' : '600'
                  }
                ]}>
                  {road.week}
                </Text>
                
                {/* Status pills */}
                {isCompleted && <Text style={[styles.statusPillText, { color: '#34D399' }]}>COMPLETED</Text>}
                {isActive && <Text style={[styles.statusPillText, { color: colors.primary }]}>ACTIVE PROTOCOL</Text>}
                {isLocked && <Text style={[styles.statusPillText, { color: colors.textMuted }]}>LOCKED</Text>}
              </View>

              <Text style={[
                styles.roadLimit, 
                { 
                  color: isCompleted ? colors.text : isActive ? colors.primary : colors.textMuted,
                  fontWeight: isCompleted || isActive ? '800' : '600'
                }
              ]}>
                ≤{road.limit} grabs
              </Text>
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeading: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10, marginTop: 14 },
  card: { borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.015, shadowRadius: 8, elevation: 1 },
  roadRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1 },
  noBorder: { borderBottomWidth: 0 },
  roadCircle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  roadCircleText: { fontSize: 9.5, fontWeight: '900' },
  roadTextContainer: {
    flex: 1,
    gap: 2,
  },
  roadWeek: { fontSize: 13, letterSpacing: -0.2 },
  statusPillText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  roadLimit: { fontSize: 12.5 },
});
