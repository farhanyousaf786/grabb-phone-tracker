import { useCallback, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Switch, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { storage, NotificationPreferences } from '@/utils/storage';
import { NotificationService, NotifType } from '@/services/NotificationService';

export default function SettingsScreen() {
  const { toggleTheme, isDark, colors } = useTheme();
  const router = useRouter();
  const [trackingWhyEnabled, setTrackingWhyEnabled] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    limitAlerts: true,
    streakReminders: true,
    goalReminders: true,
    morningCheckInReminders: true,
    eveningCheckInReminders: true,
  });
  const [morningHour, setMorningHour] = useState(8);
  const [eveningHour, setEveningHour] = useState(18);

  useFocusEffect(
    useCallback(() => {
      storage.getTrackingWhyEnabled().then(setTrackingWhyEnabled);
      storage.getNotificationPreferences().then(setNotificationPrefs);
      storage.getMorningCheckInHour().then(setMorningHour);
      storage.getEveningCheckInHour().then(setEveningHour);
    }, [])
  );

  async function toggleTrackingWhy(value: boolean) {
    setTrackingWhyEnabled(value);
    await storage.setTrackingWhyEnabled(value);
  }

  async function toggleNotificationPreference(key: keyof NotificationPreferences, value: boolean) {
    const updated = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(updated);
    await storage.setNotificationPreferences(updated);

    if (key === 'morningCheckInReminders') {
      if (value) await NotificationService.scheduleMorningCheckin(morningHour, 0);
      else await NotificationService.cancel(NotifType.MORNING_CHECKIN);
    }

    if (key === 'eveningCheckInReminders') {
      if (value) await NotificationService.scheduleEveningCheckin(eveningHour, 0);
      else await NotificationService.cancel(NotifType.EVENING_CHECKIN);
    }
  }

  async function adjustMorningHour(delta: number) {
    const next = Math.max(4, Math.min(12, morningHour + delta));
    setMorningHour(next);
    await storage.setMorningCheckInHour(next);
    if (notificationPrefs.morningCheckInReminders) {
      await NotificationService.scheduleMorningCheckin(next, 0);
    }
  }

  async function adjustEveningHour(delta: number) {
    const next = Math.max(12, Math.min(23, eveningHour + delta));
    setEveningHour(next);
    await storage.setEveningCheckInHour(next);
    if (notificationPrefs.eveningCheckInReminders) {
      await NotificationService.scheduleEveningCheckin(next, 0);
    }
  }

  function formatHour(h: number) {
    if (h === 0) return '12am';
    if (h === 12) return '12pm';
    return h > 12 ? `${h - 12}pm` : `${h}am`;
  }

  async function previewCheckIn(type: 'morning' | 'evening') {
    await storage.setCheckInPreview(type);
    router.push('/pages/home/home');
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0A061E' : '#F5F3FF' }]}>
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0A061E' : '#F5F3FF' }]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Customize your habit tracking experience.</Text>
        </View>

          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: '#8B5CF6' + '22' }]}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Appearance</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingLabelWrap}>
                <View style={[styles.iconWrap, { backgroundColor: colors.primary + '14' }]}>
                  <Ionicons name={isDark ? "moon" : "sunny"} size={20} color={colors.primary} />
                </View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#F0EDE8', true: '#1A1A18' }}
                thumbColor={isDark ? '#5FDDaa' : '#FFFFFF'}
              />
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: '#8B5CF6' + '22' }]}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Notifications</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingLabelWrap}>
                <View style={[styles.iconWrap, { backgroundColor: colors.primary + '14' }]}>
                  <Ionicons name="warning" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Limit Alerts</Text>
                  <Text style={[styles.settingDescription, { color: colors.textMuted }]}>Approaching and exceeded goal alerts</Text>
                </View>
              </View>
              <Switch
                value={notificationPrefs.limitAlerts}
                onValueChange={(value) => toggleNotificationPreference('limitAlerts', value)}
                trackColor={{ false: '#F0EDE8', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.settingRow, styles.settingRowStacked]}>
              <View style={styles.settingLabelWrap}>
                <View style={[styles.iconWrap, { backgroundColor: colors.primary + '14' }]}>
                  <Ionicons name="flame" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Streak Reminders</Text>
                  <Text style={[styles.settingDescription, { color: colors.textMuted }]}>Daily streak-at-risk reminders</Text>
                </View>
              </View>
              <Switch
                value={notificationPrefs.streakReminders}
                onValueChange={(value) => toggleNotificationPreference('streakReminders', value)}
                trackColor={{ false: '#F0EDE8', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.settingRow, styles.settingRowStacked]}>
              <View style={styles.settingLabelWrap}>
                <View style={[styles.iconWrap, { backgroundColor: colors.primary + '14' }]}>
                  <Ionicons name="notifications" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Goal Reminders</Text>
                  <Text style={[styles.settingDescription, { color: colors.textMuted }]}>6-hour daily goal and quote reminders</Text>
                </View>
              </View>
              <Switch
                value={notificationPrefs.goalReminders}
                onValueChange={(value) => toggleNotificationPreference('goalReminders', value)}
                trackColor={{ false: '#F0EDE8', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.settingRow, styles.settingRowStacked]}>
              <View style={styles.settingLabelWrap}>
                <View style={[styles.iconWrap, { backgroundColor: colors.primary + '14' }]}>
                  <Ionicons name="sunny" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Morning Check-In</Text>
                  <Text style={[styles.settingDescription, { color: colors.textMuted }]}>Daily reminder at {formatHour(morningHour)}</Text>
                </View>
              </View>
              <Switch
                value={notificationPrefs.morningCheckInReminders}
                onValueChange={(value) => toggleNotificationPreference('morningCheckInReminders', value)}
                trackColor={{ false: '#F0EDE8', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.settingRow, styles.settingRowStacked]}>
              <View style={styles.settingLabelWrap}>
                <View style={[styles.iconWrap, { backgroundColor: colors.primary + '14' }]}>
                  <Ionicons name="moon" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Evening Reflection</Text>
                  <Text style={[styles.settingDescription, { color: colors.textMuted }]}>Daily reminder at {formatHour(eveningHour)}</Text>
                </View>
              </View>
              <Switch
                value={notificationPrefs.eveningCheckInReminders}
                onValueChange={(value) => toggleNotificationPreference('eveningCheckInReminders', value)}
                trackColor={{ false: '#F0EDE8', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: '#8B5CF6' + '22' }]}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Check-Ins</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingLabelWrap}>
                <View style={[styles.iconWrap, { backgroundColor: colors.primary + '14' }]}>
                  <Ionicons name="sunny" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Morning Check-In</Text>
                  <Text style={[styles.settingDescription, { color: colors.textMuted }]}>Appears at {formatHour(morningHour)}</Text>
                </View>
              </View>
              <View style={styles.hourAdjuster}>
                <Pressable onPress={() => adjustMorningHour(-1)} style={[styles.hourBtn, { backgroundColor: colors.background }]}>
                  <Ionicons name="remove" size={14} color={colors.text} />
                </Pressable>
                <Text style={[styles.hourValue, { color: colors.text }]}>{formatHour(morningHour)}</Text>
                <Pressable onPress={() => adjustMorningHour(1)} style={[styles.hourBtn, { backgroundColor: colors.background }]}>
                  <Ionicons name="add" size={14} color={colors.text} />
                </Pressable>
              </View>
            </View>

            <View style={[styles.settingRow, styles.settingRowStacked]}>
              <View style={styles.settingLabelWrap}>
                <View style={[styles.iconWrap, { backgroundColor: colors.primary + '14' }]}>
                  <Ionicons name="moon" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Evening Reflection</Text>
                  <Text style={[styles.settingDescription, { color: colors.textMuted }]}>Appears at {formatHour(eveningHour)}</Text>
                </View>
              </View>
              <View style={styles.hourAdjuster}>
                <Pressable onPress={() => adjustEveningHour(-1)} style={[styles.hourBtn, { backgroundColor: colors.background }]}>
                  <Ionicons name="remove" size={14} color={colors.text} />
                </Pressable>
                <Text style={[styles.hourValue, { color: colors.text }]}>{formatHour(eveningHour)}</Text>
                <Pressable onPress={() => adjustEveningHour(1)} style={[styles.hourBtn, { backgroundColor: colors.background }]}>
                  <Ionicons name="add" size={14} color={colors.text} />
                </Pressable>
              </View>
            </View>

            <View style={[styles.previewRow, { marginTop: 18 }]}>
              <Pressable onPress={() => previewCheckIn('morning')} style={[styles.previewBtn, { backgroundColor: colors.primary + '12' }]}>
                <Ionicons name="sunny-outline" size={14} color={colors.primary} />
                <Text style={[styles.previewBtnText, { color: colors.primary }]}>Preview Morning</Text>
              </Pressable>
              <Pressable onPress={() => previewCheckIn('evening')} style={[styles.previewBtn, { backgroundColor: colors.primary + '12' }]}>
                <Ionicons name="moon-outline" size={14} color={colors.primary} />
                <Text style={[styles.previewBtnText, { color: colors.primary }]}>Preview Evening</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: '#8B5CF6' + '22' }]}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Logging</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingLabelWrap}>
                <View style={[styles.iconWrap, { backgroundColor: colors.primary + '14' }]}>
                  <Ionicons name="help-circle" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Track the Why</Text>
                  <Text style={[styles.settingDescription, { color: colors.textMuted }]}>Ask why after each pickup</Text>
                </View>
              </View>
              <Switch
                value={trackingWhyEnabled}
                onValueChange={toggleTrackingWhy}
                trackColor={{ false: '#F0EDE8', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.versionText, { color: colors.textMuted }]}>Habit Tracker v1.0.0</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 120 },
  header: { paddingTop: 20, paddingBottom: 22 },
  title: { fontSize: 32, fontWeight: '800' },
  subtitle: { fontSize: 14, fontWeight: '600', marginTop: 6, lineHeight: 20 },
  section: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  sectionTitle: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingRowStacked: { marginTop: 18 },
  settingLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 16, fontWeight: '600' },
  settingDescription: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  footer: { marginTop: 'auto', paddingVertical: 32, alignItems: 'center' },
  versionText: { fontSize: 12, fontWeight: '500' },
  hourAdjuster: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hourBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  hourValue: { fontSize: 14, fontWeight: '800', minWidth: 44, textAlign: 'center' },
  previewRow: { flexDirection: 'row', gap: 10 },
  previewBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 14, paddingVertical: 12 },
  previewBtnText: { fontSize: 12, fontWeight: '800' },
});
