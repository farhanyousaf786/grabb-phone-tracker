import { useCallback, useState } from 'react';
import { Alert, Linking, SafeAreaView, ScrollView, StyleSheet, Text, View, Switch, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { storage, NotificationPreferences } from '@/utils/storage';
import { NotificationService, NotifType } from '@/services/NotificationService';
import { MorningCheckInModal } from '@/components/home/MorningCheckInModal';
import { NightCheckInModal } from '@/components/home/NightCheckInModal';

export default function SettingsScreen() {
  const { toggleTheme, isDark, colors } = useTheme();
  const router = useRouter();
  const privacyPolicyUrl = 'https://sites.google.com/view/phone-grab-tracker-pro/home';
  const termsOfUseUrl = 'https://sites.google.com/view/phone-grab-tracker-pro-terms/home';
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
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showNightCheckInModal, setShowNightCheckInModal] = useState(false);

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

  function previewCheckIn(type: 'morning' | 'evening') {
    if (type === 'morning') {
      setShowCheckInModal(true);
    } else {
      setShowNightCheckInModal(true);
    }
  }

  async function openLink(url: string) {
    try {
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Error', 'Could not open the link.');
    }
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
                <View style={styles.textContainer}><Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text></View>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#F0EDE8', true: '#1A1A18' }}
                thumbColor={isDark ? '#5FDDaa' : '#FFFFFF'}
               style={{ transform: [{ scale: 0.85 }] }} />
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: '#8B5CF6' + '22' }]}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Subscription</Text>
            <Pressable onPress={() => router.push('/pages/paywall/paywall' as any)} style={styles.settingRow}>
              <View style={styles.settingLabelWrap}>
                <View style={[styles.iconWrap, { backgroundColor: colors.primary + '14' }]}>
                  <Ionicons name="card" size={20} color={colors.primary} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Manage Subscription</Text>
                  <Text style={[styles.settingDescription, { color: colors.textMuted }]}>View plans, subscribe, or restore purchases</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: '#8B5CF6' + '22' }]}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Notifications</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingLabelWrap}>
                <View style={[styles.iconWrap, { backgroundColor: colors.primary + '14' }]}>
                  <Ionicons name="warning" size={20} color={colors.primary} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Limit Alerts</Text>
                  <Text style={[styles.settingDescription, { color: colors.textMuted }]}>Approaching and exceeded goal alerts</Text>
                </View>
              </View>
              <Switch
                value={notificationPrefs.limitAlerts}
                onValueChange={(value) => toggleNotificationPreference('limitAlerts', value)}
                style={{ transform: [{ scale: 0.85 }] }}
                trackColor={{ false: '#F0EDE8', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.settingRow, styles.settingRowStacked]}>
              <View style={styles.settingLabelWrap}>
                <View style={[styles.iconWrap, { backgroundColor: colors.primary + '14' }]}>
                  <Ionicons name="flame" size={20} color={colors.primary} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Streak Reminders</Text>
                  <Text style={[styles.settingDescription, { color: colors.textMuted }]}>Daily streak-at-risk reminders</Text>
                </View>
              </View>
              <Switch
                value={notificationPrefs.streakReminders}
                onValueChange={(value) => toggleNotificationPreference('streakReminders', value)}
                style={{ transform: [{ scale: 0.85 }] }}
                trackColor={{ false: '#F0EDE8', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.settingRow, styles.settingRowStacked]}>
              <View style={styles.settingLabelWrap}>
                <View style={[styles.iconWrap, { backgroundColor: colors.primary + '14' }]}>
                  <Ionicons name="notifications" size={20} color={colors.primary} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Goal Reminders</Text>
                  <Text style={[styles.settingDescription, { color: colors.textMuted }]}>6-hour daily goal and quote reminders</Text>
                </View>
              </View>
              <Switch
                value={notificationPrefs.goalReminders}
                onValueChange={(value) => toggleNotificationPreference('goalReminders', value)}
                style={{ transform: [{ scale: 0.85 }] }}
                trackColor={{ false: '#F0EDE8', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.settingRow, styles.settingRowStacked]}>
              <View style={styles.settingLabelWrap}>
                <View style={[styles.iconWrap, { backgroundColor: colors.primary + '14' }]}>
                  <Ionicons name="sunny" size={20} color={colors.primary} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Morning Check-In</Text>
                  <Text style={[styles.settingDescription, { color: colors.textMuted }]}>Daily reminder at {formatHour(morningHour)}</Text>
                </View>
              </View>
              <Switch
                value={notificationPrefs.morningCheckInReminders}
                onValueChange={(value) => toggleNotificationPreference('morningCheckInReminders', value)}
                style={{ transform: [{ scale: 0.85 }] }}
                trackColor={{ false: '#F0EDE8', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.settingRow, styles.settingRowStacked]}>
              <View style={styles.settingLabelWrap}>
                <View style={[styles.iconWrap, { backgroundColor: colors.primary + '14' }]}>
                  <Ionicons name="moon" size={20} color={colors.primary} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Evening Reflection</Text>
                  <Text style={[styles.settingDescription, { color: colors.textMuted }]}>Daily reminder at {formatHour(eveningHour)}</Text>
                </View>
              </View>
              <Switch
                value={notificationPrefs.eveningCheckInReminders}
                onValueChange={(value) => toggleNotificationPreference('eveningCheckInReminders', value)}
                style={{ transform: [{ scale: 0.85 }] }}
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
                <View style={styles.textContainer}>
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
                <View style={styles.textContainer}>
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
                <View style={styles.textContainer}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Track the Why</Text>
                  <Text style={[styles.settingDescription, { color: colors.textMuted }]}>Ask why after each pickup</Text>
                </View>
              </View>
              <Switch
                value={trackingWhyEnabled}
                onValueChange={toggleTrackingWhy}
                trackColor={{ false: '#F0EDE8', true: colors.primary }}
                thumbColor="#FFFFFF"
               style={{ transform: [{ scale: 0.85 }] }} />
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: '#8B5CF6' + '22' }]}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Legal</Text>
            <Pressable onPress={() => openLink(privacyPolicyUrl)} style={styles.settingRow}>
              <View style={styles.settingLabelWrap}>
                <View style={[styles.iconWrap, { backgroundColor: colors.primary + '14' }]}>
                  <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Privacy Policy</Text>
                  <Text style={[styles.settingDescription, { color: colors.textMuted }]}>How your data is handled</Text>
                </View>
              </View>
              <Ionicons name="open-outline" size={20} color={colors.textMuted} />
            </Pressable>

            <Pressable onPress={() => openLink(termsOfUseUrl)} style={[styles.settingRow, styles.settingRowStacked]}>
              <View style={styles.settingLabelWrap}>
                <View style={[styles.iconWrap, { backgroundColor: colors.primary + '14' }]}>
                  <Ionicons name="document-text" size={20} color={colors.primary} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Terms of Use</Text>
                  <Text style={[styles.settingDescription, { color: colors.textMuted }]}>Subscription and app terms</Text>
                </View>
              </View>
              <Ionicons name="open-outline" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.versionText, { color: colors.textMuted }]}>Habit Tracker v1.0.0</Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {showCheckInModal && (
        <MorningCheckInModal
          visible={showCheckInModal}
          onClose={() => setShowCheckInModal(false)}
          dailyLimit={morningHour}
          yesterdayStats={{
            count: 32,
            limit: 40,
            topTrigger: 'Boredom',
            success: true,
          }}
        />
      )}

      {showNightCheckInModal && (
        <NightCheckInModal
          visible={showNightCheckInModal}
          onClose={() => setShowNightCheckInModal(false)}
          todayStats={{
            count: 38,
            limit: 40,
            topTrigger: 'Social',
            success: true,
          }}
        />
      )}
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
  settingRowStacked: { marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  textContainer: { flex: 1, paddingRight: 8 },
  iconWrap: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 14, fontWeight: '600' },
  settingDescription: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  footer: { marginTop: 'auto', paddingVertical: 32, alignItems: 'center' },
  versionText: { fontSize: 12, fontWeight: '500' },
  hourAdjuster: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hourBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  hourValue: { fontSize: 14, fontWeight: '800', minWidth: 44, textAlign: 'center' },
  previewRow: { flexDirection: 'row', gap: 10 },
  previewBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 14, paddingVertical: 12 },
  previewBtnText: { fontSize: 12, fontWeight: '800' },
});
