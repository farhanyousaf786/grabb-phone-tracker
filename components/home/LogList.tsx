import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { TRIGGER_COLORS, TriggerName } from '@/constants/mockData';
import { GrabLog } from '@/utils/storage';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { DiagnosticReport } from './DiagnosticReport';
import Animated, { 
  FadeIn, 
  FadeOut, 
  ZoomIn, 
  ZoomOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing
} from 'react-native-reanimated';

interface LogListProps {
  logs: GrabLog[];
  title?: string;
  limit?: number;
  selectedDate?: string;
  todayIntentionTrigger?: string; // e.g. 'Anxious'
}

const TRIGGER_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  Habit:     'sync-sharp',
  Anxious:   'pulse-sharp',
  Boredom:   'cafe-sharp',
  Notif:     'notifications-sharp',
  Avoidance: 'eye-off-sharp',
  Positive:  'happy-sharp',
};

export const LogList: React.FC<LogListProps> = ({ 
  logs, 
  title = "Today's log", 
  limit = 40, 
  selectedDate = new Date().toISOString().split('T')[0],
  todayIntentionTrigger,
}) => {
  const { colors, isDark } = useTheme();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  // Details Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Floating icon animation for Details Modal
  const floatAnim = useSharedValue(0);

  useEffect(() => {
    if (isModalOpen) {
      floatAnim.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      floatAnim.value = 0;
    }
  }, [isModalOpen]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }],
  }));

  const openDetails = () => {
    setShouldRender(true);
    setIsModalOpen(true);
  };

  const closeDetails = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setShouldRender(false);
    }, 120);
  };

  const toggleGroup = (trigger: string) => {
    setExpandedGroups(prev => ({ ...prev, [trigger]: !prev[trigger] }));
  };

  // Group logs by trigger
  const groupedLogs = logs.reduce((acc, log) => {
    if (!acc[log.trigger]) {
      acc[log.trigger] = [];
    }
    acc[log.trigger].push(log);
    return acc;
  }, {} as Record<string, GrabLog[]>);

  const triggerOrder = Array.from(new Set(logs.map(l => l.trigger)));

  // Format date for the details dialog
  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <View style={styles.container}>
      {/* Header with futuristic Details pill button */}
      <View style={styles.headerRow}>
        <Text style={[styles.logTitle, { color: colors.textMuted }]}>{title}</Text>
        {logs.length > 0 && (
          <Pressable 
            onPress={openDetails}
            style={({ pressed }) => [
              styles.detailsButton,
              { 
                backgroundColor: colors.primary,
                opacity: pressed ? 0.85 : 1
              }
            ]}
          >
            <Ionicons name="stats-chart-sharp" size={12} color="#FFFFFF" style={styles.btnIcon} />
            <Text style={[styles.detailsBtnText, { color: '#FFFFFF' }]}>DETAILS</Text>
          </Pressable>
        )}
      </View>

      {/* Sleek Minimalist Log List */}
      <View style={styles.listContainer}>
        {logs.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="documents-outline" size={24} color={colors.textMuted} style={styles.emptyIcon} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No logs registered for this date</Text>
          </View>
        ) : (
          triggerOrder.map((trigger, index) => {
            const group = groupedLogs[trigger];
            const colorSet = TRIGGER_COLORS[trigger as TriggerName] || { bg: colors.primary, color: '#FFFFFF' };
            const isExpanded = expandedGroups[trigger];
            const latestTime = new Date(group[0].timestamp).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit', 
              hour12: false 
            });

            return (
              <Animated.View 
                entering={FadeIn.delay(index * 60)} 
                key={trigger} 
                style={[
                  styles.logCard, 
                  { 
                    backgroundColor: colors.surface,
                    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    shadowColor: colorSet.bg,
                  }
                ]}
              >
                <Pressable 
                  style={styles.logItem} 
                  onPress={() => toggleGroup(trigger)}
                >
                  {/* Glowing Icon Ring in Trigger Theme Color */}
                  <View style={[styles.iconRing, { backgroundColor: colorSet.bg + '12', borderColor: colorSet.bg + '4D' }]}>
                    <Ionicons 
                      name={TRIGGER_ICONS[trigger] || 'pin-sharp'} 
                      size={18} 
                      color={colorSet.color} 
                    />
                  </View>

                  {/* Clean Trigger Details */}
                  <View style={styles.textContainer}>
                    <Text style={[styles.triggerNameText, { color: colors.text }]}>
                      {trigger}
                    </Text>
                    <Text style={[styles.triggerSubText, { color: colors.textMuted }]}>
                      Last check-in at {latestTime}
                    </Text>
                  </View>

                  {/* Counter Badge */}
                  <View style={[styles.countBadge, { backgroundColor: colorSet.bg + '1A' }]}>
                    <Text style={[styles.countText, { color: colorSet.color }]}>
                      {group.length}x
                    </Text>
                  </View>
                  
                  {/* Chevron Indicator */}
                  <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color={colors.textMuted} 
                  />
                </Pressable>

                {/* Micro-Timeline Trace for Sub-Logs */}
                {isExpanded && (
                  <View style={[styles.expandedContent, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                    {group.map((item, idx) => {
                      const time = new Date(item.timestamp).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        hour12: false 
                      });
                      const isSubLast = idx === group.length - 1;
                      
                      return (
                        <View key={item.id} style={styles.subLogItem}>
                          {/* Timeline node track connector */}
                          <View style={styles.timelineColumn}>
                            <View style={[styles.subLogDot, { backgroundColor: colorSet.bg }]} />
                            {!isSubLast && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
                          </View>
                          
                          <View style={styles.subLogContent}>
                            <Text style={[styles.subLogTime, { color: colors.text }]}>{time}</Text>
                            <Text style={[styles.subLogLabel, { color: colors.textMuted }]}>
                              Log entry verified
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
                {/* Reflection line when trigger matches today's intention */}
                {todayIntentionTrigger && trigger === todayIntentionTrigger && (
                  <View style={[styles.reflectionRow, { borderTopColor: colorSet.bg + '80', backgroundColor: colorSet.bg + '20' }]}>
                    <Text style={styles.reflectionEmoji}>💡</Text>
                    <Text style={[styles.reflectionText, { color: colorSet.color }]}>
                      That was your focus today — noticing it is the work.
                    </Text>
                  </View>
                )}
              </Animated.View>
            );
          })
        )}
      </View>

      {/* TELEMETRY ANALYTICS DETAIL MODAL */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="none"
        onRequestClose={closeDetails}
      >
        {shouldRender && (
          <Animated.View 
            entering={FadeIn.duration(180)} 
            exiting={FadeOut.duration(140)} 
            style={[
              styles.modalOverlay,
              { backgroundColor: isDark ? 'rgba(8, 5, 24, 0.85)' : 'rgba(240, 237, 232, 0.85)' }
            ]}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={closeDetails} />

            <Animated.View 
              entering={ZoomIn.duration(200)} 
              exiting={ZoomOut.duration(150)}
              style={[
                styles.modalDialog, 
                { 
                  backgroundColor: colors.surface,
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
                }
              ]}
            >
              {/* Overlapping animated breathing statistics icon */}
              <Animated.View 
                style={[
                  styles.floatingIconContainer, 
                  floatStyle, 
                  { backgroundColor: colors.primary, borderColor: colors.surface }
                ]}
              >
                <Ionicons name="stats-chart-sharp" size={20} color="#FFFFFF" />
              </Animated.View>

              <View style={{ flex: 1, paddingTop: 12 }}>
                {/* Header Title block */}
                <View style={styles.modalTitleBlock}>
                  <Text style={[styles.modalSubtitle, { color: colors.primary }]}>LOG DIAGNOSTICS</Text>
                  <Text style={[styles.modalDate, { color: colors.text, marginBottom: 8 }]}>{formattedDate.toUpperCase()}</Text>
                </View>

                <DiagnosticReport 
                  allGrabs={logs}
                  elapsedDays={1}
                  onClose={closeDetails}
                  isDailyStatsMode={true}
                />
              </View>
            </Animated.View>
          </Animated.View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 16 },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginBottom: 14, 
    paddingHorizontal: 4 
  },
  logTitle: { 
    fontSize: 10, 
    fontWeight: '900', 
    textTransform: 'uppercase', 
    letterSpacing: 1.5 
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  btnIcon: {
    marginRight: 5,
  },
  detailsBtnText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  listContainer: {
    gap: 8,
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 36,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    marginBottom: 10,
  },
  emptyText: { 
    fontSize: 12, 
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center', 
  },
  logCard: { 
    borderRadius: 16, 
    borderWidth: 1, 
    paddingHorizontal: 16, 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  logItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    paddingVertical: 14 
  },
  iconRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  triggerNameText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  triggerSubText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  countBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 3.5, 
    borderRadius: 8, 
    minWidth: 32, 
    alignItems: 'center', 
  },
  countText: { 
    fontSize: 11, 
    fontWeight: '900',
  },
  expandedContent: { 
    paddingTop: 8,
    paddingBottom: 14,
    borderTopWidth: 1,
    paddingLeft: 12,
  },
  reflectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  reflectionEmoji: {
    fontSize: 14,
  },
  reflectionText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    lineHeight: 15,
  },
  subLogItem: { 
    flexDirection: 'row', 
    alignItems: 'stretch', 
    gap: 14,
  },
  timelineColumn: {
    width: 12,
    alignItems: 'center',
  },
  subLogDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4,
    marginTop: 6,
    zIndex: 2,
  },
  timelineLine: {
    width: 1.5,
    flex: 1,
    opacity: 0.3,
  },
  subLogContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  subLogTime: { 
    fontSize: 12, 
    fontWeight: '800', 
  },
  subLogLabel: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Modal styling definitions
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalDialog: {
    width: '100%',
    height: '75%',
    borderRadius: 24,
    padding: 24,
    paddingTop: 36,
    position: 'relative',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  floatingIconContainer: {
    position: 'absolute',
    top: -20,
    alignSelf: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  modalTitleBlock: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  modalSubtitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
  },
  modalDate: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  hudGrid: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 24,
  },
  hudCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colBorder: {
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
  },
  hudLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  hudValue: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  breakdownHeader: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  breakdownList: {
    gap: 16,
  },
  breakdownRow: {
    gap: 6,
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  breakdownPercent: {
    fontSize: 12,
    fontWeight: '900',
  },
  loadingTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  loadingFill: {
    height: '100%',
    borderRadius: 3,
  },
  dismissBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dismissBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
