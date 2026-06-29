import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExtensionStorage } from '@bacons/apple-targets';
import HabitTrackerModule from 'habit-tracker-module';
import { getLocalDateString } from '@/utils/date';

export interface GrabLog {
  id: string;
  timestamp: number;
  trigger: string;
  date: string;
  why?: PickupWhyReason;
}

export type PickupWhyReason = 'Boredom' | 'Habit' | 'Social' | 'Work' | 'Anxiety' | 'Other';

export interface DailyStats {
  date: string;
  count: number;
  grabs: GrabLog[];
}

export interface FocusBlock {
  id: string;
  label: string;
  startHour: number;
  endHour: number;
  daysOfWeek: number[];
}

export interface PlanConfig {
  planType: 'easy' | 'moderate' | 'hard' | 'custom';
  phase1Limit: number;
  phase2Limit: number;
  phase3Limit: number;
  phase4Limit: number;
}

export interface NotificationPreferences {
  limitAlerts: boolean;
  streakReminders: boolean;
  goalReminders: boolean;
  morningCheckInReminders: boolean;
  eveningCheckInReminders: boolean;
}

const GRABS_KEY = 'habit_tracker_grabs';
const DAILY_LIMIT_KEY = 'habit_tracker_daily_limit';
const ONBOARDING_COMPLETE_KEY = 'habit_tracker_onboarding_complete';
const USER_NAME_KEY = 'habit_tracker_user_name';
const TIP_DISMISSED_KEY = 'habit_tracker_tip_dismissed';
const PLAN_CONFIG_KEY = 'habit_tracker_plan_config';
const CALIBRATION_ADOPTED_KEY = 'habit_tracker_calibration_adopted';
const LAST_CHECKIN_KEY = 'habit_tracker_last_checkin_date';
const LAST_NIGHT_CHECKIN_KEY = 'habit_tracker_last_night_checkin_date';
const PHONE_FREE_WINDOW_KEY = 'habit_tracker_phone_free_window';
const MORNING_CHECKIN_HOUR_KEY = 'habit_tracker_morning_checkin_hour';
const EVENING_CHECKIN_HOUR_KEY = 'habit_tracker_evening_checkin_hour';
const CHECKIN_PREVIEW_KEY = 'habit_tracker_checkin_preview';
const TODAY_INTENTION_KEY = 'habit_tracker_today_intention';
const TRACKING_WHY_ENABLED_KEY = 'habit_tracker_tracking_why_enabled';
const NOTIFICATION_PREFS_KEY = 'habit_tracker_notification_preferences';
const HAS_SWIPED_TIP_KEY = 'habit_tracker_has_swiped_tip';

const DEFAULT_PLAN_CONFIG: PlanConfig = {
  planType: 'moderate',
  phase1Limit: 40,
  phase2Limit: 30,
  phase3Limit: 20,
  phase4Limit: 10,
};

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  limitAlerts: true,
  streakReminders: true,
  goalReminders: true,
  morningCheckInReminders: true,
  eveningCheckInReminders: true,
};

// Shared App Group storage for widget sync (App → Widget)
let widgetStore: ExtensionStorage | null = null;
try {
  widgetStore = new ExtensionStorage('group.com.jamesonsinger.habittracker.widget');
} catch (e) {
  // Not available in Expo Go
}

async function syncWidgetStats() {
  try {
    const today = getLocalDateString();
    const stats = await storage.getDailyStats(today);
    const limit = await storage.getDailyLimit();
    if (HabitTrackerModule) {
      HabitTrackerModule.syncStats(stats.count, limit);
    } else if (widgetStore) {
      widgetStore.set(`grab_count_${today}`, stats.count);
      widgetStore.set('grab_limit', limit);
      ExtensionStorage.reloadWidget();
    }
  } catch (e) {
    console.log('Error syncing widget stats:', e);
  }
}

export const storage = {
  async addGrab(trigger: string, customDateStr?: string): Promise<GrabLog> {
    try {
      const dateStr = customDateStr || getLocalDateString();
      
      // Calculate backdated timestamp preserving current time of day for high-fidelity peak-hour analysis
      let timestamp = Date.now();
      if (customDateStr) {
        const selectedD = new Date(customDateStr);
        const currentD = new Date();
        selectedD.setHours(
          currentD.getHours(), 
          currentD.getMinutes(), 
          currentD.getSeconds(), 
          currentD.getMilliseconds()
        );
        timestamp = selectedD.getTime();
      }

      const grab: GrabLog = {
        id: `${dateStr}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp,
        trigger,
        date: dateStr,
      };

      const allGrabs = await storage.getAllGrabs();
      allGrabs.push(grab);
      await AsyncStorage.setItem(GRABS_KEY, JSON.stringify(allGrabs));
      await syncWidgetStats();
      return grab;
    } catch (error) {
      console.error('Error adding grab:', error);
      throw error;
    }
  },

  async removeGrab(grabId: string): Promise<void> {
    try {
      const allGrabs = await storage.getAllGrabs();
      const filtered = allGrabs.filter(g => g.id !== grabId);
      await AsyncStorage.setItem(GRABS_KEY, JSON.stringify(filtered));
      await syncWidgetStats();
    } catch (error) {
      console.error('Error removing grab:', error);
      throw error;
    }
  },

  async getTodayGrabs(): Promise<GrabLog[]> {
    try {
      const today = getLocalDateString();
      const allGrabs = await storage.getAllGrabs();
      return allGrabs.filter(g => g.date === today);
    } catch (error) {
      console.error('Error getting today grabs:', error);
      return [];
    }
  },

  async getAllGrabs(): Promise<GrabLog[]> {
    try {
      const data = await AsyncStorage.getItem(GRABS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting all grabs:', error);
      return [];
    }
  },

  async setGrabWhy(grabId: string, why: PickupWhyReason): Promise<void> {
    try {
      const allGrabs = await storage.getAllGrabs();
      const updated = allGrabs.map((grab) => grab.id === grabId ? { ...grab, why } : grab);
      await AsyncStorage.setItem(GRABS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error setting grab why:', error);
      throw error;
    }
  },

  async getDailyStats(date: string): Promise<DailyStats> {
    try {
      const allGrabs = await storage.getAllGrabs();
      const dayGrabs = allGrabs.filter(g => g.date === date);
      return {
        date,
        count: dayGrabs.length,
        grabs: dayGrabs,
      };
    } catch (error) {
      console.error('Error getting daily stats:', error);
      return { date, count: 0, grabs: [] };
    }
  },

  async setDailyLimit(limit: number): Promise<void> {
    try {
      const config = await storage.getPlanConfig();
      const allGrabs = await storage.getAllGrabs();
      
      const dates = allGrabs.map(g => g.date).sort();
      let elapsedDays = 0;
      if (dates.length > 0) {
        const firstD = new Date(dates[0]);
        const lastD = new Date(dates[dates.length - 1]);
        const diffTime = Math.abs(lastD.getTime() - firstD.getTime());
        elapsedDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
      }
      
      config.planType = 'custom';
      if (elapsedDays <= 14) {
        config.phase1Limit = limit;
      } else if (elapsedDays <= 28) {
        config.phase2Limit = limit;
      } else if (elapsedDays <= 42) {
        config.phase3Limit = limit;
      } else {
        config.phase4Limit = limit;
      }
      
      await storage.setPlanConfig(config);
      await AsyncStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify(limit));
      await syncWidgetStats();
    } catch (error) {
      console.error('Error setting daily limit:', error);
      throw error;
    }
  },

  async getDailyLimit(): Promise<number> {
    try {
      const config = await storage.getPlanConfig();
      const allGrabs = await storage.getAllGrabs();
      
      const dates = allGrabs.map(g => g.date).sort();
      let elapsedDays = 0;
      if (dates.length > 0) {
        const firstD = new Date(dates[0]);
        const lastD = new Date(dates[dates.length - 1]);
        const diffTime = Math.abs(lastD.getTime() - firstD.getTime());
        elapsedDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
      }
      
      if (elapsedDays <= 14) return config.phase1Limit;
      if (elapsedDays <= 28) return config.phase2Limit;
      if (elapsedDays <= 42) return config.phase3Limit;
      return config.phase4Limit;
    } catch (error) {
      console.error('Error getting dynamic daily limit:', error);
      return 40;
    }
  },

  async getPlanConfig(): Promise<PlanConfig> {
    try {
      const data = await AsyncStorage.getItem(PLAN_CONFIG_KEY);
      return data ? JSON.parse(data) : DEFAULT_PLAN_CONFIG;
    } catch (error) {
      console.error('Error getting plan config:', error);
      return DEFAULT_PLAN_CONFIG;
    }
  },

  async setPlanConfig(config: PlanConfig): Promise<void> {
    try {
      await AsyncStorage.setItem(PLAN_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Error setting plan config:', error);
      throw error;
    }
  },

  async setOnboardingComplete(): Promise<void> {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, JSON.stringify(true));
    } catch (error) {
      console.error('Error setting onboarding complete:', error);
      throw error;
    }
  },

  async getOnboardingComplete(): Promise<boolean> {
    try {
      const complete = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
      return complete ? JSON.parse(complete) : false;
    } catch (error) {
      console.error('Error getting onboarding complete:', error);
      return false;
    }
  },

  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(GRABS_KEY);
      await AsyncStorage.removeItem(DAILY_LIMIT_KEY);
      await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  },

  async setUserName(name: string): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_NAME_KEY, name);
    } catch (error) {
      console.error('Error setting user name:', error);
      throw error;
    }
  },

  async getUserName(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(USER_NAME_KEY);
    } catch (error) {
      console.error('Error getting user name:', error);
      return null;
    }
  },

  async setTipDismissedTimestamp(): Promise<void> {
    try {
      await AsyncStorage.setItem(TIP_DISMISSED_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error setting tip dismissed timestamp:', error);
    }
  },

  async getTipDismissedTimestamp(): Promise<number> {
    try {
      const ts = await AsyncStorage.getItem(TIP_DISMISSED_KEY);
      return ts ? parseInt(ts, 10) : 0;
    } catch (error) {
      console.error('Error getting tip dismissed timestamp:', error);
      return 0;
    }
  },

  async setHasSwipedTip(hasSwiped: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(HAS_SWIPED_TIP_KEY, JSON.stringify(hasSwiped));
    } catch (error) {
      console.error('Error setting has swiped tip:', error);
    }
  },

  async getHasSwipedTip(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(HAS_SWIPED_TIP_KEY);
      return val ? JSON.parse(val) : false;
    } catch (error) {
      console.error('Error getting has swiped tip:', error);
      return false;
    }
  },

  async setCalibrationAdopted(val: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(CALIBRATION_ADOPTED_KEY, JSON.stringify(val));
    } catch (error) {
      console.error('Error setting calibration adopted:', error);
      throw error;
    }
  },

  async getCalibrationAdopted(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(CALIBRATION_ADOPTED_KEY);
      return data ? JSON.parse(data) : false;
    } catch (error) {
      console.error('Error getting calibration adopted:', error);
      return false;
    }
  },

  async setLastCheckInDate(dateStr: string): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_CHECKIN_KEY, dateStr);
    } catch (error) {
      console.error('Error setting last checkin date:', error);
      throw error;
    }
  },

  async getLastCheckInDate(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(LAST_CHECKIN_KEY);
    } catch (error) {
      console.error('Error getting last checkin date:', error);
      return null;
    }
  },

  // Intention is stored with today's date as suffix — auto-resets every morning
  async setTodayIntention(intentionKey: string): Promise<void> {
    try {
      const today = getLocalDateString();
      await AsyncStorage.setItem(`${TODAY_INTENTION_KEY}_${today}`, intentionKey);
    } catch (error) {
      console.error('Error setting today intention:', error);
    }
  },

  async getTodayIntention(): Promise<string | null> {
    try {
      const today = getLocalDateString();
      return await AsyncStorage.getItem(`${TODAY_INTENTION_KEY}_${today}`);
    } catch (error) {
      console.error('Error getting today intention:', error);
      return null;
    }
  },

  async setFocusTriggers(triggers: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem('habit_tracker_focus_triggers', JSON.stringify(triggers));
    } catch (error) {
      console.error('Error setting focus triggers:', error);
    }
  },

  async getFocusTriggers(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem('habit_tracker_focus_triggers');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting focus triggers:', error);
      return [];
    }
  },

  async setFocusBlocks(blocks: FocusBlock[]): Promise<void> {
    try {
      await AsyncStorage.setItem('habit_tracker_focus_blocks', JSON.stringify(blocks));
    } catch (error) {
      console.error('Error setting focus blocks:', error);
    }
  },

  async getFocusBlocks(): Promise<FocusBlock[]> {
    try {
      const data = await AsyncStorage.getItem('habit_tracker_focus_blocks');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting focus blocks:', error);
      return [];
    }
  },

  async setTrackingWhyEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(TRACKING_WHY_ENABLED_KEY, JSON.stringify(enabled));
    } catch (error) {
      console.error('Error setting tracking why enabled:', error);
    }
  },

  async getTrackingWhyEnabled(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(TRACKING_WHY_ENABLED_KEY);
      return data ? JSON.parse(data) : false;
    } catch (error) {
      console.error('Error getting tracking why enabled:', error);
      return false;
    }
  },

  async setNotificationPreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error setting notification preferences:', error);
    }
  },

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    try {
      const data = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
      return data ? { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(data) } : DEFAULT_NOTIFICATION_PREFS;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return DEFAULT_NOTIFICATION_PREFS;
    }
  },

  async setLastNightCheckInDate(dateStr: string): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_NIGHT_CHECKIN_KEY, dateStr);
    } catch (error) {
      console.error('Error setting last night checkin date:', error);
    }
  },

  async getLastNightCheckInDate(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(LAST_NIGHT_CHECKIN_KEY);
    } catch (error) {
      console.error('Error getting last night checkin date:', error);
      return null;
    }
  },

  async setPhoneFreeWindow(window: string | null): Promise<void> {
    try {
      if (window) {
        await AsyncStorage.setItem(PHONE_FREE_WINDOW_KEY, window);
      } else {
        await AsyncStorage.removeItem(PHONE_FREE_WINDOW_KEY);
      }
    } catch (error) {
      console.error('Error setting phone free window:', error);
    }
  },

  async getPhoneFreeWindow(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(PHONE_FREE_WINDOW_KEY);
    } catch (error) {
      console.error('Error getting phone free window:', error);
      return null;
    }
  },

  async setMorningCheckInHour(hour: number): Promise<void> {
    try {
      await AsyncStorage.setItem(MORNING_CHECKIN_HOUR_KEY, JSON.stringify(hour));
    } catch (error) {
      console.error('Error setting morning check-in hour:', error);
    }
  },

  async getMorningCheckInHour(): Promise<number> {
    try {
      const data = await AsyncStorage.getItem(MORNING_CHECKIN_HOUR_KEY);
      return data ? JSON.parse(data) : 8;
    } catch (error) {
      console.error('Error getting morning check-in hour:', error);
      return 8;
    }
  },

  async setEveningCheckInHour(hour: number): Promise<void> {
    try {
      await AsyncStorage.setItem(EVENING_CHECKIN_HOUR_KEY, JSON.stringify(hour));
    } catch (error) {
      console.error('Error setting evening check-in hour:', error);
    }
  },

  async getEveningCheckInHour(): Promise<number> {
    try {
      const data = await AsyncStorage.getItem(EVENING_CHECKIN_HOUR_KEY);
      return data ? JSON.parse(data) : 18;
    } catch (error) {
      console.error('Error getting evening check-in hour:', error);
      return 18;
    }
  },

  async setCheckInPreview(type: 'morning' | 'evening'): Promise<void> {
    try {
      await AsyncStorage.setItem(CHECKIN_PREVIEW_KEY, type);
    } catch (error) {
      console.error('Error setting check-in preview:', error);
    }
  },

  async consumeCheckInPreview(): Promise<'morning' | 'evening' | null> {
    try {
      const data = await AsyncStorage.getItem(CHECKIN_PREVIEW_KEY);
      await AsyncStorage.removeItem(CHECKIN_PREVIEW_KEY);
      return data === 'morning' || data === 'evening' ? data : null;
    } catch (error) {
      console.error('Error consuming check-in preview:', error);
      return null;
    }
  },

  // --- Subscription / Trial helpers ---

  async setFirstOpenDate(dateStr: string): Promise<void> {
    try {
      await AsyncStorage.setItem('habit_tracker_first_open_date', dateStr);
    } catch (error) {
      console.error('Error setting first open date:', error);
    }
  },

  async getFirstOpenDate(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('habit_tracker_first_open_date');
    } catch (error) {
      console.error('Error getting first open date:', error);
      return null;
    }
  },

  async setSubscriptionActive(active: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem('habit_tracker_subscription_active', JSON.stringify(active));
    } catch (error) {
      console.error('Error setting subscription active:', error);
    }
  },

  async getSubscriptionActive(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem('habit_tracker_subscription_active');
      return data ? JSON.parse(data) : false;
    } catch (error) {
      console.error('Error getting subscription active:', error);
      return false;
    }
  },

  async getTrialDaysRemaining(): Promise<number> {
    try {
      const firstOpen = await AsyncStorage.getItem('habit_tracker_first_open_date');
      if (!firstOpen) return 3;
      const elapsed = (Date.now() - new Date(firstOpen).getTime()) / (1000 * 60 * 60 * 24);
      return Math.max(0, 3 - Math.floor(elapsed));
    } catch (error) {
      console.error('Error getting trial days:', error);
      return 3;
    }
  },

  async setHasSeenTrialWelcome(seen: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem('habit_tracker_seen_trial_welcome', JSON.stringify(seen));
    } catch (error) {
      console.error('Error setting trial welcome seen:', error);
    }
  },

  async getHasSeenTrialWelcome(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem('habit_tracker_seen_trial_welcome');
      return data ? JSON.parse(data) : false;
    } catch (error) {
      console.error('Error getting trial welcome seen:', error);
      return false;
    }
  },

  async setTrialBannerDismissedDate(dateStr: string): Promise<void> {
    try {
      await AsyncStorage.setItem('habit_tracker_trial_banner_dismissed', dateStr);
    } catch (error) {
      console.error('Error setting trial banner dismissed date:', error);
    }
  },

  async getTrialBannerDismissedDate(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('habit_tracker_trial_banner_dismissed');
    } catch (error) {
      console.error('Error getting trial banner dismissed date:', error);
      return null;
    }
  },
};