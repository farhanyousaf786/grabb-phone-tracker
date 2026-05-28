import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIF_IDS_KEY = 'habit_tracker_notif_ids';

export enum NotifType {
  APPROACHING_LIMIT = 'approaching_limit',
  LIMIT_EXCEEDED = 'limit_exceeded',
  STREAK_AT_RISK = 'streak_at_risk',
  FOCUS_BLOCK_START = 'focus_block_start',
  FOCUS_BLOCK_END = 'focus_block_end',
  MORNING_CHECKIN = 'morning_checkin',
  EVENING_CHECKIN = 'evening_checkin',
  PLAN_CHANGED = 'plan_changed',
  GOAL_REMINDER = 'goal_reminder',
}

interface PendingIdMap {
  [type: string]: string[];
}

class NotificationServiceClass {
  private initialized = false;

  async init() {
    if (this.initialized) return;

    // Set notification handler (foreground behavior)
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('habit-tracker', {
        name: 'Habit Tracker',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8B5CF6',
      });
    }

    this.initialized = true;
  }

  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    return status === 'granted';
  }

  async hasPermission(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  // --- Core scheduling ---

  async schedule(type: NotifType, trigger: Notifications.NotificationTriggerInput, content: Notifications.NotificationContentInput): Promise<string | null> {
    const permitted = await this.hasPermission();
    if (!permitted) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        ...content,
        data: { type, ...(content.data || {}) },
      },
      trigger,
    });

    await this.storeNotifId(type, id);
    return id;
  }

  async cancel(type: NotifType): Promise<void> {
    const ids = await this.getNotifIds(type);
    if (ids.length > 0) {
      await Notifications.cancelScheduledNotificationAsync(ids[0]);
    }
    await this.clearNotifIds(type);
  }

  async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(NOTIF_IDS_KEY);
  }

  async cancelById(id: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(id);
  }

  // --- Typed convenience methods ---

  async scheduleApproachingLimit(count: number, limit: number, minutesFromNow = 0): Promise<string | null> {
    await this.cancel(NotifType.APPROACHING_LIMIT);
    return this.schedule(
      NotifType.APPROACHING_LIMIT,
      minutesFromNow > 0 ? { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: minutesFromNow * 60 } : null,
      {
        title: 'Getting Close',
        body: `You've logged ${count} of ${limit} grabs today. Slow down to stay on track.`,
        sound: true,
      }
    );
  }

  async scheduleLimitExceeded(count: number, limit: number): Promise<string | null> {
    await this.cancel(NotifType.LIMIT_EXCEEDED);
    return this.schedule(
      NotifType.LIMIT_EXCEEDED,
      null,
      {
        title: 'Limit Exceeded',
        body: `You've reached ${count} grabs — that's ${count - limit} over your ${limit} goal. Take a breather.`,
        sound: true,
      }
    );
  }

  async schedulePlanChanged(planType: string, startLimit: number): Promise<string | null> {
    return this.schedule(
      NotifType.PLAN_CHANGED,
      null,
      {
        title: 'Plan Updated',
        body: `You're now on the ${planType.toUpperCase()} protocol starting at ${startLimit} grabs/day. Stay focused!`,
        sound: true,
      }
    );
  }

  async scheduleGoalReminder(todayLimit: number): Promise<string | null> {
    await this.cancel(NotifType.GOAL_REMINDER);

    const quotes = [
      "The secret of getting ahead is getting started.",
      "Focus on being productive instead of busy.",
      "Small steps every day lead to big results.",
      "Discipline is the bridge between goals and accomplishment.",
      "Your future is created by what you do today.",
      "One hour of focused work is worth more than three hours of distraction.",
    ];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];

    const intervalSeconds = 21600; // 6 hours

    return this.schedule(
      NotifType.GOAL_REMINDER,
      { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: intervalSeconds, repeats: true },
      {
        title: `Daily Goal: ${todayLimit} grabs`,
        body: quote,
        sound: true,
      }
    );
  }

  async scheduleStreakAtRisk(streak: number, hour = 20, minute = 0): Promise<string | null> {
    await this.cancel(NotifType.STREAK_AT_RISK);
    return this.schedule(
      NotifType.STREAK_AT_RISK,
      {
        type: SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
      {
        title: 'Streak at Risk',
        body: streak > 0
          ? `You're on a ${streak}-day streak! Log your pickups to keep it alive.`
          : "Don't break the chain — log your pickups to start a streak.",
        sound: true,
      }
    );
  }

  async scheduleFocusBlockStart(label: string, startHour: number, startMinute = 0): Promise<string | null> {
    const now = new Date();
    const triggerDate = new Date();
    triggerDate.setHours(startHour, startMinute, 0, 0);
    if (triggerDate <= now) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    return this.schedule(
      NotifType.FOCUS_BLOCK_START,
      { type: SchedulableTriggerInputTypes.DATE, date: triggerDate },
      {
        title: 'Focus Block Starting',
        body: `Your "${label}" focus block is about to begin. Put the phone away.`,
        sound: true,
      }
    );
  }

  async scheduleFocusBlockEnd(label: string, endHour: number, endMinute = 0, violationCount = 0): Promise<string | null> {
    const now = new Date();
    const triggerDate = new Date();
    triggerDate.setHours(endHour, endMinute, 0, 0);
    if (triggerDate <= now) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    return this.schedule(
      NotifType.FOCUS_BLOCK_END,
      { type: SchedulableTriggerInputTypes.DATE, date: triggerDate },
      {
        title: 'Focus Block Ended',
        body: violationCount === 0
          ? `Great job! You stuck to your "${label}" focus block.`
          : `Your "${label}" focus block ended. ${violationCount} grab${violationCount === 1 ? '' : 's'} during the block.`,
        sound: true,
      }
    );
  }

  async scheduleMorningCheckin(hour = 8, minute = 30): Promise<string | null> {
    await this.cancel(NotifType.MORNING_CHECKIN);
    return this.schedule(
      NotifType.MORNING_CHECKIN,
      {
        type: SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
      {
        title: 'Morning Check-In',
        body: 'Set your intention for today. What will you focus on reducing?',
        sound: true,
      }
    );
  }

  async scheduleEveningCheckin(hour = 18, minute = 0): Promise<string | null> {
    await this.cancel(NotifType.EVENING_CHECKIN);
    return this.schedule(
      NotifType.EVENING_CHECKIN,
      {
        type: SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
      {
        title: 'Evening Reflection',
        body: 'Close the day with a quick reflection and set your phone-free window.',
        sound: true,
      }
    );
  }

  // --- ID storage helpers ---

  private async getStoredIds(): Promise<PendingIdMap> {
    try {
      const raw = await AsyncStorage.getItem(NOTIF_IDS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private async storeNotifId(type: NotifType, id: string) {
    const map = await this.getStoredIds();
    if (!map[type]) map[type] = [];
    map[type].push(id);
    await AsyncStorage.setItem(NOTIF_IDS_KEY, JSON.stringify(map));
  }

  private async getNotifIds(type: NotifType): Promise<string[]> {
    const map = await this.getStoredIds();
    return map[type] || [];
  }

  private async clearNotifIds(type: NotifType) {
    const map = await this.getStoredIds();
    delete map[type];
    await AsyncStorage.setItem(NOTIF_IDS_KEY, JSON.stringify(map));
  }
}

export const NotificationService = new NotificationServiceClass();
