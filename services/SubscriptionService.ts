import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initConnection,
  endConnection,
  getSubscriptions,
  requestSubscription,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  type SubscriptionPurchase,
  type PurchaseError,
  type Subscription,
} from 'react-native-iap';
import { Platform } from 'react-native';

const TRIAL_DURATION_DAYS = 3;

const FIRST_OPEN_DATE_KEY = 'habit_tracker_first_open_date';
const SUBSCRIPTION_ACTIVE_KEY = 'habit_tracker_subscription_active';
const SUBSCRIPTION_PRODUCT_ID_KEY = 'habit_tracker_subscription_product_id';
const SUBSCRIPTION_EXPIRES_AT_KEY = 'habit_tracker_subscription_expires_at';
const SUBSCRIPTION_PURCHASE_DATE_KEY = 'habit_tracker_subscription_purchase_date';

export const SUBSCRIPTION_PRODUCTS = Platform.select({
  ios: [
    'com.jamesonsinger.habittracker.subscription.monthly',
    'com.jamesonsinger.habittracker.subscription.yearly',
  ],
  android: [
    'com.jamesonsinger.habittracker.subscription.monthly',
    'com.jamesonsinger.habittracker.subscription.yearly',
  ],
  default: [],
});

export interface SubscriptionStatus {
  isInTrial: boolean;
  isSubscribed: boolean;
  trialDaysRemaining: number;
  trialExpired: boolean;
  firstOpenDate: string | null;
}

class SubscriptionServiceClass {
  private connected = false;
  private products: Subscription[] = [];
  private listeners: { remove: () => void }[] = [];

  async init() {
    if (Platform.OS === 'web') return;
    try {
      await initConnection();
      this.connected = true;
      await this.loadProducts();
      this.setupPurchaseListeners();
      await this.validateSubscriptionFromReceipts();
    } catch (e) {
      console.log('IAP init error:', e);
    }
  }

  async end() {
    this.listeners.forEach((l) => l.remove());
    this.listeners = [];
    try {
      await endConnection();
      this.connected = false;
    } catch (e) {
      console.log('IAP end error:', e);
    }
  }

  private setupPurchaseListeners() {
    const updateListener = purchaseUpdatedListener(async (purchase: SubscriptionPurchase) => {
      try {
        await finishTransaction({ purchase, isConsumable: false });
        await this.activateSubscription(purchase.productId);
      } catch (e) {
        console.log('Purchase update error:', e);
      }
    });

    const errorListener = purchaseErrorListener((error: PurchaseError) => {
      console.log('Purchase error:', error);
    });

    this.listeners.push(updateListener, errorListener);
  }

  private async validateSubscriptionFromReceipts() {
    if (!this.connected || Platform.OS === 'web') return;
    try {
      const purchases = await getAvailablePurchases();
      const subPurchase = purchases.find((p) =>
        SUBSCRIPTION_PRODUCTS.includes(p.productId)
      );
      if (subPurchase) {
        await this.activateSubscription(subPurchase.productId);
      } else {
        const localActive = await AsyncStorage.getItem(SUBSCRIPTION_ACTIVE_KEY);
        if (localActive === 'true') {
          await this.deactivateSubscription();
        }
      }
    } catch (e) {
      console.log('Validate subscription error:', e);
    }
  }

  private async loadProducts() {
    if (!this.connected || SUBSCRIPTION_PRODUCTS.length === 0) return;
    try {
      const subs = await getSubscriptions({ skus: SUBSCRIPTION_PRODUCTS });
      this.products = subs;
    } catch (e) {
      console.log('Load products error:', e);
    }
  }

  getProducts(): Subscription[] {
    return this.products;
  }

  async startTrialIfNeeded() {
    const existing = await AsyncStorage.getItem(FIRST_OPEN_DATE_KEY);
    if (!existing) {
      const today = new Date().toISOString();
      await AsyncStorage.setItem(FIRST_OPEN_DATE_KEY, today);
    }
  }

  async getStatus(): Promise<SubscriptionStatus> {
    const firstOpenDateStr = await AsyncStorage.getItem(FIRST_OPEN_DATE_KEY);
    let isSubscribed = (await AsyncStorage.getItem(SUBSCRIPTION_ACTIVE_KEY)) === 'true';

    // Validate subscription hasn't expired (receipt check on status read)
    if (isSubscribed) {
      try {
        const purchases = await getAvailablePurchases();
        const subPurchase = purchases.find((p) =>
          SUBSCRIPTION_PRODUCTS.includes(p.productId)
        );
        if (!subPurchase) {
          await this.deactivateSubscription();
          isSubscribed = false;
        }
      } catch (e) {
        console.log('Status validation error:', e);
      }
    }

    if (isSubscribed) {
      return {
        isInTrial: false,
        isSubscribed: true,
        trialDaysRemaining: 0,
        trialExpired: false,
        firstOpenDate: firstOpenDateStr,
      };
    }

    if (!firstOpenDateStr) {
      return {
        isInTrial: true,
        isSubscribed: false,
        trialDaysRemaining: TRIAL_DURATION_DAYS,
        trialExpired: false,
        firstOpenDate: null,
      };
    }

    const firstOpen = new Date(firstOpenDateStr);
    const now = new Date();
    const diffMs = now.getTime() - firstOpen.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const daysRemaining = Math.max(0, TRIAL_DURATION_DAYS - Math.floor(diffDays));
    const trialExpired = daysRemaining <= 0;

    return {
      isInTrial: !trialExpired,
      isSubscribed: false,
      trialDaysRemaining: daysRemaining,
      trialExpired,
      firstOpenDate: firstOpenDateStr,
    };
  }

  async activateSubscription(productId: string) {
    const now = new Date().toISOString();
    await AsyncStorage.setItem(SUBSCRIPTION_ACTIVE_KEY, 'true');
    await AsyncStorage.setItem(SUBSCRIPTION_PRODUCT_ID_KEY, productId);
    await AsyncStorage.setItem(SUBSCRIPTION_PURCHASE_DATE_KEY, now);
  }

  async deactivateSubscription() {
    await AsyncStorage.removeItem(SUBSCRIPTION_ACTIVE_KEY);
    await AsyncStorage.removeItem(SUBSCRIPTION_PRODUCT_ID_KEY);
    await AsyncStorage.removeItem(SUBSCRIPTION_EXPIRES_AT_KEY);
    await AsyncStorage.removeItem(SUBSCRIPTION_PURCHASE_DATE_KEY);
  }

  async subscribe(productId: string): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      await requestSubscription({ sku: productId });
      return true;
    } catch (e) {
      console.log('Subscribe error:', e);
      return false;
    }
  }

  async restorePurchases(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      const purchases = await getAvailablePurchases();
      const subPurchase = purchases.find((p) =>
        SUBSCRIPTION_PRODUCTS.includes(p.productId)
      );
      if (subPurchase) {
        await this.activateSubscription(subPurchase.productId);
        return true;
      }
      return false;
    } catch (e) {
      console.log('Restore error:', e);
      return false;
    }
  }

  async canAccessPremiumFeatures(): Promise<boolean> {
    const status = await this.getStatus();
    return status.isInTrial || status.isSubscribed;
  }
}

export const SubscriptionService = new SubscriptionServiceClass();