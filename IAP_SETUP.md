# In-App Purchase Setup Guide

## Overview
The app now includes a 3-day free trial followed by a subscription model using Apple In-App Purchases.

## What was implemented
r
### Code changes
- `services/SubscriptionService.ts` — IAP connection, product fetching, purchase flow, receipt validation, trial logic
- `app/pages/paywall/paywall.tsx` — paywall screen with pricing, feature list, subscribe/restore buttons
- `utils/storage.ts` — trial and subscription state storage
- `app/_layout.tsx` — initializes SubscriptionService on app launch
- `app/index.tsx` — checks trial/subscription status and redirects to paywall if expired
- `app/pages/home/home.tsx` — shows trial banner, subscription banner, gates add-grab button
- `app/onboarding/*.tsx` — starts 3-day trial when onboarding completes

### User flow
1. User completes onboarding → 3-day free trial starts
2. During trial: full access, banner shows days remaining
3. After trial expires: paywall appears on app launch, add-grab is blocked
4. User subscribes → full access restored
5. User can restore previous purchases

## Required App Store Connect setup

You must manually create subscription products in App Store Connect before purchases will work.

### Step 1: Open App Store Connect
Go to: https://appstoreconnect.apple.com

### Step 2: Select your app
Find **Grabb | Phone Grab Tracker**

### Step 3: Go to Subscriptions
- In-app Purchases → Manage → Create
- Add Subscription Group (e.g., "Premium Access")

### Step 4: Create subscription products

Create **2 subscriptions** with these exact Product IDs:

#### Monthly Subscription
- **Product ID:** `com.jamesonsinger.habittracker.subscription.monthly`
- **Reference Name:** Monthly Premium
- **Subscription Group:** Premium Access
- **Subscription Duration:** 1 Month
- **Price:** $4.99 (or your preferred price)
- **Free Trial:** No (the app handles the 3-day trial locally)

#### Yearly Subscription
- **Product ID:** `com.jamesonsinger.habittracker.subscription.yearly`
- **Reference Name:** Yearly Premium
- **Subscription Group:** Premium Access
- **Subscription Duration:** 1 Year
- **Price:** $39.99 (or your preferred price)
- **Introductory Offer:** You may add a 3-day free trial here as well (optional — the app already handles this)

### Step 5: Add subscription group localization
- Add display name and description for each subscription
- This is what users see on the App Store

### Step 6: Wait for review
Apple reviews new in-app purchases. This can take 24-48 hours.

### Step 7: Add paid app agreement
- Go to Agreements, Tax, and Banking
- Make sure you have an active **Paid Apps agreement**
- Without this, in-app purchases will not work

## Build steps after code changes

```bash
# 1. Install dependencies
npm install

# 2. Install iOS pods (needed for react-native-iap native module)
cd ios && pod install && cd ..

# 3. Build for iOS
npx eas build --platform ios --profile production
```

## Testing IAP

### Before App Store Connect products are live
Purchases will fail with "Cannot connect to iTunes Store" or product not found. This is expected.

### After products are approved
Test on a real device with a **Sandbox tester account**:
1. App Store Connect → Users and Access → Sandbox Testers
2. Create a test Apple ID
3. On your test iPhone, sign out of App Store
4. Run the app, the purchase will use the sandbox environment
5. Sandbox purchases do not charge real money

## Notes
- The 3-day trial is managed locally in the app (not through App Store Connect)
- This is a common MVP approach — for production, server-side validation is recommended
- The paywall shows fallback pricing ($4.99/mo, $39.99/yr) if products fail to load
