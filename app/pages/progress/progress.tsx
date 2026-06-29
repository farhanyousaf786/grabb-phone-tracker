import React, { useState, useCallback } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Dimensions, Pressable, TextInput, Modal, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { DAILY_LIMIT_DEFAULT, TRIGGER_COLORS, TriggerName } from '@/constants/mockData';
import { storage, PlanConfig } from '@/utils/storage';
import { useTheme } from '@/context/ThemeContext';
import Animated, { FadeIn, FadeInUp, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ActivityHeatmap } from '@/components/progress/ActivityHeatmap';
import { RecordsLog } from '@/components/progress/RecordsLog';
import { getLocalDateString } from '@/utils/date';

const TRIGGER_ICONS: Record<string, string> = {
  Habit: 'sync-sharp',
  Anxious: 'pulse-sharp',
  Boredom: 'cafe-sharp',
  Notif: 'notifications-sharp',
  Avoidance: 'shield-sharp',
};

type FilterMode = '7d' | '30d' | 'all' | 'custom';

export default function ProgressScreen() {
  const { colors, isDark } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [allGrabs, setAllGrabs] = useState<any[]>([]);
  const [limit, setLimit] = useState(DAILY_LIMIT_DEFAULT);
  
  // Filter settings
  const [filterMode, setFilterMode] = useState<FilterMode>('7d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  
  // Active statistics for the selected filtered range
  const [filteredChartData, setFilteredChartData] = useState<{ date: string; displayDate: string; count: number }[]>([]);
  const [periodAverage, setPeriodAverage] = useState(0);
  const [periodSuccessRate, setPeriodSuccessRate] = useState(0);
  const [periodTotalGrabs, setPeriodTotalGrabs] = useState(0);
  
  // Interactive bar tapping tooltips
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);

  // General weekly/overall metrics
  const [triggerBreakdown, setTriggerBreakdown] = useState<{ trigger: string; count: number }[]>([]);
  const [insights, setInsights] = useState({
    peakWindow: 'N/A',
    topTrigger: 'None',
    bestDay: 'N/A',
    clearMornings: '0 of 7'
  });

  const loadStats = async () => {
    try {
      const grabs = await storage.getAllGrabs();
      setAllGrabs(grabs);
      
      const dailyLimit = await storage.getDailyLimit();
      setLimit(dailyLimit);

      // Default custom start/end if empty
      const todayStr = getLocalDateString();
      if (!customEnd) setCustomEnd(todayStr);
      if (!customStart) {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 6);
        setCustomStart(getLocalDateString(weekAgo));
      }

      calculatePeriodData(grabs, filterMode, customStart || todayStr, customEnd || todayStr, dailyLimit);
      setLoading(false);
    } catch (err) {
      console.error('Error loading progress stats:', err);
      setLoading(false);
    }
  };

  const calculatePeriodData = (
    grabs: any[], 
    mode: FilterMode, 
    startDStr: string, 
    endDStr: string,
    currentLimit: number
  ) => {
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (mode === '7d') {
      startDate.setDate(today.getDate() - 6);
    } else if (mode === '30d') {
      startDate.setDate(today.getDate() - 29);
    } else if (mode === 'all') {
      if (grabs.length > 0) {
        const dates = grabs.map(g => g.date).sort();
        startDate = new Date(dates[0]);
      } else {
        startDate.setDate(today.getDate() - 6);
      }
    } else {
      startDate = new Date(startDStr);
      endDate = new Date(endDStr);
    }

    startDate.setHours(0,0,0,0);
    endDate.setHours(23,59,59,999);

    // Calculate dates array inside range
    const chartPoints: { date: string; displayDate: string; count: number }[] = [];
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    for (let i = 0; i < diffDays; i++) {
      const curr = new Date(startDate);
      curr.setDate(startDate.getDate() + i);
      const dateStr = getLocalDateString(curr);
      
      const count = grabs.filter(g => g.date === dateStr).length;
      
      // Formatting date displays
      let displayDate = '';
      if (diffDays <= 7) {
        displayDate = curr.toLocaleDateString('en-US', { weekday: 'narrow' });
      } else if (diffDays <= 30) {
        if (i % 5 === 0 || i === diffDays - 1) {
          displayDate = curr.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
      } else {
        if (i % 15 === 0 || i === diffDays - 1) {
          displayDate = curr.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
      }

      chartPoints.push({
        date: dateStr,
        displayDate,
        count
      });
    }

    setFilteredChartData(chartPoints);

    // Calculations for the selected period
    const totalGrabs = chartPoints.reduce((acc, p) => acc + p.count, 0);
    setPeriodTotalGrabs(totalGrabs);
    
    const avg = diffDays > 0 ? Math.round(totalGrabs / diffDays) : 0;
    setPeriodAverage(avg);

    const onTrackDays = chartPoints.filter(p => p.count <= currentLimit && p.count > 0).length;
    const activeDays = chartPoints.filter(p => p.count > 0).length;
    const rate = activeDays > 0 ? Math.round((onTrackDays / activeDays) * 100) : 100;
    setPeriodSuccessRate(rate);

    // ---- TRIGGER BREAKDOWN & INSIGHTS (Computed from overall current week) ----
    const startOfWeek = new Date();
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0,0,0,0);
    const startOfWeekTime = startOfWeek.getTime();

    const currentWeekGrabs = grabs.filter(g => g.timestamp >= startOfWeekTime);
    const counts: Record<string, number> = {};
    currentWeekGrabs.forEach(g => {
      counts[g.trigger] = (counts[g.trigger] || 0) + 1;
    });
    
    const breakdown = Object.entries(counts)
      .map(([trigger, count]) => ({ trigger, count }))
      .sort((a, b) => b.count - a.count);
    setTriggerBreakdown(breakdown);

    // Peak Window
    const hourCounts = Array(12).fill(0);
    grabs.forEach(g => {
      const hour = new Date(g.timestamp).getHours();
      const windowIdx = Math.floor(hour / 2);
      hourCounts[windowIdx]++;
    });
    
    let peakIdx = 0;
    let maxPeak = 0;
    hourCounts.forEach((cnt, idx) => {
      if (cnt > maxPeak) {
        maxPeak = cnt;
        peakIdx = idx;
      }
    });
    const startHour = peakIdx * 2;
    const formatHour = (h: number) => {
      if (h === 0) return '12am';
      if (h === 12) return '12pm';
      return h > 12 ? `${h - 12}pm` : `${h}am`;
    };
    const peakWindowStr = maxPeak > 0 ? `${formatHour(startHour)}–${formatHour(startHour + 2)}` : 'N/A';

    // Best Day in past 7 days
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let bestDayIdx = 0;
    let minGrabs = Infinity;
    
    const weekCounts = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = getLocalDateString(d);
      const dayGrabsCount = grabs.filter(g => g.date === dateStr).length;
      weekCounts.push(dayGrabsCount);
      if (dayGrabsCount < minGrabs) {
        minGrabs = dayGrabsCount;
        bestDayIdx = i;
      }
    }
    const bestDayStr = minGrabs !== Infinity ? `${dayNames[bestDayIdx]} — ${minGrabs} grab${minGrabs === 1 ? '' : 's'}` : 'N/A';

    // Clear Mornings
    let clearMorningsCount = 0;
    const elapsedDays = today.getDay() + 1;
    for (let i = 0; i < elapsedDays; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = getLocalDateString(d);
      const dayGrabs = grabs.filter(g => g.date === dateStr);
      const hasMorningGrabs = dayGrabs.some(g => new Date(g.timestamp).getHours() < 12);
      if (dayGrabs.length > 0 && !hasMorningGrabs) {
        clearMorningsCount++;
      }
    }

    setInsights({
      peakWindow: peakWindowStr,
      topTrigger: breakdown.length > 0 ? breakdown[0].trigger : 'None',
      bestDay: bestDayStr,
      clearMornings: `${clearMorningsCount} of ${elapsedDays}`
    });
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [filterMode, customStart, customEnd])
  );

  const handleFilterSelect = (mode: FilterMode) => {
    setSelectedBarIndex(null);
    if (mode === 'custom') {
      setIsCustomModalOpen(true);
    } else {
      setFilterMode(mode);
    }
  };

  const handleCustomApply = () => {
    setIsCustomModalOpen(false);
    setFilterMode('custom');
  };

  const maxChartValue = Math.max(...filteredChartData.map(p => p.count), 1);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0A061E' : '#F5F3FF' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>CALIBRATING ANALYTICS CONSOLE...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Selected bar date details for tooltip display
  const activeTooltipPoint = selectedBarIndex !== null ? filteredChartData[selectedBarIndex] : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0A061E' : '#F5F3FF' }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Header Block */}
        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.headerBlock}>
          <Text style={[styles.title, { color: colors.text }]}>Usage Analytics</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Cognitive metrics and trigger analysis over time.
          </Text>
        </Animated.View>

        {/* Dynamic Filter Capsule Toggles */}
        <Animated.View entering={FadeInUp.delay(180).duration(500)} style={styles.filterRow}>
          {[
            { mode: '7d', label: '7 Days' },
            { mode: '30d', label: '30 Days' },
            { mode: 'all', label: 'All Time' },
            { mode: 'custom', label: customStart && filterMode === 'custom' ? 'Custom Filter' : 'Custom Range' }
          ].map(btn => {
            const isSelected = filterMode === btn.mode;
            return (
              <Pressable
                key={btn.mode}
                style={({ pressed }) => [
                  styles.filterBtn,
                  {
                    backgroundColor: isSelected ? colors.primary + '18' : colors.surface,
                    borderColor: isSelected ? colors.primary : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                    opacity: pressed ? 0.85 : 1
                  }
                ]}
                onPress={() => handleFilterSelect(btn.mode as FilterMode)}
              >
                <Text style={[styles.filterBtnText, { color: isSelected ? colors.primary : colors.textMuted }]}>
                  {btn.label}
                </Text>
              </Pressable>
            );
          })}
        </Animated.View>

        {/* PRIMARY: Futuristic Glowing Interactive Bar Chart Card */}
        <Animated.View 
          entering={FadeInUp.delay(220).duration(500)} 
          style={[
            styles.chartCard, 
            { 
              backgroundColor: colors.surface, 
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              borderWidth: 1
            }
          ]}
        >
          <View style={styles.chartHeader}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              {filterMode === '7d' ? 'WEEKLY FOCUS TIMELINE' : 
               filterMode === '30d' ? '30-DAY TAPERING HISTOGRAM' : 
               filterMode === 'all' ? 'ALL-TIME CHRONOLOGY' : 
               `CUSTOM WINDOW: ${customStart} to ${customEnd}`}
            </Text>
            
            {/* Limit Reference Tag */}
            <View style={[styles.limitBadge, { backgroundColor: colors.primary + '1A' }]}>
              <Text style={[styles.limitBadgeText, { color: colors.primary }]}>Limit: ≤{limit}</Text>
            </View>
          </View>

          {/* Interactive Tooltip Overlay */}
          {activeTooltipPoint && (
            <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(100)} style={[styles.tooltipContainer, { backgroundColor: isDark ? '#1C153A' : '#EDE8FF', borderColor: colors.primary + '40' }]}>
              <Ionicons name="stats-chart" size={12} color={colors.primary} />
              <Text style={[styles.tooltipText, { color: colors.text }]}>
                {new Date(activeTooltipPoint.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}: <Text style={{ fontWeight: '900', color: colors.primary }}>{activeTooltipPoint.count} grabs</Text>
              </Text>
              <Pressable onPress={() => setSelectedBarIndex(null)} style={styles.closeTooltip}>
                <Ionicons name="close" size={14} color={colors.textMuted} />
              </Pressable>
            </Animated.View>
          )}

          {/* Graphical Plot container */}
          <View style={styles.chartBody}>
            {/* Daily limit reference guide-line */}
            <View style={[styles.limitLine, { top: `${Math.max(0, 100 - (limit / maxChartValue) * 100)}%`, borderBottomColor: colors.primary + '40' }]} />
            
            <View style={styles.barsContainer}>
              {filteredChartData.map((p, index) => {
                const heightPercent = Math.max((p.count / maxChartValue) * 100, 3);
                const isOverLimit = p.count > limit;
                const isSelected = selectedBarIndex === index;
                
                // Color codes
                let barColor = colors.onTrack;
                if (p.count === 0) {
                  barColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
                } else if (isOverLimit) {
                  barColor = colors.danger;
                } else if (isSelected) {
                  barColor = colors.primary;
                }

                return (
                  <Pressable 
                    key={p.date}
                    style={styles.barWrapper}
                    onPress={() => setSelectedBarIndex(index)}
                  >
                    <View style={styles.barFillTrack}>
                      <View 
                        style={[
                          styles.barFillFill, 
                          { 
                            height: `${heightPercent}%`, 
                            backgroundColor: barColor,
                            shadowColor: barColor,
                            shadowOpacity: isSelected || isOverLimit ? 0.35 : 0
                          }
                        ]} 
                      />
                    </View>
                    {filterMode === '7d' && p.displayDate ? (
                      <Text style={[styles.barXLabel, { color: colors.textMuted }]}>{p.displayDate}</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {filterMode !== '7d' && (
            <View style={styles.chartDateRow}>
              <Text style={[styles.chartDateText, { color: colors.textMuted }]}>
                {filteredChartData[0]?.date ? new Date(filteredChartData[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
              </Text>
              <View style={[styles.chartDateLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]} />
              <Text style={[styles.chartDateText, { color: colors.textMuted }]}>
                {filteredChartData[filteredChartData.length - 1]?.date ? new Date(filteredChartData[filteredChartData.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
              </Text>
            </View>
          )}

          {/* Dynamic Period statistics metrics board */}
          <View style={[styles.metricGrid, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
            <View style={styles.metricCell}>
              <Text style={[styles.metricCellVal, { color: colors.text }]}>{periodTotalGrabs}</Text>
              <Text style={[styles.metricCellLabel, { color: colors.textMuted }]}>Total grabs</Text>
            </View>
            <View style={[styles.metricCellDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]} />
            <View style={styles.metricCell}>
              <Text style={[styles.metricCellVal, { color: colors.text }]}>{periodAverage}</Text>
              <Text style={[styles.metricCellLabel, { color: colors.textMuted }]}>Period average</Text>
            </View>
            <View style={[styles.metricCellDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]} />
            <View style={styles.metricCell}>
              <Text style={[styles.metricCellVal, { color: periodSuccessRate >= 75 ? '#34D399' : '#EF4444' }]}>
                {periodSuccessRate}%
              </Text>
              <Text style={[styles.metricCellLabel, { color: colors.textMuted }]}>Success rate</Text>
            </View>
          </View>
        </Animated.View>

        {/* Activity Heatmap with toggleable view modes */}
        <ActivityHeatmap
          grabs={allGrabs}
          filterMode={filterMode}
          customStart={customStart}
          customEnd={customEnd}
        />

        {/* Cognitive Insights Card */}
        <Animated.View entering={FadeInUp.delay(280).duration(500)} style={[styles.card, { backgroundColor: colors.surface, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderWidth: 1 }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>BEHAVIORAL INSIGHTS</Text>
          
          {[
            { icon: 'time-outline', color: '#A78BFA', label: 'Peak activity window', value: insights.peakWindow },
            { icon: 'pricetag-outline', color: '#34D399', label: 'Dominant weekly trigger', value: insights.topTrigger, capitalize: true },
            { icon: 'trophy-outline', color: '#F59E0B', label: 'Weekly low grab record', value: insights.bestDay },
            { icon: 'sunny-outline', color: '#3B82F6', label: 'Clear focus mornings', value: insights.clearMornings }
          ].map((item, idx) => (
            <View key={item.label} style={[styles.insightRow, idx === 3 && styles.lastInsight, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <View style={[styles.insightIconFrame, { backgroundColor: item.color + '1A' }]}>
                <Ionicons name={item.icon as any} size={15} color={item.color} />
              </View>
              <View style={styles.insightTexts}>
                <Text style={[styles.insightLabelText, { color: colors.textMuted }]}>{item.label}</Text>
                <Text style={[styles.insightValueText, { color: colors.text, textTransform: item.capitalize ? 'capitalize' : 'none' }]}>
                  {item.value}
                </Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Trigger Breakdown Card */}
        <Animated.View entering={FadeInUp.delay(340).duration(500)} style={[styles.card, { backgroundColor: colors.surface, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderWidth: 1 }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>TRIGGER BREAKDOWN (THIS WEEK)</Text>
          {triggerBreakdown.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No logs compiled this week</Text>
          ) : (
            triggerBreakdown.map((item) => {
              const totalWeekGrabs = triggerBreakdown.reduce((s, b) => s + b.count, 0);
              const percent = totalWeekGrabs > 0 ? Math.round((item.count / totalWeekGrabs) * 100) : 0;
              const colorSet = TRIGGER_COLORS[item.trigger as TriggerName] || { bg: colors.primary, color: '#FFFFFF' };

              return (
                <View key={item.trigger} style={styles.triggerRow}>
                  <View style={styles.triggerIconAndName}>
                    <View style={[styles.triggerIconFrame, { backgroundColor: colorSet.bg + '1A' }]}>
                      <Ionicons 
                        name={(TRIGGER_ICONS[item.trigger] || 'pin-sharp') as any} 
                        size={12} 
                        color={colorSet.color} 
                      />
                    </View>
                    <Text style={[styles.triggerName, { color: colors.text }]}>
                      {item.trigger}
                    </Text>
                  </View>
                  <View style={[styles.triggerTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                    <View style={[styles.triggerFill, { width: `${percent}%`, backgroundColor: colorSet.bg }]} />
                  </View>
                  <Text style={[styles.triggerNum, { color: colors.text }]}>{item.count}</Text>
                </View>
              );
            })
          )}
        </Animated.View>

        {/* Grab Records Log */}
        <RecordsLog grabs={allGrabs} />

      </ScrollView>

      {/* CUSTOM DATE RANGE FILTER MODAL SHEET */}
      <Modal
        visible={isCustomModalOpen}
        transparent
        animationType="none"
        onRequestClose={() => setIsCustomModalOpen(false)}
      >
        <Animated.View 
          entering={FadeIn.duration(180)} 
          exiting={FadeOut.duration(140)} 
          style={[
            styles.modalOverlay,
            { backgroundColor: isDark ? 'rgba(8, 5, 24, 0.85)' : 'rgba(240, 237, 232, 0.85)' }
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsCustomModalOpen(false)} />
          
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
            <View style={styles.modalHeaderBlock}>
              <Ionicons name="calendar-sharp" size={20} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>CALIBRATE DATES WINDOW</Text>
            </View>
            <Text style={[styles.modalDesc, { color: colors.textMuted }]}>
              Input the start and end dates (YYYY-MM-DD) to query logs from device databases.
            </Text>

            {/* Inputs grid */}
            <View style={styles.modalInputsGrid}>
              <View style={styles.modalInputRow}>
                <Text style={[styles.modalInputLabel, { color: colors.text }]}>Start Date</Text>
                <TextInput
                  style={[
                    styles.modalTextInput,
                    { 
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      color: colors.text,
                      borderColor: colors.border
                    }
                  ]}
                  value={customStart}
                  onChangeText={setCustomStart}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={styles.modalInputRow}>
                <Text style={[styles.modalInputLabel, { color: colors.text }]}>End Date</Text>
                <TextInput
                  style={[
                    styles.modalTextInput,
                    { 
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      color: colors.text,
                      borderColor: colors.border
                    }
                  ]}
                  value={customEnd}
                  onChangeText={setCustomEnd}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setIsCustomModalOpen(false)}
                style={({ pressed }) => [
                  styles.modalCancelBtn,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', opacity: pressed ? 0.8 : 1 }
                ]}
              >
                <Text style={[styles.modalCancelBtnText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
              
              <Pressable
                onPress={handleCustomApply}
                style={({ pressed }) => [
                  styles.modalApplyBtn,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }
                ]}
              >
                <Text style={styles.modalApplyBtnText}>Apply Window</Text>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16
  },
  loadingText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2
  },
  content: { padding: 20, paddingBottom: 120 },
  headerBlock: {
    marginTop: 12,
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 13, fontWeight: '600', lineHeight: 18 },

  // Filter Capsule Row
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  filterBtnText: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  // Primary Interactive Chart styles
  chartCard: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 12,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionLabel: { 
    fontSize: 9.5, 
    textTransform: 'uppercase', 
    letterSpacing: 1.5, 
    fontWeight: '900' 
  },
  limitBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  limitBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },

  // Tooltip Overlay
  tooltipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
    position: 'relative',
  },
  tooltipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  closeTooltip: {
    position: 'absolute',
    right: 8,
    padding: 4,
  },

  // Graphical Plot area
  chartBody: {
    height: 120,
    position: 'relative',
    marginBottom: 20,
  },
  limitLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderBottomWidth: 1.5,
    borderStyle: 'dashed',
    zIndex: 1,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
    zIndex: 2,
  },
  barWrapper: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  barFillTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barFillFill: {
    width: '100%',
    borderRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  barXLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    textAlign: 'center',
  },

  // Period stats board
  metricGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 16,
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
  },
  metricCellVal: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  metricCellLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  metricCellDivider: {
    width: 1.5,
    height: 24,
  },

  // Trigger breakdown styles
  card: { 
    borderRadius: 22, 
    padding: 18, 
    marginBottom: 12, 
    shadowColor: '#000', 
    shadowOpacity: 0.015, 
    shadowRadius: 8, 
    elevation: 1 
  },
  emptyText: { 
    fontSize: 12, 
    fontWeight: '700', 
    textAlign: 'center', 
    paddingVertical: 24 
  },
  triggerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    paddingVertical: 8 
  },
  triggerIconAndName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 100,
  },
  triggerIconFrame: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerName: { 
    fontSize: 12, 
    fontWeight: '800', 
    textTransform: 'capitalize', 
    flex: 1 
  },
  triggerTrack: { 
    flex: 1, 
    height: 6, 
    borderRadius: 3, 
    overflow: 'hidden' 
  },
  triggerFill: { 
    height: '100%', 
    borderRadius: 3 
  },
  triggerNum: { 
    width: 24, 
    textAlign: 'right', 
    fontSize: 11.5, 
    fontWeight: '900' 
  },

  // Cognitive insights
  insightRow: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12, 
    borderBottomWidth: 1 
  },
  lastInsight: { 
    borderBottomWidth: 0 
  },
  insightIconFrame: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTexts: {
    flex: 1,
    gap: 1.5,
  },
  insightLabelText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  insightValueText: {
    fontSize: 12.5,
    fontWeight: '900',
  },

  // Custom range dialog styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalDialog: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  modalHeaderBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modalDesc: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  modalInputsGrid: {
    gap: 12,
    marginBottom: 16,
  },
  modalInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalInputLabel: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  modalTextInput: {
    width: 140,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 12.5,
    fontWeight: '800',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  modalCancelBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 12,
    fontWeight: '900',
  },
  modalApplyBtn: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  chartDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginTop: 4,
    marginBottom: 8,
    gap: 12,
  },
  chartDateText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  chartDateLine: {
    flex: 1,
    height: 1,
    borderRadius: 0.5,
  },
});
