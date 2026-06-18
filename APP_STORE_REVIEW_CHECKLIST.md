# App Store Resubmission Checklist

Based on Apple rejection of **iOS App 1.0.0 (9)** — June 18, 2026.

**Submission ID:** ec56a569-9846-42e9-8ef3-22e6e0d3b3e5  
**Guidelines rejected:** **3.1.2(c)** + **2.1(b)**

---

## What Apple rejected

| Guideline | Apple found |
|-----------|-------------|
| **3.1.2(c)** | Missing Privacy + Terms links **in app** and **in metadata** |
| **2.1(b)** | Subscribe broken — *"In-App Purchases require a development build"* + Paid Apps Agreement required |

**Do not resubmit build 9.** Upload a **new production build**.

---

## Full checklist

### A — Guideline 3.1.2(c): Legal links & subscription info

#### In the app (paywall)

| # | Item | Status |
|---|------|--------|
| A1 | Privacy Policy link on paywall | [x] Done in code |
| A2 | Terms of Use link on paywall | [x] Done in code |
| A3 | Subscription title (Monthly / Yearly) | [x] Done |
| A4 | Subscription length (monthly / annual) | [x] Done |
| A5 | Price shown ($4.99 / $39.99) | [x] Done |
| A6 | Auto-renew / cancel text | [x] Done |
| A7 | Apple sees this in **new build** (not build 9) | [ ] Need new EAS build |

#### In App Store Connect metadata

| # | Item | Where | Status |
|---|------|-------|--------|
| A8 | Privacy Policy URL | **App Store → App Privacy** | [x] Done |
| A9 | Terms of Use link | **Version 1.0 → Description** | [x] Done (you added) |
| A10 | Standard Apple EULA | **General → App Information → License Agreement** | [x] Done (option 1) |
| A11 | Open both URLs in browser — pages load | — | [ ] Quick test |

---

### B — Guideline 2.1(b): Subscribe must work in review

#### Client — Business (blocks IAP)

| # | Item | Where | Status |
|---|------|-------|--------|
| B1 | Accept updated License Agreement | **Business → Agreements** (yellow banner) | [ ] Client |
| B2 | **Paid Apps Agreement** = Active | **Business → Agreements** | [ ] Client |
| B3 | Bank account added | **Business → Bank Accounts** | [ ] Client |
| B4 | Tax form submitted | **Business → Tax Forms** | [ ] Client |
| B5 | DSA compliance done | Red banner on Business page | [ ] Client |

**Note:** Only **Free Apps Agreement** was active when you checked. **Paid Apps is required for subscriptions.**

#### Subscriptions in App Store Connect

| # | Item | Status |
|---|------|--------|
| B6 | Monthly: `com.jamesonsinger.habittracker.subscription.monthly` | [x] Created |
| B7 | Yearly: `com.jamesonsinger.habittracker.subscription.yearly` | [x] Created |
| B8 | Both **Waiting for Review** | [x] Already submitted with v1.0 — **no attach needed** |
| B9 | Price + English localization on each | [ ] Verify |
| B10 | Subscription group English localization | [ ] Verify |

**Note:** Subscription page does **not** show "linked to 1.0". **Waiting for Review** = already linked.

#### New build (you)

| # | Item | Status |
|---|------|--------|
| B11 | Production build: `npx eas build --platform ios --profile production` | [ ] Not yet |
| B12 | Upload to App Store Connect | [ ] Not yet |
| B13 | Version 1.0 → select **new build** (NOT build 9) | [ ] Not yet |
| B14 | TestFlight: Subscribe opens Apple payment sheet | [ ] After B2 + new build |
| B15 | TestFlight: Privacy + Terms links work | [ ] After new build |

---

### C — Submit for review

| # | Item | Status |
|---|------|--------|
| C1 | All **A** metadata items done | [x] Mostly done |
| C2 | Client **B1–B5** done (Paid Apps Active) | [ ] Waiting |
| C3 | New build **B11–B13** done | [ ] Waiting |
| C4 | Click **Update Review** / **Resubmit** on version 1.0 | [ ] Last step |

**Optional reply to Apple:**

> We added Privacy Policy and Terms of Use links to the paywall, added Terms URL to the app description, activated the Paid Apps Agreement, and submitted a new build with working in-app purchases.

---

## What's done vs left (summary)

### Done
- Privacy + Terms links in app code
- Privacy URL in App Privacy
- Terms link in Description
- Standard EULA selected
- Subscriptions created + Waiting for Review (linked to v1.0)

### Left
- **Client:** Paid Apps Agreement + bank + tax + license + DSA
- **You:** Verify subscription metadata (B9–B10)
- **You:** New production EAS build + TestFlight test
- **You:** Resubmit version 1.0

---

## Order of work

```
1. Client finishes Business (B1–B5)
2. You verify subscriptions (B9–B10)
3. You run: npx eas build --platform ios --profile production
4. Select new build on version 1.0
5. TestFlight quick test (B14–B15)
6. Update Review (C4)
```

---

## URLs & product IDs

| | |
|---|---|
| Privacy | https://sites.google.com/view/phone-grab-tracker-pro/home |
| Terms | https://sites.google.com/view/phone-grab-tracker-pro-terms/home |
| Monthly ID | `com.jamesonsinger.habittracker.subscription.monthly` |
| Yearly ID | `com.jamesonsinger.habittracker.subscription.yearly` |
| Bundle ID | `com.jamesonsinger.habittracker` |

---

## Commands

```bash
# Production build for App Store (required)
npx eas build --platform ios --profile production

# Submit to App Store Connect
npx eas submit --platform ios --profile production
```

Dev commands (`npm start`, `npm run ios`) are **not** for App Store review.
