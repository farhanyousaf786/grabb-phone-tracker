import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { TRIGGER_EMOJI, TRIGGER_COLORS, TriggerName } from '@/constants/mockData';

interface GrabEntry {
  id?: string;
  timestamp: number;
  date: string;
  trigger?: string;
}

type RecordsFilter = 'all' | 'today' | 'week' | 'month';

interface RecordsLogProps {
  grabs: GrabEntry[];
}

const TRIGGER_ICONS: Record<string, string> = {
  Habit: 'sync-sharp',
  Anxious: 'pulse-sharp',
  Boredom: 'cafe-sharp',
  Notif: 'notifications-sharp',
  Avoidance: 'shield-sharp',
};

export const RecordsLog: React.FC<RecordsLogProps> = ({ grabs }) => {
  const { colors, isDark } = useTheme();
  const [recordsFilter, setRecordsFilter] = useState<RecordsFilter>('all');

  const filteredGrabs = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const startOfWeek = new Date();
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    let filtered = [...grabs].sort((a, b) => b.timestamp - a.timestamp);

    if (recordsFilter === 'today') {
      filtered = filtered.filter((g) => g.date === todayStr);
    } else if (recordsFilter === 'week') {
      filtered = filtered.filter((g) => g.timestamp >= startOfWeek.getTime());
    } else if (recordsFilter === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      filtered = filtered.filter((g) => g.timestamp >= startOfMonth.getTime());
    }

    return filtered;
  }, [grabs, recordsFilter]);

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const dStr = d.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const yestStr = yesterday.toISOString().split('T')[0];

    if (dStr === todayStr) return 'Today';
    if (dStr === yestStr) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Group by date
  const grouped = useMemo(() => {
    const groups: { dateStr: string; dateLabel: string; items: GrabEntry[] }[] = [];
    filteredGrabs.forEach((g) => {
      const dateLabel = formatDate(g.timestamp);
      const dateStr = g.date;
      const existing = groups.find((grp) => grp.dateStr === dateStr);
      if (existing) {
        existing.items.push(g);
      } else {
        groups.push({ dateStr, dateLabel, items: [g] });
      }
    });
    return groups;
  }, [filteredGrabs]);

  const filterButtons: { key: RecordsFilter; label: string }[] = [
    { key: 'all', label: 'All Time' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ];

  return (
    <Animated.View entering={FadeInUp.delay(300).duration(500)} style={[styles.container, { backgroundColor: colors.surface, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderWidth: 1 }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>GRAB RECORDS</Text>
        <View style={[styles.countBadge, { backgroundColor: colors.primary + '18' }]}>
          <Text style={[styles.countText, { color: colors.primary }]}>{filteredGrabs.length} total</Text>
        </View>
      </View>

      {/* Filter toggles */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
        {filterButtons.map((btn) => {
          const isActive = recordsFilter === btn.key;
          return (
            <Pressable
              key={btn.key}
              onPress={() => setRecordsFilter(btn.key)}
              style={({ pressed }) => [
                styles.filterBtn,
                {
                  backgroundColor: isActive ? colors.primary + '18' : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  borderColor: isActive ? colors.primary : 'transparent',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={[styles.filterBtnText, { color: isActive ? colors.primary : colors.textMuted }]}>
                {btn.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Records list */}
      {filteredGrabs.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No grabs found for this period</Text>
      ) : (
        <View style={styles.recordsList}>
          {grouped.map((group) => (
            <View key={group.dateStr}>
              {/* Date header */}
              <View style={[styles.dateHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
                <Text style={[styles.dateHeaderText, { color: colors.text }]}>{group.dateLabel}</Text>
                <Text style={[styles.dateHeaderCount, { color: colors.textMuted }]}>
                  {group.items.length} grab{group.items.length === 1 ? '' : 's'}
                </Text>
              </View>

              {/* Entries for this date */}
              {group.items.map((item, idx) => {
                const trigger = item.trigger || 'Unknown';
                const triggerColor = TRIGGER_COLORS[trigger as TriggerName] || { bg: colors.primary, color: '#FFFFFF' };
                const iconName = TRIGGER_ICONS[trigger] || 'help-circle-sharp';
                const emoji = TRIGGER_EMOJI[trigger as TriggerName] || '❓';

                return (
                  <View
                    key={idx}
                    style={[
                      styles.entryRow,
                      idx === group.items.length - 1 && styles.entryRowLast,
                      { borderBottomColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' },
                    ]}
                  >
                    <View style={[styles.entryTimeCell, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}>
                      <Text style={[styles.entryTimeText, { color: colors.textMuted }]}>{formatTime(item.timestamp)}</Text>
                    </View>

                    <View style={styles.entryTriggerCell}>
                      <View style={[styles.triggerIconFrame, { backgroundColor: triggerColor.bg + '1A' }]}>
                        <Ionicons name={iconName as any} size={12} color={triggerColor.color} />
                      </View>
                      <Text style={[styles.triggerName, { color: colors.text }]}>
                        {emoji} {trigger}
                      </Text>
                    </View>

                    <View style={styles.entryCountCell}>
                      <Text style={[styles.entryCountText, { color: colors.textMuted }]}>#{group.items.length - idx}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      )}
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
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countText: {
    fontSize: 9.5,
    fontWeight: '900',
  },
  filterScroll: {
    gap: 8,
    paddingRight: 4,
    marginBottom: 12,
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  filterBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 24,
  },
  recordsList: {
    gap: 4,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginTop: 4,
  },
  dateHeaderText: {
    fontSize: 11.5,
    fontWeight: '900',
  },
  dateHeaderCount: {
    fontSize: 10,
    fontWeight: '700',
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 10,
  },
  entryRowLast: {
    borderBottomWidth: 0,
  },
  entryTimeCell: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  entryTimeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  entryTriggerCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  },
  entryCountCell: {
    width: 32,
    alignItems: 'flex-end',
  },
  entryCountText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
});
