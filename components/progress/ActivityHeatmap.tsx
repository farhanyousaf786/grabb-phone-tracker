import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { getLocalDateString } from '@/utils/date';

interface GrabEntry {
  timestamp: number;
  date: string;
  trigger?: string;
}

type FilterMode = '7d' | '30d' | 'all' | 'custom';
type ViewMode = 'hourly' | 'daily' | 'weekly';

interface ActivityHeatmapProps {
  grabs: GrabEntry[];
  filterMode: FilterMode;
  customStart?: string;
  customEnd?: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  grabs,
  filterMode,
  customStart,
  customEnd,
}) => {
  const { colors, isDark } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('hourly');
  const [navOffset, setNavOffset] = useState(0);
  const [tooltip, setTooltip] = React.useState<string | null>(null);

  const getDateRange = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    today.setMinutes(0, 0, 0);

    let startDate = new Date();
    let endDate = new Date();
    let windowDays = 7;

    if (viewMode === 'weekly') {
      windowDays = 28; // 4 weeks
    }

    if (filterMode === 'custom' && customStart && customEnd) {
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
      const diffTime = endDate.getTime() - startDate.getTime();
      windowDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } else if (filterMode === 'all') {
      if (grabs.length > 0) {
        const dates = grabs.map((g) => g.date).sort();
        startDate = new Date(dates[0]);
        endDate = new Date(dates[dates.length - 1]);
        const diffTime = endDate.getTime() - startDate.getTime();
        windowDays = Math.min(Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1, viewMode === 'weekly' ? 28 : 7);
      } else {
        startDate.setDate(today.getDate() - (windowDays - 1));
        endDate = today;
      }
    } else if (filterMode === '30d') {
      startDate.setDate(today.getDate() - 29);
      endDate = today;
      windowDays = viewMode === 'weekly' ? 28 : 7;
    } else {
      // 7d default
      startDate.setDate(today.getDate() - (windowDays - 1));
      endDate = today;
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Apply navigation offset
    const offsetDays = navOffset * windowDays;
    const shiftedStart = new Date(startDate);
    shiftedStart.setDate(startDate.getDate() + offsetDays);
    const shiftedEnd = new Date(endDate);
    shiftedEnd.setDate(endDate.getDate() + offsetDays);

    return { startDate: shiftedStart, endDate: shiftedEnd, windowDays };
  }, [grabs, filterMode, customStart, customEnd, viewMode, navOffset]);

  const { rows, cols, grid, maxCount, xLabels, yLabels } = useMemo(() => {
    const { startDate, endDate } = getDateRange;
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (viewMode === 'hourly') {
      const dayList: string[] = [];
      const dayLabels: string[] = [];
      for (let i = 0; i < diffDays; i++) {
        const curr = new Date(startDate);
        curr.setDate(startDate.getDate() + i);
        dayList.push(getLocalDateString(curr));
        dayLabels.push(
          curr.toLocaleDateString('en-US', { weekday: 'narrow', month: 'numeric', day: 'numeric' })
        );
      }

      const gridData: number[][] = dayList.map(() => Array(24).fill(0));
      let peak = 0;
      grabs.forEach((g) => {
        const gDate = new Date(g.timestamp);
        const dateStr = getLocalDateString(gDate);
        const dayIdx = dayList.indexOf(dateStr);
        if (dayIdx !== -1) {
          const hour = gDate.getHours();
          gridData[dayIdx][hour]++;
          if (gridData[dayIdx][hour] > peak) peak = gridData[dayIdx][hour];
        }
      });

      const xL: { idx: number; label: string }[] = [];
      for (let h = 0; h < 24; h += 4) {
        const label = h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`;
        xL.push({ idx: h, label });
      }

      return { rows: dayLabels.length, cols: 24, grid: gridData, maxCount: peak, xLabels: xL, yLabels: dayLabels };
    }

    if (viewMode === 'daily') {
      const dayList: string[] = [];
      const dayLabels: string[] = [];
      for (let i = 0; i < diffDays; i++) {
        const curr = new Date(startDate);
        curr.setDate(startDate.getDate() + i);
        dayList.push(getLocalDateString(curr));
        dayLabels.push(
          curr.toLocaleDateString('en-US', { weekday: 'narrow', month: 'numeric', day: 'numeric' })
        );
      }

      const gridData: number[][] = dayList.map((_, idx) => [0]);
      let peak = 0;
      grabs.forEach((g) => {
        const gDate = new Date(g.timestamp);
        const dateStr = getLocalDateString(gDate);
        const dayIdx = dayList.indexOf(dateStr);
        if (dayIdx !== -1) {
          gridData[dayIdx][0]++;
          if (gridData[dayIdx][0] > peak) peak = gridData[dayIdx][0];
        }
      });

      return { rows: dayLabels.length, cols: 1, grid: gridData, maxCount: peak, xLabels: [{ idx: 0, label: 'Day' }], yLabels: dayLabels };
    }

    // weekly
    const weekList: { label: string; start: Date; end: Date }[] = [];
    let curr = new Date(startDate);
    while (curr.getTime() <= endDate.getTime()) {
      const weekStart = new Date(curr);
      const weekEnd = new Date(curr);
      weekEnd.setDate(weekEnd.getDate() + 6);
      if (weekEnd.getTime() > endDate.getTime()) weekEnd.setTime(endDate.getTime());
      weekList.push({
        label: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        start: weekStart,
        end: weekEnd,
      });
      curr.setDate(curr.getDate() + 7);
    }

    const gridData: number[][] = weekList.map(() => [0]);
    let peak = 0;
    grabs.forEach((g) => {
      const ts = g.timestamp;
      for (let i = 0; i < weekList.length; i++) {
        if (ts >= weekList[i].start.getTime() && ts <= weekList[i].end.getTime()) {
          gridData[i][0]++;
          if (gridData[i][0] > peak) peak = gridData[i][0];
          break;
        }
      }
    });

    return { rows: weekList.length, cols: 1, grid: gridData, maxCount: peak, xLabels: [{ idx: 0, label: 'Week' }], yLabels: weekList.map((w) => w.label) };
  }, [grabs, viewMode, getDateRange]);

  const getCellColor = (count: number) => {
    if (count === 0) return isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
    const intensity = maxCount > 0 ? count / maxCount : 0;
    if (isDark) {
      const alpha = 0.15 + intensity * 0.85;
      return `rgba(167,139,250,${alpha})`;
    }
    const alpha = 0.12 + intensity * 0.88;
    return `rgba(139,92,246,${alpha})`;
  };

  const cellSize = viewMode === 'hourly'
    ? Math.max(10, Math.min(14, (SCREEN_WIDTH - 80) / 24))
    : Math.max(24, Math.min(32, (SCREEN_WIDTH - 100) / Math.max(cols, 1)));

  if (grabs.length === 0) {
    return (
      <Animated.View entering={FadeInUp.delay(260).duration(500)} style={[styles.container, { backgroundColor: colors.surface, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderWidth: 1 }]}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>ACTIVITY HEATMAP</Text>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No data to display</Text>
      </Animated.View>
    );
  }

  const viewModeButtons: { mode: ViewMode; label: string; icon: any }[] = [
    { mode: 'hourly', label: 'Hourly', icon: 'time-outline' },
    { mode: 'daily', label: 'Daily', icon: 'calendar-outline' },
    { mode: 'weekly', label: 'Weekly', icon: 'grid-outline' },
  ];

  return (
    <Animated.View entering={FadeInUp.delay(260).duration(500)} style={[styles.container, { backgroundColor: colors.surface, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderWidth: 1 }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>ACTIVITY HEATMAP</Text>
        {tooltip && (
          <View style={[styles.tooltipBadge, { backgroundColor: colors.primary + '18' }]}>
            <Text style={[styles.tooltipText, { color: colors.primary }]}>{tooltip}</Text>
          </View>
        )}
      </View>

      {/* Navigation arrows + period label */}
      <View style={styles.navRow}>
        <Pressable
          onPress={() => setNavOffset((o) => o - 1)}
          style={({ pressed }) => [
            styles.navArrowBtn,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', opacity: pressed ? 0.7 : 1 }
          ]}
        >
          <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
        </Pressable>

        <Text style={[styles.navLabel, { color: colors.text }]}>
          {(() => {
            const { startDate, endDate } = getDateRange;
            const sameYear = startDate.getFullYear() === endDate.getFullYear();
            const sameMonth = startDate.getMonth() === endDate.getMonth();
            const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const fmtYear = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            if (sameMonth && sameYear) {
              return `${fmt(startDate)} – ${fmt(endDate)}`;
            }
            return `${fmtYear(startDate)} – ${fmtYear(endDate)}`;
          })()}
        </Text>

        <Pressable
          onPress={() => setNavOffset((o) => o + 1)}
          style={({ pressed }) => [
            styles.navArrowBtn,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', opacity: pressed ? 0.7 : 1 }
          ]}
        >
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* View mode toggles */}
      <View style={styles.modeToggleRow}>
        {viewModeButtons.map((btn) => {
          const isActive = viewMode === btn.mode;
          return (
            <Pressable
              key={btn.mode}
              onPress={() => setViewMode(btn.mode)}
              style={({ pressed }) => [
                styles.modeBtn,
                {
                  backgroundColor: isActive ? colors.primary + '18' : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  borderColor: isActive ? colors.primary : 'transparent',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Ionicons name={btn.icon} size={12} color={isActive ? colors.primary : colors.textMuted} />
              <Text style={[styles.modeBtnText, { color: isActive ? colors.primary : colors.textMuted }]}>{btn.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <Text style={[styles.legendText, { color: colors.textMuted }]}>Less</Text>
        <View style={styles.legendCells}>
          {[0, 0.25, 0.5, 0.75, 1].map((level, i) => (
            <View
              key={i}
              style={[
                styles.legendCell,
                {
                  backgroundColor:
                    level === 0
                      ? isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'
                      : isDark
                        ? `rgba(167,139,250,${0.15 + level * 0.85})`
                        : `rgba(139,92,246,${0.12 + level * 0.88})`,
                },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.legendText, { color: colors.textMuted }]}>More</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gridScrollContent}>
        <View>
          {/* X-axis labels */}
          <View style={styles.xLabelsRow}>
            <View style={[styles.yLabelCell, { width: viewMode === 'hourly' ? 44 : 60 }]} />
            {viewMode === 'hourly'
              ? Array.from({ length: 24 }, (_, h) => (
                  <View key={h} style={[styles.xLabelCell, { width: cellSize }]}>
                    {xLabels.find((xl) => xl.idx === h) && (
                      <Text style={[styles.xLabelText, { color: colors.textMuted }]}>
                        {xLabels.find((xl) => xl.idx === h)?.label}
                      </Text>
                    )}
                  </View>
                ))
              : xLabels.map((xl) => (
                  <View key={xl.idx} style={[styles.xLabelCell, { width: cellSize }]}>
                    <Text style={[styles.xLabelText, { color: colors.textMuted }]}>{xl.label}</Text>
                  </View>
                ))}
          </View>

          {/* Grid rows */}
          {yLabels.map((yLabel, rowIdx) => (
            <View key={rowIdx} style={styles.gridRow}>
              <View style={[styles.yLabelCell, { width: viewMode === 'hourly' ? 44 : 60 }]}>
                <Text style={[styles.yLabelText, { color: colors.textMuted }]} numberOfLines={1}>
                  {yLabel}
                </Text>
              </View>
              {grid[rowIdx]?.map((count, colIdx) => (
                <Pressable
                  key={colIdx}
                  onPress={() => {
                    if (viewMode === 'hourly') {
                      const hourLabel = colIdx === 0 ? '12 AM' : colIdx < 12 ? `${colIdx} AM` : colIdx === 12 ? '12 PM' : `${colIdx - 12} PM`;
                      setTooltip(`${yLabel} @ ${hourLabel}: ${count} grab${count === 1 ? '' : 's'}`);
                    } else if (viewMode === 'daily') {
                      setTooltip(`${yLabel}: ${count} grab${count === 1 ? '' : 's'}`);
                    } else {
                      setTooltip(`${yLabel}: ${count} grab${count === 1 ? '' : 's'}`);
                    }
                    setTimeout(() => setTooltip(null), 3000);
                  }}
                  style={[
                    styles.cell,
                    {
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: getCellColor(count),
                      borderRadius: cellSize * 0.2,
                    },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.015,
    shadowRadius: 8,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 9.5,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '900',
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 24,
  },
  tooltipBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tooltipText: {
    fontSize: 9.5,
    fontWeight: '900',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  navArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  modeToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  modeBtnText: {
    fontSize: 10,
    fontWeight: '800',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginBottom: 10,
  },
  legendText: {
    fontSize: 9,
    fontWeight: '700',
  },
  legendCells: {
    flexDirection: 'row',
    gap: 3,
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  gridScrollContent: {
    paddingRight: 4,
  },
  xLabelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  xLabelCell: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 14,
  },
  xLabelText: {
    fontSize: 7.5,
    fontWeight: '800',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  yLabelCell: {
    justifyContent: 'center',
    paddingRight: 6,
  },
  yLabelText: {
    fontSize: 8.5,
    fontWeight: '800',
    textAlign: 'right',
  },
  cell: {
    marginRight: 3,
  },
});
