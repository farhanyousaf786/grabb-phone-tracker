import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setup,
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
  private initializing: Promise<boolean> | null = null;
  private initError: string | null = null;

  /** Connect to the App Store and fetch subscription products. */
  async prepareStore(options: { validateReceipts?: boolean } = {}): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    if (this.connected) {
      if (this.products.length === 0) {
        await this.loadProducts();
      }
      if (options.validateReceipts) {
        await this.validateSubscriptionFromReceipts();
      }
      return true;
    }

    if (this.initializing) {
      const ready = await this.initializing;
      if (ready && options.validateReceipts) {
        await this.validateSubscriptionFromReceipts();
      }
      return ready;
    }

    this.initializing = this.doInit(options);
    try {
      return await this.initializing;
    } finally {
      this.initializing = null;
    }
  }

  private async doInit(options: { validateReceipts?: boolean } = {}): Promise<boolean> {
    try {
      setup({ storekitMode: 'STOREKIT1_MODE' });
      await initConnection();
      this.connected = true;
      this.initError = null;
      this.setupPurchaseListeners();
      await this.loadProducts();
      if (__DEV__) {
        console.log(
          'IAP products loaded:',
          this.products.map((p) => p.productId).join(', ') || '(none)',
        );
      }
      if (options.validateReceipts) {
        await this.validateSubscriptionFromReceipts();
      }
      return true;
    } catch (e) {
      this.initError = e instanceof Error ? e.message : 'Could not connect to the App Store.';
      console.log('IAP init error:', e);
      return false;
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

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const subs = await getSubscriptions({ skus: SUBSCRIPTION_PRODUCTS });
        if (subs.length > 0) {
          this.products = subs;
          return;
        }
      } catch (e) {
        console.log(`Load products attempt ${attempt + 1} error:`, e);
      }
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
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

    // Only validate receipts if the store is already connected (paywall was opened).
    if (isSubscribed && this.connected) {
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

  async subscribe(productId: string): Promise<{ success: boolean; error?: string }> {
    if (Platform.OS === 'web') {
      return { success: false, error: 'Purchases are not supported on web.' };
    }

    const ready = await this.prepareStore();
    if (!ready) {
      return {
        success: false,
        error:
          this.initError ??
          'Could not connect to the App Store. Check your internet connection and try again.',
      };
    }

    if (!this.products.find((p) => p.productId === productId)) {
      await this.loadProducts();
    }

    try {
      await requestSubscription({ sku: productId });
      return { success: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Purchase failed';
      console.log('Subscribe error:', e);

      if (message.toLowerCase().includes('invalid product')) {
        return {
          success: false,
          error:
            'Apple has not activated these subscriptions yet.\n\nFor dev testing: rebuild the app once (npm run ios:device:usb), then try again.\n\nFor App Store approval: this is OK — upload a production build and resubmit. Apple tests subscriptions during review.',
        };
      }

      if (message.toLowerCase().includes('cancel')) {
        return { success: false, error: 'Purchase cancelled.' };
      }

      return { success: false, error: message };
    }
  }

  async restorePurchases(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    await this.prepareStore({ validateReceipts: true });
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