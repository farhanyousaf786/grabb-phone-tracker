import { useEffect, useState, useCallback, useRef } from 'react';
import { Alert, View, SafeAreaView, ScrollView, StyleSheet, Modal, Text, Pressable, ActivityIndicator, AppState, Platform } from 'react-native';
import { ExtensionStorage } from '@bacons/apple-targets';
import { DAILY_LIMIT_DEFAULT, TIPS, TriggerName, INTENTIONS } from '@/constants/mockData';
import { storage, GrabLog, FocusBlock } from '@/utils/storage';
import { NotificationService, NotifType } from '@/services/NotificationService';
import Animated, { FadeIn, FadeInUp, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { HomeHeader } from '@/components/home/HomeHeader';
import { HorizontalCalendar } from '@/components/home/HorizontalCalendar';
import { GrabTracker } from '@/components/home/GrabTracker';
import { StatusRow } from '@/components/home/StatusRow';
import { DailyTip } from '@/components/home/DailyTip';
import { LogList } from '@/components/home/LogList';
import { TriggerModal } from '@/components/home/TriggerModal';
import { ReviewModal } from '@/components/home/ReviewModal';
import { HonestyModal } from '@/components/home/HonestyModal';
import { DiagnosticReport } from '@/components/home/DiagnosticReport';
import { MorningCheckInModal } from '@/components/home/MorningCheckInModal';
import { NightCheckInModal } from '@/components/home/NightCheckInModal';
import { StreakTracker } from '@/components/home/StreakTracker';

import { useTheme } from '@/context/ThemeContext';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  // Basic states
  const [count, setCount] = useState(0);
  const [showTrigger, setShowTrigger] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [lastTrigger, setLastTrigger] = useState<TriggerName | null>(null);
  const [log, setLog] = useState<GrabLog[]>([]);
  const [limit, setLimit] = useState(DAILY_LIMIT_DEFAULT);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [userName, setUserName] = useState<string | null>(null);
  const [showDailyTip, setShowDailyTip] = useState(true);
  const [showHonestyAlert, setShowHonestyAlert] = useState(false);
  const [trackingWhyEnabled, setTrackingWhyEnabled] = useState(false);

  // 3-Day Silent Calibration States
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [calibrationAdopted, setCalibrationAdopted] = useState(false);
  const [calibrationElapsedDays, setCalibrationElapsedDays] = useState(1);
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [suggestedLimit, setSuggestedLimit] = useState(40);
  const [customAdoptLimit, setCustomAdoptLimit] = useState(40);
  const [allTimeGrabs, setAllTimeGrabs] = useState<GrabLog[]>([]);
  const [topTrigger, setTopTrigger] = useState('Bored');
  const [peakWindow, setPeakWindow] = useState('N/A');

  // Morning Check-In States
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInLimit, setCheckInLimit] = useState(40);
  const [todayIntention, setTodayIntention] = useState<typeof INTENTIONS[0] | null>(null);
  const [yesterdayStats, setYesterdayStats] = useState<{
    count: number;
    limit: number;
    topTrigger: string | null;
    success: boolean;
  } | null>(null);

  // Night Check-In States
  const [showNightCheckInModal, setShowNightCheckInModal] = useState(false);
  const [todayStatsForNight, setTodayStatsForNight] = useState<{
    count: number;
    limit: number;
    topTrigger: string | null;
    success: boolean;
  } | null>(null);
  const [dailyStatsMap, setDailyStatsMap] = useState<Record<string, { count: number; limit: number }>>({});

  // Streak tracker states
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [streakDots, setStreakDots] = useState<{ date: string; label: string; status: 'success' | 'fail' | 'empty' }[]>([]);

  // Focus blocks
  const [focusBlocks, setFocusBlocks] = useState<FocusBlock[]>([]);

  const daysInMonth = Array.from({ length: 13 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (10 - i)); // Show 10 days before today and 2 days after today
    const dateStr = d.toISOString().split('T')[0];
    return {
      dayNum: d.getDate(),
      dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
      isToday: d.toDateString() === new Date().toDateString(),
      fullDate: dateStr,
    };
  });

  useFocusEffect(
    useCallback(() => {
      loadData(selectedDate);
      storage.getTrackingWhyEnabled().then(setTrackingWhyEnabled);
      storage.consumeCheckInPreview().then((preview) => {
        if (preview === 'morning') {
          prepareMorningCheckIn(true);
        } else if (preview === 'evening') {
          prepareNightCheckIn(true);
        }
      });
    }, [selectedDate])
  );

  async function handleAddPress() {
    const whyEnabled = await storage.getTrackingWhyEnabled();
    if (whyEnabled) {
      setShowTrigger(true);
    } else {
      await logGrab('Habit');
    }
  }

  async function prepareMorningCheckIn(force = false) {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastCheckIn = await storage.getLastCheckInDate();
    const morningHour = await storage.getMorningCheckInHour();
    const currentHour = new Date().getHours();

    if (!force && (lastCheckIn === todayStr || currentHour < morningHour)) return;

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const stats = await storage.getDailyStats(yesterday);
    const dailyLimit = await storage.getDailyLimit();

    if (stats.grabs && stats.grabs.length > 0) {
      const allGrabs = await storage.getAllGrabs();
      const config = await storage.getPlanConfig();
      const dates = allGrabs.map(g => g.date).sort();
      let yesterdayLimit = 40;
      if (dates.length > 0) {
        const firstDate = dates[0];
        const firstD = new Date(firstDate);
        const yesterdayD = new Date(yesterday);
        const diffTime = yesterdayD.getTime() - firstD.getTime();
        const elapsedYesterday = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);

        if (elapsedYesterday <= 14) yesterdayLimit = config.phase1Limit;
        else if (elapsedYesterday <= 28) yesterdayLimit = config.phase2Limit;
        else if (elapsedYesterday <= 42) yesterdayLimit = config.phase3Limit;
        else yesterdayLimit = config.phase4Limit;
      }

      const triggerCounts: Record<string, number> = {};
      stats.grabs.forEach(g => {
        triggerCounts[g.trigger] = (triggerCounts[g.trigger] || 0) + 1;
      });
      let topTrigger: string | null = null;
      let maxCount = 0;
      Object.entries(triggerCounts).forEach(([trig, count]) => {
        if (count > maxCount) {
          maxCount = count;
          topTrigger = trig;
        }
      });

      setYesterdayStats({
        count: stats.count,
        limit: yesterdayLimit,
        topTrigger,
        success: stats.count <= yesterdayLimit
      });
    } else {
      setYesterdayStats(null);
    }

    setCheckInLimit(dailyLimit);
    setShowCheckInModal(true);
  }

  async function prepareNightCheckIn(force = false) {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastNightCheckIn = await storage.getLastNightCheckInDate();
    const currentHour = new Date().getHours();
    const eveningHour = await storage.getEveningCheckInHour();

    if (!force && (lastNightCheckIn === todayStr || currentHour < eveningHour)) return;

    const allGrabs = await storage.getAllGrabs();
    const dailyLimit = await storage.getDailyLimit();
    const grabsToday = allGrabs.filter(g => g.date === todayStr);
    const countToday = grabsToday.length;
    const triggerCounts: Record<string, number> = {};
    grabsToday.forEach(g => { triggerCounts[g.trigger] = (triggerCounts[g.trigger] || 0) + 1; });
    let topTriggerToday: string | null = null;
    let maxCount = 0;
    Object.entries(triggerCounts).forEach(([trigger, cnt]) => {
      if (cnt > maxCount) { maxCount = cnt; topTriggerToday = trigger; }
    });

    setTodayStatsForNight({
      count: countToday,
      limit: dailyLimit,
      topTrigger: topTriggerToday,
      success: countToday <= dailyLimit,
    });
    setShowNightCheckInModal(true);
  }

  // Load persisted intention for today on mount
  useEffect(() => {
    storage.getTodayIntention().then(key => {
      if (key) {
        const found = INTENTIONS.find(i => i.key === key);
        if (found) setTodayIntention(found);
      }
    });
  }, []);

  useEffect(() => {
    async function performMorningCheck() {
      try {
        await prepareMorningCheckIn();
      } catch (error) {
        console.error('Error during morning check-in verification:', error);
      }
    }

    performMorningCheck();
  }, []);

  async function handleCheckIn(intentionKey: string) {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await storage.setLastCheckInDate(todayStr);
      await storage.setTodayIntention(intentionKey);
      const found = INTENTIONS.find(i => i.key === intentionKey);
      if (found) setTodayIntention(found);
      setShowCheckInModal(false);
    } catch (error) {
      console.error('Error during check-in:', error);
    }
  }

  // Evening check-in
  useEffect(() => {
    async function performEveningCheck() {
      try {
        await prepareNightCheckIn();
      } catch (error) {
        console.error('Error during evening check-in verification:', error);
      }
    }

    performEveningCheck();
  }, []);

  async function handleNightCheckIn(window: string | null) {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await storage.setLastNightCheckInDate(todayStr);
      await storage.setPhoneFreeWindow(window);
      setShowNightCheckInModal(false);
    } catch (error) {
      console.error('Error during night check-in:', error);
    }
  }

  // Widget → App sync: when app comes to foreground, read widget count and sync to AsyncStorage
  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const widgetStore = new ExtensionStorage('group.com.ibneyousaf.habittracker.widget');

    const handleAppStateChange = async (nextState: string) => {
      if (nextState === 'active') {
        try {
          const today = new Date().toISOString().split('T')[0];
          const widgetCountStr = widgetStore.get(`grab_count_${today}`);
          const widgetCount = widgetCountStr ? parseInt(widgetCountStr, 10) : 0;

          const stats = await storage.getDailyStats(today);
          const appCount = stats.count;

          if (widgetCount > appCount) {
            const diff = widgetCount - appCount;
            for (let i = 0; i < diff; i++) {
              await storage.addGrab('Widget', today);
            }
            loadData(today);
          } else if (widgetCount < appCount) {
            const diff = appCount - widgetCount;
            const todayGrabs = stats.grabs.slice(-diff);
            for (const grab of todayGrabs) {
              await storage.removeGrab(grab.id);
            }
            loadData(today);
          }
        } catch (e) {
          console.log('Widget sync error:', e);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  async function loadData(date: string) {
    try {
      const stats = await storage.getDailyStats(date);
      const dailyLimit = await storage.getDailyLimit();
      const name = await storage.getUserName();
      const lastDismissed = await storage.getTipDismissedTimestamp();

      const SIX_HOURS = 6 * 60 * 60 * 1000;
      const shouldShowTip = Date.now() - lastDismissed > SIX_HOURS;

      setLog(stats.grabs);
      setCount(stats.count);
      setLimit(dailyLimit);
      const notificationPrefs = await storage.getNotificationPreferences();
      if (notificationPrefs.goalReminders) {
        await NotificationService.scheduleGoalReminder(dailyLimit);
      } else {
        await NotificationService.cancel(NotifType.GOAL_REMINDER);
      }
      setUserName(name);
      setShowDailyTip(shouldShowTip);

      // --- SILENT CALIBRATION ONBOARDING ENGINE ---
      const allGrabs = await storage.getAllGrabs();
      setAllTimeGrabs(allGrabs);

      const calAdopted = await storage.getCalibrationAdopted();
      setCalibrationAdopted(calAdopted);

      const dates = allGrabs.map(g => g.date).sort();
      let elapsed = 1;
      if (dates.length > 0) {
        const firstD = new Date(dates[0]);
        const lastD = new Date(dates[dates.length - 1]);
        const diffTime = Math.abs(lastD.getTime() - firstD.getTime());
        elapsed = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
      }

      setCalibrationElapsedDays(elapsed);

      // Calculate count and limit for all dates in horizontal calendar and logs
      const config = await storage.getPlanConfig();
      const firstDate = dates.length > 0 ? dates[0] : new Date().toISOString().split('T')[0];
      const firstD = new Date(firstDate);

      const statsMap: Record<string, { count: number; limit: number }> = {};
      const grabsByDate: Record<string, number> = {};
      allGrabs.forEach(g => {
        grabsByDate[g.date] = (grabsByDate[g.date] || 0) + 1;
      });

      const allUniqueDates = new Set<string>([
        ...Object.keys(grabsByDate),
        new Date().toISOString().split('T')[0]
      ]);
      daysInMonth.forEach(d => allUniqueDates.add(d.fullDate));

      allUniqueDates.forEach(dateStr => {
        const d = new Date(dateStr);
        const diffTime = d.getTime() - firstD.getTime();
        const elapsedDays = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);
        
        let dayLimit = 40;
        if (elapsedDays <= 14) dayLimit = config.phase1Limit;
        else if (elapsedDays <= 28) dayLimit = config.phase2Limit;
        else if (elapsedDays <= 42) dayLimit = config.phase3Limit;
        else dayLimit = config.phase4Limit;

        statsMap[dateStr] = {
          count: grabsByDate[dateStr] || 0,
          limit: dayLimit
        };
      });

      setDailyStatsMap(statsMap);

      // ---- STREAK TRACKER ----
      // Calculate streak: consecutive days under limit, going backwards from today
      let streakVal = 0;
      let bestStreakVal = 0;
      let tempStreak = 0;
      const todayStr = new Date().toISOString().split('T')[0];
      const sortedDates = Array.from(allUniqueDates).sort();
      const grouped: Record<string, number> = {};
      allGrabs.forEach((g) => { grouped[g.date] = (grouped[g.date] || 0) + 1; });

      // Best streak (all-time)
      sortedDates.forEach((dateStr) => {
        const dayCount = grouped[dateStr] || 0;
        const dayLimit = statsMap[dateStr]?.limit || 40;
        if (dayCount <= dayLimit && dayCount > 0) {
          tempStreak++;
          bestStreakVal = Math.max(bestStreakVal, tempStreak);
        } else {
          tempStreak = 0;
        }
      });

      // Current streak (going backwards from today)
      const checkDate = new Date();
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const dayCount = grouped[dateStr] || 0;
        const dayLimit = statsMap[dateStr]?.limit || 40;
        // If no grabs today yet, skip counting today (don't break streak)
        if (dateStr === todayStr && dayCount === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        if (dayCount > 0 && dayCount <= dayLimit) {
          streakVal++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      // Build last 7 day dots for visual continuity
      const dots: { date: string; label: string; status: 'success' | 'fail' | 'empty' }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayCount = grouped[dateStr] || 0;
        const dayLimit = statsMap[dateStr]?.limit || 40;
        const label = i === 0 ? 'T' : i === 1 ? 'Y' : ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()];
        let status: 'success' | 'fail' | 'empty' = 'empty';
        if (dayCount > 0) {
          status = dayCount <= dayLimit ? 'success' : 'fail';
        }
        dots.push({ date: dateStr, label, status });
      }

      setCurrentStreak(streakVal);
      setBestStreak(bestStreakVal);
      setStreakDots(dots);
      if (notificationPrefs.streakReminders && streakVal > 0) {
        await NotificationService.scheduleStreakAtRisk(streakVal);
      } else {
        await NotificationService.cancel(NotifType.STREAK_AT_RISK);
      }

      // Load focus blocks for today
      const blocks = await storage.getFocusBlocks();
      setFocusBlocks(blocks);

      // Determine active calibration status (under 3 days, and not yet accepted recommendation)
      const activeCal = elapsed < 3 && !calAdopted;
      setIsCalibrating(activeCal);

      // Calculate baseline and suggested taper limits
      const baselineAvg = elapsed > 0 ? Math.round(allGrabs.length / elapsed) : 0;
      const recLimit = Math.max(10, Math.round(baselineAvg * 0.85)); // gentle 15% taper suggestion
      setSuggestedLimit(recLimit);

      // Compute Top Trigger
      const triggerCounts: Record<string, number> = {};
      allGrabs.forEach(g => {
        triggerCounts[g.trigger] = (triggerCounts[g.trigger] || 0) + 1;
      });
      const topT = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Habit';
      setTopTrigger(topT);

      // Compute Peak Usage Window
      const hourCounts = Array(12).fill(0);
      allGrabs.forEach(g => {
        const hour = new Date(g.timestamp).getHours();
        const windowIdx = Math.floor(hour / 2);
        hourCounts[windowIdx]++;
      });
      let maxPeak = 0;
      let peakIdx = 0;
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
      const peakW = maxPeak > 0 ? `${formatHour(startHour)}–${formatHour(startHour + 2)}` : 'N/A';
      setPeakWindow(peakW);

      // Only auto spawn onboarding diagnostic modal on today's view if Day 3+ completes and calibration goal isn't finalized
      if (date === todayStr && elapsed >= 3 && !calAdopted) {
        setCustomAdoptLimit(recLimit);
        setShowCalibrationModal(true);
      }
    } catch (error) {
      console.error('Error loading home data:', error);
    }
  }

  async function handleDismissTip() {
    setShowDailyTip(false);
    await storage.setTipDismissedTimestamp();
  }

  const pct = Math.min((count / limit) * 100, 100);
  const over = count > limit;
  const statusColor = over ? colors.danger : pct > 75 ? colors.warning : colors.onTrack;
  const statusLabel = over ? 'Over limit' : pct > 75 ? 'Getting close' : 'On track';

  async function logGrab(trigger: TriggerName) {
    try {
      const grab = await storage.addGrab(trigger, selectedDate);
      const previousCount = count;
      const nextCount = previousCount + 1;
      setCount(nextCount);
      setLog((history) => [grab, ...history]);
      setLastTrigger(trigger);
      setShowTrigger(false);
      if (selectedDate === new Date().toISOString().split('T')[0]) {
        const notificationPrefs = await storage.getNotificationPreferences();
        if (notificationPrefs.limitAlerts) {
          const previousPct = previousCount / limit;
          const nextPct = nextCount / limit;
          if (nextCount > limit && previousCount <= limit) {
            await NotificationService.scheduleLimitExceeded(nextCount, limit);
          } else if (nextPct >= 0.75 && previousPct < 0.75 && nextCount <= limit) {
            await NotificationService.scheduleApproachingLimit(nextCount, limit);
          }
        }
      }

      // Re-trigger load to check baseline transitions dynamically
      loadData(selectedDate);
    } catch (error) {
      console.error('Error logging grab:', error);
    }
  }

  async function removeLastGrab() {
    if (log.length > 0) {
      try {
        const lastGrab = log[0];
        await storage.removeGrab(lastGrab.id);
        setCount((value) => Math.max(0, value - 1));
        setLog((history) => history.slice(1));
        loadData(selectedDate);
      } catch (error) {
        console.error('Error removing grab:', error);
      }
    }
  }

  async function adoptCalibrationProtocol(chosenLimit: number) {
    try {
      await storage.setDailyLimit(chosenLimit);

      // Configure default tapering strategy based on adopted starting limit
      const config = await storage.getPlanConfig();
      config.planType = 'custom';
      config.phase1Limit = chosenLimit;
      config.phase2Limit = Math.max(8, Math.round(chosenLimit * 0.85));
      config.phase3Limit = Math.max(6, Math.round(chosenLimit * 0.70));
      config.phase4Limit = Math.max(4, Math.round(chosenLimit * 0.50));
      await storage.setPlanConfig(config);

      await storage.setCalibrationAdopted(true);
      setCalibrationAdopted(true);
      setIsCalibrating(false);
      setShowCalibrationModal(false);
      setLimit(chosenLimit);

      // Force refresh data
      loadData(selectedDate);

      // Route directly to the Plan screen so the user can easily select/tweak their protocol!
      router.push('/pages/plan/plan');
    } catch (error) {
      console.error('Error adopting calibration protocol:', error);
    }
  }

  const getDailyTipIndex = (date: string) => {
    let hash = 0;
    for (let i = 0; i < date.length; i++) {
      hash = (hash << 5) - hash + date.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % TIPS.length;
  };

  const dailyTip = TIPS[getDailyTipIndex(new Date().toISOString().split('T')[0])];

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#0A061E' : '#F5F3FF' }}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          <Animated.View entering={FadeInUp.delay(100).duration(600)}>
            <HomeHeader greeting="Good Morning" userName={userName || undefined} />
          </Animated.View>

          {showDailyTip && (
            <Animated.View entering={FadeInUp.delay(200).duration(600)}>
              <DailyTip tip={dailyTip} onDismiss={handleDismissTip} />
            </Animated.View>
          )}

          <Animated.View entering={FadeInUp.delay(300).duration(600)}>
            <HorizontalCalendar
              days={daysInMonth}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              dailyStats={dailyStatsMap}
            />
          </Animated.View>

          {/* GrabTracker overrides dynamically with isCalibrating state */}
          <Animated.View entering={FadeInUp.delay(400).duration(600)}>
            <GrabTracker
              count={count}
              limit={limit}
              statusColor={statusColor}
              isCalibrating={isCalibrating}
              calibrationDay={calibrationElapsedDays}
              onAdd={handleAddPress}
              onRemove={removeLastGrab}
            />
          </Animated.View>

          {/* StatusRow overrides dynamically with isCalibrating state */}
          <Animated.View entering={FadeInUp.delay(500).duration(600)}>
            <StatusRow
              statusColor={statusColor}
              statusLabel={statusLabel}
              count={count}
              limit={limit}
              over={over}
              lastTrigger={lastTrigger}
              isCalibrating={isCalibrating}
              calibrationDay={calibrationElapsedDays}
            />
          </Animated.View>

          {/* Streak Tracker */}
          <StreakTracker
            streak={currentStreak}
            bestStreak={bestStreak}
            dayDots={streakDots}
          />

          {/* Today's Focus Blocks */}
          {focusBlocks.length > 0 && (
            <Animated.View entering={FadeInUp.delay(520).duration(600)} style={[styles.focusBlocksCard, { backgroundColor: colors.surface, borderColor: '#8B5CF6' + '22' }]}>
              <View style={styles.focusBlocksHeader}>
                <Ionicons name="time-sharp" size={16} color="#8B5CF6" />
                <Text style={[styles.focusBlocksTitle, { color: colors.text }]}>Today's Focus Blocks</Text>
                <Pressable onPress={() => router.push('/pages/plan/plan')} style={{ marginLeft: 'auto' }}>
                  <Text style={[styles.focusBlocksEdit, { color: colors.primary }]}>Edit</Text>
                </Pressable>
              </View>
              {focusBlocks.map((block) => {
                const now = new Date();
                const currentHour = now.getHours();
                const todayDay = now.getDay();
                const isToday = block.daysOfWeek.includes(todayDay);
                const isActive = isToday && currentHour >= block.startHour && currentHour < block.endHour;
                const formatHour = (h: number) => {
                  if (h === 0) return '12am';
                  if (h === 12) return '12pm';
                  return h > 12 ? `${h - 12}pm` : `${h}am`;
                };
                return (
                  <View key={block.id} style={[styles.focusBlockRow, { borderBottomColor: colors.border }]}>
                    <View style={[styles.focusBlockDot, { backgroundColor: isActive ? '#34D399' : isToday ? '#FFAA33' : colors.border }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.focusBlockLabel, { color: colors.text }]}>{block.label}</Text>
                      <Text style={[styles.focusBlockTime, { color: colors.textMuted }]}>
                        {formatHour(block.startHour)} – {formatHour(block.endHour)}
                        {!isToday && ' · Not today'}
                        {isToday && isActive && ' · Active now'}
                      </Text>
                    </View>
                    {isActive && (
                      <View style={[styles.focusBlockBadge, { backgroundColor: '#34D399' + '18' }]}>
                        <Text style={[styles.focusBlockBadgeText, { color: '#34D399' }]}>Active</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </Animated.View>
          )}

          {/* Silent Calibration onboarding tip banner */}
          {isCalibrating && (
            <Animated.View entering={FadeInUp.delay(550).duration(600)} style={[styles.calibrationTipCard, { backgroundColor: colors.surface, borderColor: '#8B5CF6' + '40' }]}>
              <Ionicons name="sparkles-sharp" size={16} color="#8B5CF6" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.calTipTitle, { color: colors.text }]}>Silent Calibration Active</Text>
                <Text style={[styles.calTipBody, { color: colors.textMuted }]}>
                  Keep logging your screen pickups normally. We are observing your digital routines quietly. Your tapering goal unlocks on Day 3!
                </Text>
                <Pressable
                  onPress={() => router.push('/pages/plan/plan')}
                  style={({ pressed }) => [
                    styles.calTipLink,
                    { opacity: pressed ? 0.7 : 1 }
                  ]}
                >
                  <Text style={[styles.calTipLinkText, { color: colors.primary }]}>
                    Want to customize today instead?
                  </Text>
                  <Ionicons name="arrow-forward-sharp" size={12} color={colors.primary} />
                </Pressable>
              </View>
            </Animated.View>
          )}

          <Animated.View entering={FadeInUp.delay(600).duration(600)}>
            {/* Persistent Intention Chip */}
            {todayIntention && selectedDate === new Date().toISOString().split('T')[0] && (
              <Animated.View entering={FadeIn.duration(400)} style={[styles.intentionChip, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
                <Ionicons name={todayIntention.icon as any} size={20} color={colors.primary} style={styles.intentionChipIcon} />
                <View style={styles.intentionChipTexts}>
                  <Text style={[styles.intentionChipLabel, { color: colors.textMuted }]}>TODAY'S FOCUS</Text>
                  <Text style={[styles.intentionChipText, { color: colors.text }]}>{todayIntention.label}</Text>
                </View>
              </Animated.View>
            )}
            <LogList
              logs={log}
              limit={limit}
              selectedDate={selectedDate}
              todayIntentionTrigger={selectedDate === new Date().toISOString().split('T')[0] ? todayIntention?.triggerMatch : undefined}
              title={selectedDate === new Date().toISOString().split('T')[0] ? "Today's log" : `Log for ${new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            />
          </Animated.View>
        </ScrollView>

        <TriggerModal
          visible={showTrigger}
          onSelect={logGrab}
          onClose={() => setShowTrigger(false)}
        />

        <ReviewModal
          visible={showReview}
          onClose={() => setShowReview(false)}
        />

        <HonestyModal
          visible={showHonestyAlert}
          onClose={() => setShowHonestyAlert(false)}
        />

        <MorningCheckInModal
          visible={showCheckInModal}
          onClose={handleCheckIn}
          dailyLimit={checkInLimit}
          yesterdayStats={yesterdayStats}
        />

        <NightCheckInModal
          visible={showNightCheckInModal}
          onClose={handleNightCheckIn}
          todayStats={todayStatsForNight}
        />

        {/* NEURO-DIAGNOSTIC CALIBRATION RESULT OVERLAY MODAL */}
        <Modal
          visible={showCalibrationModal}
          transparent
          animationType="none"
        >
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={[
              styles.modalOverlay,
              { backgroundColor: isDark ? 'rgba(8, 5, 24, 0.88)' : 'rgba(240, 237, 232, 0.88)' }
            ]}
          >
            <Animated.View
              entering={ZoomIn.duration(240)}
              exiting={ZoomOut.duration(180)}
              style={[
                styles.diagnosticCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  maxHeight: '85%', // Prevent overflow on smaller screens
                }
              ]}
            >
              {/* Reusable premium Diagnostic Report Component */}
              <DiagnosticReport
                allGrabs={allTimeGrabs}
                elapsedDays={calibrationElapsedDays}
                suggestedLimit={suggestedLimit}
                customAdoptLimit={customAdoptLimit}
                setCustomAdoptLimit={setCustomAdoptLimit}
                onAdopt={adoptCalibrationProtocol}
                onClose={() => setShowCalibrationModal(false)}
                isDailyStatsMode={false}
              />
            </Animated.View>
          </Animated.View>
        </Modal>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 120 },

  // Calibration silent onboarding tip card
  calibrationTipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.01,
    shadowRadius: 8,
  },
  calTipTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    marginBottom: 2,
  },
  calTipBody: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
  calTipLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  calTipLinkText: {
    fontSize: 11,
    fontWeight: '900',
  },

  // Modal Diagnostic screen styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  diagnosticCard: {
    width: '100%',
    height: '75%',
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconOuterCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  diagnosticTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  diagnosticSub: {
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
  },

  // Grid stats
  diagnosticGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  gridCell: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellVal: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  cellLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },

  // Recommendations panel
  recommendationPanel: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  recTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  recText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },

  // Adjuster
  adjusterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  adjustBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBox: {
    alignItems: 'center',
    minWidth: 70,
  },
  adjustNum: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  adjustLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    marginTop: -2,
  },

  // Primary buttons
  modalActions: {
    width: '100%',
  },
  primaryAdoptBtn: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryAdoptText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  intentionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  intentionChipIcon: {
    marginRight: 2,
  },
  intentionChipTexts: {
    flex: 1,
  },
  intentionChipLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },
  intentionChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    lineHeight: 16,
  },

  // Focus blocks
  focusBlocksCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  focusBlocksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  focusBlocksTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  focusBlocksEdit: {
    fontSize: 12,
    fontWeight: '800',
  },
  focusBlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  focusBlockDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  focusBlockLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  focusBlockTime: {
    fontSize: 12,
    fontWeight: '600',
  },
  focusBlockBadge: {
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  focusBlockBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
