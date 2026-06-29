import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { NotificationService } from '@/services/NotificationService';
import * as Notifications from 'expo-notifications';

interface HomeHeaderProps {
  userName?: string;
  greeting: string;
  showMotivationsBtn?: boolean;
  onShowMotivations?: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ greeting, userName, showMotivationsBtn, onShowMotivations }) => {
  const { colors } = useTheme();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      NotificationService.getUnreadCount().then(setUnreadCount);
    }, [])
  );

  React.useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(() => {
      setUnreadCount(prev => prev + 1);
    });
    return () => sub.remove();
  }, []);

  return (
    <View style={styles.header}>
      <View>
        <Text style={[styles.greetingText, { color: colors.text }]}>{greeting}</Text>
        {userName && <Text style={[styles.userName, { color: colors.textMuted }]}>{userName}</Text>}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {showMotivationsBtn && (
          <Pressable onPress={onShowMotivations}>
            <Text style={[styles.motivationsText, { color: colors.primary }]}>Motivations</Text>
          </Pressable>
        )}
        <Pressable 
          onPress={() => router.push('/pages/notifications/notifications')}
          style={[styles.notifButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.primary} />
          {unreadCount > 0 && (
            <View style={[styles.badge, { borderColor: colors.background }]}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greetingText: { fontSize: 14, fontWeight: '800', letterSpacing: -0.5 },
  userName: { fontSize: 18, fontWeight: '700', marginTop: 1 },
  motivationsText: { fontSize: 14, fontWeight: '800' },
  notifButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' }
});
