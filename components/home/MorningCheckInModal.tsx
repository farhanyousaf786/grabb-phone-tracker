import React, { useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { INTENTIONS } from '@/constants/mockData';
import Animated, { 
  FadeIn, 
  FadeOut, 
  ZoomIn, 
  ZoomOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';

interface YesterdayStats {
  count: number;
  limit: number;
  topTrigger: string | null;
  success: boolean;
}

interface MorningCheckInModalProps {
  visible: boolean;
  onClose: (intention: string) => void;
  dailyLimit: number;
  yesterdayStats: YesterdayStats | null;
}


export const MorningCheckInModal: React.FC<MorningCheckInModalProps> = ({ 
  visible, 
  onClose, 
  dailyLimit, 
  yesterdayStats 
}) => {
  const { colors, isDark } = useTheme();
  const [selectedIntention, setSelectedIntention] = useState<string>(INTENTIONS[0].key);
  const [shouldRender, setShouldRender] = useState(visible);

  // Pulse animation for the glowing sun/morning header icon
  const pulseValue = useSharedValue(1);

  React.useEffect(() => {
    if (visible) {
      setShouldRender(true);
      pulseValue.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1000 }),
          withTiming(1.0, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      const timer = setTimeout(() => setShouldRender(false), 150);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  if (!shouldRender) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={() => onClose(selectedIntention)}
    >
      <Animated.View 
        entering={FadeIn.duration(220)}
        exiting={FadeOut.duration(160)}
        style={[
          styles.overlay, 
          { backgroundColor: isDark ? 'rgba(8, 5, 24, 0.88)' : 'rgba(240, 237, 232, 0.88)' }
        ]}
      >
        <Animated.View 
          entering={ZoomIn.duration(240)}
          exiting={ZoomOut.duration(180)}
          style={[
            styles.card, 
            { 
              backgroundColor: colors.surface, 
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' 
            }
          ]}
        >
          {/* Animated Header Sun */}
          <Animated.View style={[styles.iconContainer, pulseStyle]}>
            <View style={[styles.glowRing, { backgroundColor: '#F59E0B20' }]}>
              <Ionicons name="sunny-sharp" size={38} color="#F59E0B" />
            </View>
          </Animated.View>

          {/* Header Texts */}
          <Text style={[styles.title, { color: colors.text }]}>Morning Check-In</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Set your mindset for a focused and mindful day ahead.
          </Text>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Today's Tapering Goal Card */}
            <View style={[styles.goalCard, { backgroundColor: colors.primary + '0C', borderColor: colors.primary + '20' }]}>
              <Ionicons name="compass-outline" size={18} color={colors.primary} />
              <View style={styles.goalTexts}>
                <Text style={[styles.goalLabel, { color: colors.textMuted }]}>TODAY'S TAPERING TARGET</Text>
                <Text style={[styles.goalValue, { color: colors.text }]}>
                  {dailyLimit} <Text style={styles.goalUnit}>Grabs Max</Text>
                </Text>
              </View>
            </View>

            {/* Yesterday's Performance Snapshot */}
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>YESTERDAY'S PERFORMANCE</Text>
            
            {yesterdayStats ? (
              <View style={[styles.yesterdayCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)', borderColor: colors.border }]}>
                <View style={styles.statRow}>
                  <View style={styles.statCol}>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>LOGGED GRABS</Text>
                    <Text style={[styles.statValueText, { color: colors.text }]}>{yesterdayStats.count}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.statCol}>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>DAILY LIMIT</Text>
                    <Text style={[styles.statValueText, { color: colors.text }]}>{yesterdayStats.limit}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.statCol}>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>RESULT</Text>
                    <View style={[
                      styles.resultBadge, 
                      { backgroundColor: yesterdayStats.success ? '#10B98118' : '#EF444418' }
                    ]}>
                      <Text style={[
                        styles.resultBadgeText, 
                        { color: yesterdayStats.success ? '#10B981' : '#EF4444' }
                      ]}>
                        {yesterdayStats.success ? 'SAFE' : 'OVER'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Temptation Insight */}
                {yesterdayStats.topTrigger && (
                  <View style={[styles.insightRow, { borderTopColor: colors.border }]}>
                    <Ionicons name="bulb-outline" size={14} color="#F59E0B" />
                    <Text style={[styles.insightText, { color: colors.text }]}>
                      Your main temptation yesterday was <Text style={{ fontWeight: '900', color: colors.primary }}>{yesterdayStats.topTrigger}</Text>.
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              /* Welcome first-day check-in */
              <View style={[styles.yesterdayCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)', borderColor: colors.border, paddingVertical: 18 }]}>
                <Ionicons name="sparkles-sharp" size={24} color="#8B5CF6" style={{ alignSelf: 'center', marginBottom: 8 }} />
                <Text style={[styles.welcomeText, { color: colors.text }]}>
                  Your first day has officially started. Let's make today a clean, high-focus milestone!
                </Text>
              </View>
            )}

            {/* Intentions Selector */}
            <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 16 }]}>TODAY'S MINDFUL FOCUS</Text>
            
            <View style={styles.intentionsGrid}>
              {INTENTIONS.map((intention) => {
                const isSelected = selectedIntention === intention.key;
                const accentColor = isSelected ? colors.primary : colors.textMuted;
                return (
                  <Pressable
                    key={intention.key}
                    onPress={() => setSelectedIntention(intention.key)}
                    style={({ pressed }) => [
                      styles.intentionItem,
                      {
                        backgroundColor: isSelected
                          ? colors.primary + '10'
                          : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        borderColor: isSelected ? colors.primary : 'transparent',
                        opacity: pressed ? 0.8 : 1,
                      }
                    ]}
                  >
                    <Ionicons name={intention.icon as any} size={18} color={accentColor} style={styles.intentionIcon} />
                    <Text style={[
                      styles.intentionLabelText,
                      {
                        color: isSelected ? colors.text : colors.textMuted,
                        fontWeight: isSelected ? '800' : '500',
                      }
                    ]}>
                      {intention.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Action button to finish check-in */}
          <Pressable 
            onPress={() => onClose(selectedIntention)}
            style={({ pressed }) => [
              styles.button, 
              { 
                backgroundColor: colors.primary,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.985 : 1 }]
              }
            ]}
          >
            <Ionicons name="sunny-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.buttonText}>Commit to Today's Intention</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    height: '80%',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  scrollArea: {
    flex: 1,
    marginBottom: 16,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
    gap: 12,
    marginBottom: 18,
  },
  goalTexts: {
    flex: 1,
  },
  goalLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },
  goalValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  goalUnit: {
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.7,
  },
  sectionTitle: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  yesterdayCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  statValueText: {
    fontSize: 16,
    fontWeight: '900',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
  resultBadge: {
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 10,
    gap: 6,
  },
  insightText: {
    fontSize: 10.5,
    fontWeight: '600',
    flex: 1,
    lineHeight: 14,
  },
  welcomeText: {
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  intentionsGrid: {
    gap: 8,
  },
  intentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 12,
  },
  intentionIcon: {
    width: 28,
    textAlign: 'center',
  },
  intentionLabelText: {
    fontSize: 12.5,
    flex: 1,
    lineHeight: 16,
  },
  button: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
