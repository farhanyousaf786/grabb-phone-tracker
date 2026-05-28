import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GrabLog } from '@/utils/storage';
import { useTheme } from '@/context/ThemeContext';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface DiagnosticReportProps {
  allGrabs: GrabLog[];
  elapsedDays: number;
  suggestedLimit?: number;
  customAdoptLimit?: number;
  setCustomAdoptLimit?: (limit: number) => void;
  onAdopt?: (limit: number) => void;
  onClose?: () => void;
  isDailyStatsMode?: boolean;
}

export const DiagnosticReport: React.FC<DiagnosticReportProps> = ({
  allGrabs,
  elapsedDays,
  suggestedLimit = 15,
  customAdoptLimit = 15,
  setCustomAdoptLimit = () => {},
  onAdopt = () => {},
  onClose,
  isDailyStatsMode = false,
}) => {
  const { colors, isDark } = useTheme();

  // Basic calculations
  const totalPickups = allGrabs.length;
  const daysCount = Math.max(1, elapsedDays);
  const dailyAverage = Math.round(totalPickups / daysCount);

  // Behavioral profile classification
  let profileName = 'Mindful Engagement';
  let profileDesc = 'You naturally maintain clean device intervals. A gentle tape-down will easily optimize your day.';
  let profileIcon = 'leaf-outline';
  let profileColor = '#34D399';

  if (dailyAverage > 50) {
    profileName = 'Hyper-Impulsive Stimulus';
    profileDesc = 'Strong checking impulses mapped. Reflex grabs frequently disrupt deep focus. Highly optimized detox protocol required.';
    profileIcon = 'nuclear-outline';
    profileColor = '#EF4444';
  } else if (dailyAverage >= 30) {
    profileName = 'Moderate Dopamine Hunting';
    profileDesc = 'Frequent checkups during transitional moments. Standard tapering will steadily restore your focus levels.';
    profileIcon = 'compass-outline';
    profileColor = colors.primary;
  }

  // Trigger breakdown percentages
  const triggerCounts: Record<string, number> = {};
  allGrabs.forEach((g) => {
    triggerCounts[g.trigger] = (triggerCounts[g.trigger] || 0) + 1;
  });
  const totalTriggers = Object.values(triggerCounts).reduce((a, b) => a + b, 0) || 1;
  const sortedTriggers = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3); // top 3

  // Peak activity window
  const hourCounts = Array(12).fill(0);
  allGrabs.forEach((g) => {
    const hour = new Date(g.timestamp).getHours();
    hourCounts[Math.floor(hour / 2)]++;
  });
  let maxPeak = 0;
  let peakIdx = 0;
  hourCounts.forEach((cnt, idx) => {
    if (cnt > maxPeak) {
      maxPeak = cnt;
      peakIdx = idx;
    }
  });
  const formatHour = (h: number) => {
    if (h === 0) return '12am';
    if (h === 12) return '12pm';
    return h > 12 ? `${h - 12}pm` : `${h}am`;
  };
  const peakW = maxPeak > 0 ? `${formatHour(peakIdx * 2)}–${formatHour((peakIdx * 2 + 2) % 24)}` : 'N/A';

  // Mornings score
  let clearMornings = 0;
  // Group by date to check morning grabs
  const grabsByDate: Record<string, GrabLog[]> = {};
  allGrabs.forEach((g) => {
    grabsByDate[g.date] = grabsByDate[g.date] || [];
    grabsByDate[g.date].push(g);
  });
  Object.values(grabsByDate).forEach((dayGrabs) => {
    const hasMorningGrabs = dayGrabs.some((g) => new Date(g.timestamp).getHours() < 12);
    if (!hasMorningGrabs) clearMornings++;
  });

  return (
    <View style={styles.cardWrapper}>
      {/* Scrollable diagnostic content */}
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Neuro-Profile Badge */}
        <Animated.View entering={FadeInUp.delay(100)} style={[styles.profileHeader, { borderColor: profileColor + '30', backgroundColor: profileColor + '08' }]}>
          <View style={[styles.profileIconContainer, { backgroundColor: profileColor + '1C' }]}>
            <Ionicons name={profileIcon as any} size={28} color={profileColor} />
          </View>
          <View style={styles.profileTexts}>
            <Text style={[styles.profileLabel, { color: colors.textMuted }]}>BEHAVIORAL NEURO-PROFILE</Text>
            <Text style={[styles.profileNameText, { color: colors.text }]}>{profileName}</Text>
            <Text style={[styles.profileDescText, { color: colors.textMuted }]}>{profileDesc}</Text>
          </View>
        </Animated.View>

        {/* Primary Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCell, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
            <Ionicons name="apps-outline" size={16} color={colors.primary} style={{ marginBottom: 4 }} />
            <Text style={[styles.cellVal, { color: colors.text }]}>{dailyAverage}</Text>
            <Text style={[styles.cellLabel, { color: colors.textMuted }]}>Avg. Daily Grabs</Text>
          </View>

          <View style={[styles.metricCell, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
            <Ionicons name="time-outline" size={16} color="#A78BFA" style={{ marginBottom: 4 }} />
            <Text style={[styles.cellVal, { color: colors.text }]}>{peakW}</Text>
            <Text style={[styles.cellLabel, { color: colors.textMuted }]}>Peak Window</Text>
          </View>

          <View style={[styles.metricCell, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
            <Ionicons name="sunny-outline" size={16} color="#F59E0B" style={{ marginBottom: 4 }} />
            <Text style={[styles.cellVal, { color: colors.text }]}>{clearMornings} / {daysCount}</Text>
            <Text style={[styles.cellLabel, { color: colors.textMuted }]}>Clear Mornings</Text>
          </View>
        </View>

        {/* Trigger Analytics Section */}
        <View style={[styles.insightCard, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash-outline" size={16} color="#EF4444" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Impulse Triggers Breakdown</Text>
          </View>
          
          {sortedTriggers.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No triggers logged yet. Start logging to identify checking cues.</Text>
          ) : (
            <View style={styles.triggerList}>
              {sortedTriggers.map(([trigger, count], idx) => {
                const percentage = Math.round((count / totalTriggers) * 100);
                return (
                  <View key={trigger} style={styles.triggerItem}>
                    <View style={styles.triggerLabelRow}>
                      <Text style={[styles.triggerName, { color: colors.text }]}>
                        {idx + 1}. {trigger}
                      </Text>
                      <Text style={[styles.triggerPercent, { color: colors.text }]}>{percentage}%</Text>
                    </View>
                    <View style={[styles.barBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                      <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: colors.primary }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Dynamic Target Setup Option (Only visible when onboarding) */}
        {!isDailyStatsMode ? (
          <View style={[styles.recommendationPanel, { backgroundColor: '#8B5CF6' + '0C', borderColor: '#8B5CF6' + '25' }]}>
            <View style={styles.recHeader}>
              <Ionicons name="sparkles" size={15} color="#A78BFA" />
              <Text style={[styles.recTitle, { color: '#A78BFA' }]}>INTELLIGENT RECOMMENDATION</Text>
            </View>
            <Text style={[styles.recText, { color: colors.text, marginBottom: 20 }]}>
              We recommend heading over to the <Text style={{ fontWeight: '900', color: colors.primary }}>Plan page</Text> to adopt our intelligent recommendations or customize your protocol for the optimal tapering journey!
            </Text>

            {/* Submit Action Buttons */}
            <Pressable
              onPress={() => onAdopt(suggestedLimit)}
              style={({ pressed }) => [
                styles.primaryAdoptBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }
              ]}
            >
              <Ionicons name="compass-outline" size={16} color="#FFFFFF" />
              <Text style={styles.primaryAdoptText}>Configure & Setup Today</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          /* Daily Stats Mode Footer Close button */
          onClose && (
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }
              ]}
            >
              <Text style={styles.closeButtonText}>Done Reviewing Reports</Text>
            </Pressable>
          )
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    flex: 1,
    width: '100%',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    gap: 14,
    marginBottom: 20,
    alignItems: 'center',
  },
  profileIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileTexts: {
    flex: 1,
  },
  profileLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },
  profileNameText: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
  },
  profileDescText: {
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  metricCell: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  cellVal: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 2,
    textAlign: 'center',
  },
  cellLabel: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  insightCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.01,
    shadowRadius: 10,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  emptyText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  triggerList: {
    gap: 12,
  },
  triggerItem: {
    width: '100%',
  },
  triggerLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  triggerName: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  triggerPercent: {
    fontSize: 11,
    fontWeight: '800',
  },
  barBg: {
    height: 5,
    borderRadius: 2.5,
    width: '100%',
  },
  barFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  recommendationPanel: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 18,
    alignItems: 'center',
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  recTitle: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  recText: {
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  adjusterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 18,
  },
  adjustBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBox: {
    alignItems: 'center',
    minWidth: 70,
  },
  adjustNum: {
    fontSize: 26,
    fontWeight: '900',
  },
  adjustLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: -2,
  },
  primaryAdoptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  primaryAdoptText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  closeButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
});
