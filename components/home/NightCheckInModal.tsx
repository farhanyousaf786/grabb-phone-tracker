import React, { useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

interface TodayStats {
  count: number;
  limit: number;
  topTrigger: string | null;
  success: boolean;
}

interface NightCheckInModalProps {
  visible: boolean;
  onClose: (phoneFreeWindow: string | null) => void;
  todayStats: TodayStats | null;
}

const PHONE_FREE_OPTIONS = [
  { label: 'No phone after 9pm', value: '21' },
  { label: 'No phone after 10pm', value: '22' },
  { label: 'No phone after 11pm', value: '23' },
  { label: 'No phone in bedroom', value: 'bedroom' },
  { label: 'No phone during dinner', value: 'dinner' },
  { label: 'No window tonight', value: null },
];

export const NightCheckInModal: React.FC<NightCheckInModalProps> = ({
  visible,
  onClose,
  todayStats,
}) => {
  const { colors, isDark } = useTheme();
  const [selectedWindow, setSelectedWindow] = useState<string | null>(null);
  const [shouldRender, setShouldRender] = useState(visible);

  const pulseValue = useSharedValue(1);

  React.useEffect(() => {
    if (visible) {
      setShouldRender(true);
      pulseValue.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1200 }),
          withTiming(1.0, { duration: 1200 })
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
      onRequestClose={() => onClose(selectedWindow)}
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
          {/* Animated Moon Icon */}
          <Animated.View style={[styles.iconContainer, pulseStyle]}>
            <View style={[styles.glowRing, { backgroundColor: '#818CF820' }]}>
              <Ionicons name="moon-sharp" size={38} color="#818CF8" />
            </View>
          </Animated.View>

          {/* Header Texts */}
          <Text style={[styles.title, { color: colors.text }]}>Evening Reflection</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Look back at today with kindness and set your evening boundary.
          </Text>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Today's Performance */}
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>TODAY'S JOURNEY</Text>

            {todayStats ? (
              <View style={[styles.todayCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)', borderColor: colors.border }]}>
                <View style={styles.statRow}>
                  <View style={styles.statCol}>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>LOGGED GRABS</Text>
                    <Text style={[styles.statValueText, { color: colors.text }]}>{todayStats.count}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.statCol}>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>DAILY TARGET</Text>
                    <Text style={[styles.statValueText, { color: colors.text }]}>{todayStats.limit}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.statCol}>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>RESULT</Text>
                    <View style={[
                      styles.resultBadge,
                      { backgroundColor: todayStats.success ? '#10B98118' : '#EF444418' }
                    ]}>
                      <Text style={[
                        styles.resultBadgeText,
                        { color: todayStats.success ? '#10B981' : '#EF4444' }
                      ]}>
                        {todayStats.success ? 'SAFE' : 'OVER'}
                      </Text>
                    </View>
                  </View>
                </View>

                {todayStats.topTrigger && (
                  <View style={[styles.insightRow, { borderTopColor: colors.border }]}>
                    <Ionicons name="bulb-outline" size={14} color="#818CF8" />
                    <Text style={[styles.insightText, { color: colors.text }]}>
                      Your main trigger today was <Text style={{ fontWeight: '900', color: colors.primary }}>{todayStats.topTrigger}</Text>.
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={[styles.todayCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)', borderColor: colors.border, paddingVertical: 18 }]}>
                <Ionicons name="moon-outline" size={24} color="#818CF8" style={{ alignSelf: 'center', marginBottom: 8 }} />
                <Text style={[styles.welcomeText, { color: colors.text }]}>
                  Today is just beginning. Come back this evening to reflect!
                </Text>
              </View>
            )}

            {/* Phone-Free Window Selector */}
            <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 16 }]}>
              TONIGHT'S PHONE-FREE WINDOW
            </Text>

            <View style={styles.optionsGrid}>
              {PHONE_FREE_OPTIONS.map((option) => {
                const isSelected = selectedWindow === option.value;
                return (
                  <Pressable
                    key={option.label}
                    onPress={() => setSelectedWindow(option.value)}
                    style={({ pressed }) => [
                      styles.optionItem,
                      {
                        backgroundColor: isSelected
                          ? colors.primary + '10'
                          : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        borderColor: isSelected ? colors.primary : 'transparent',
                        opacity: pressed ? 0.8 : 1,
                      }
                    ]}
                  >
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'moon-outline'}
                      size={16}
                      color={isSelected ? colors.primary : colors.textMuted}
                    />
                    <Text style={[
                      styles.optionLabelText,
                      {
                        color: isSelected ? colors.text : colors.textMuted,
                        fontWeight: isSelected ? '800' : '500',
                      }
                    ]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Action button */}
          <Pressable
            onPress={() => onClose(selectedWindow)}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.985 : 1 }]
              }
            ]}
          >
            <Ionicons name="moon-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.buttonText}>Close the Day</Text>
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
  sectionTitle: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  todayCard: {
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
  optionsGrid: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 12,
  },
  optionLabelText: {
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
