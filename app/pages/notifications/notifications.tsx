import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { NotificationService, NotificationLog } from '@/services/NotificationService';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [history, setHistory] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    const logs = await NotificationService.getHistory();
    setHistory(logs);
    setLoading(false);
    await NotificationService.markAllAsRead();
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const handleClear = async () => {
    await NotificationService.clearHistory();
    setHistory([]);
  };

  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);
    
    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    const d = new Date(timestamp);
    return d.toLocaleDateString();
  };

  const renderItem = ({ item, index }: { item: NotificationLog, index: number }) => {
    // Expo sometimes returns date in seconds instead of milliseconds on iOS
    const timestamp = item.date < 10000000000 ? item.date * 1000 : item.date;
    const dateStr = getRelativeTime(timestamp);

    const handleNotificationTap = () => {
      if (item.type === 'limit_exceeded' || item.type === 'approaching_limit') {
        router.push('/pages/progress/progress' as any);
      } else if (item.type === 'plan_changed') {
        router.push('/pages/plan/plan' as any);
      } else if (item.type === 'streak_at_risk' || item.type === 'morning_checkin' || item.type === 'evening_checkin') {
        router.push('/' as any);
      } else {
        Alert.alert('Static Notification', 'This is a static notification.');
      }
    };

    return (
      <Animated.View 
        entering={FadeInUp.delay(Math.min(index * 50, 400)).duration(400)}
        style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
      >
        <Pressable onPress={handleNotificationTap} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <View style={styles.itemHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.iconFrame, { backgroundColor: colors.primary + '18' }]}>
                <Ionicons name="notifications" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title || 'Notification'}</Text>
            </View>
            <Text style={[styles.itemDate, { color: colors.textMuted }]}>{dateStr}</Text>
          </View>
          {item.body && (
            <Text style={[styles.itemBody, { color: colors.text }]}>{item.body}</Text>
          )}
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0A061E' : '#F5F3FF' }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
        {history.length > 0 ? (
          <Pressable onPress={handleClear} style={styles.clearBtn}>
            <Text style={[styles.clearBtnText, { color: colors.primary }]}>Clear All</Text>
          </Pressable>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      {!loading && history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No notifications yet.</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  clearBtn: {
    padding: 8,
    marginRight: -8,
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
    gap: 12,
  },
  itemCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconFrame: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemDate: {
    fontSize: 11,
    fontWeight: '500',
  },
  itemBody: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
  },
});
