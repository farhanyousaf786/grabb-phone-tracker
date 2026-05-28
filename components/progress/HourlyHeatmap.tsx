import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface GrabEntry {
  timestamp: number;
  date: string;
  trigger?: string;
}

type FilterMode = '7d' | '30d' | 'all' | 'custom';

interface HourlyHeatmapProps {
  grabs: GrabEntry[];
  filterMode: FilterMode;
  customStart?: string;
  customEnd?: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export const HourlyHeatmap: React.FC<HourlyHeatmapProps> = ({
  grabs,
  filterMode,
  customStart,
  customEnd,
}) => {
  const { colors, isDark } = useTheme();
  const [tooltip, setTooltip] = React.useState<{
    day: string;
    hour: number;
    count: number;
  } | null>(null);

  const { days, grid, maxCount, hourLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    let startDate = new Date();
    let endDate = new Date();

    if (filterMode === '7d') {
      startDate.setDate(today.getDate() - 6);
    } else if (filterMode === '30d') {
      startDate.setDate(today.getDate() - 29);
    } else if (filterMode === 'all') {
      if (grabs.length > 0) {
        const dates = grabs.map((g) => g.date).sort();
        startDate = new Date(dates[0]);
      } else {
        startDate.setDate(today.getDate() - 6);
      }
    } else if (filterMode === 'custom' && customStart && customEnd) {
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
    } else {
      startDate.setDate(today.getDate() - 6);
    }

    startDate.setHours(0, 0, 0, 0);
    if (filterMode !== 'custom') {
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else {
      endDate.setHours(23, 59, 59, 999);
    }

    // Build day list
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const dayList: string[] = [];
    const dayLabels: string[] = [];

    for (let i = 0; i < diffDays; i++) {
      const curr = new Date(startDate);
      curr.setDate(startDate.getDate() + i);
      const dateStr = curr.toISOString().split('T')[0];
      dayList.push(dateStr);
      dayLabels.push(
        curr.toLocaleDateString('en-US', { weekday: 'narrow', month: 'numeric', day: 'numeric' })
      );
    }

    // Build 2D grid [dayIndex][hour] = count
    const gridData: number[][] = dayList.map(() => Array(24).fill(0));
    let peak = 0;

    grabs.forEach((g) => {
      const gDate = new Date(g.timestamp);
      const dateStr = gDate.toISOString().split('T')[0];
      const dayIdx = dayList.indexOf(dateStr);
      if (dayIdx !== -1) {
        const hour = gDate.getHours();
        gridData[dayIdx][hour]++;
        if (gridData[dayIdx][hour] > peak) {
          peak = gridData[dayIdx][hour];
        }
      }
    });

    // Hour labels every 4 hours
    const hLabels: { hour: number; label: string }[] = [];
    for (let h = 0; h < 24; h += 4) {
      const label = h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`;
      hLabels.push({ hour: h, label });
    }

    return { days: dayLabels, grid: gridData, maxCount: peak, hourLabels: hLabels };
  }, [grabs, filterMode, customStart, customEnd]);

  const getCellColor = (count: number) => {
    if (count === 0) {
      return isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
    }
    const intensity = maxCount > 0 ? count / maxCount : 0;
    // Interpolate from very light to primary
    if (isDark) {
      // Dark mode: start from muted dark, go to primary
      const alpha = 0.15 + intensity * 0.85;
      return `rgba(167,139,250,${alpha})`;
    }
    // Light mode: start from very light purple, go to primary
    const alpha = 0.12 + intensity * 0.88;
    return `rgba(139,92,246,${alpha})`;
  };

  const cellSize = Math.max(10, Math.min(14, (SCREEN_WIDTH - 80) / 24));

  if (grabs.length === 0) {
    return (
      <Animated.View entering={FadeInUp.delay(260).duration(500)} style={[styles.container, { backgroundColor: colors.surface, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderWidth: 1 }]}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>HOURLY HEATMAP</Text>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No data to display</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInUp.delay(260).duration(500)}
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
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>HOURLY HEATMAP</Text>
        {tooltip && (
          <View style={[styles.tooltipBadge, { backgroundColor: colors.primary + '18' }]}>
            <Text style={[styles.tooltipText, { color: colors.primary }]}>
              {tooltip.day} @ {tooltip.hour === 0 ? '12 AM' : tooltip.hour < 12 ? `${tooltip.hour} AM` : tooltip.hour === 12 ? '12 PM' : `${tooltip.hour - 12} PM`}: {tooltip.count} grab{tooltip.count === 1 ? '' : 's'}
            </Text>
          </View>
        )}
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
                      ? isDark
                        ? 'rgba(255,255,255,0.04)'
                        : 'rgba(0,0,0,0.03)'
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
          {/* Hour labels row */}
          <View style={styles.hourLabelsRow}>
            <View style={[styles.dayLabelCell, { width: 44 }]} />
            {Array.from({ length: 24 }, (_, h) => (
              <View key={h} style={[styles.hourLabelCell, { width: cellSize }]}>
                {hourLabels.find((hl) => hl.hour === h) && (
                  <Text style={[styles.hourLabelText, { color: colors.textMuted }]}>
                    {hourLabels.find((hl) => hl.hour === h)?.label}
                  </Text>
                )}
              </View>
            ))}
          </View>

          {/* Grid rows */}
          {days.map((dayLabel, dayIdx) => (
            <View key={dayIdx} style={styles.gridRow}>
              <View style={[styles.dayLabelCell, { width: 44 }]}>
                <Text style={[styles.dayLabelText, { color: colors.textMuted }]} numberOfLines={1}>
                  {dayLabel}
                </Text>
              </View>
              {grid[dayIdx]?.map((count, hour) => (
                <Pressable
                  key={hour}
                  onPress={() => {
                    setTooltip({ day: dayLabel, hour, count });
                    // Auto-clear tooltip after 3s
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
  hourLabelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  hourLabelCell: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 14,
  },
  hourLabelText: {
    fontSize: 7.5,
    fontWeight: '800',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  dayLabelCell: {
    justifyContent: 'center',
    paddingRight: 6,
  },
  dayLabelText: {
    fontSize: 8.5,
    fontWeight: '800',
    textAlign: 'right',
  },
  cell: {
    marginRight: 3,
  },
});
