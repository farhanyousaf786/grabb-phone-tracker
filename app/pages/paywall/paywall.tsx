import { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { SubscriptionService, SUBSCRIPTION_PRODUCTS } from '@/services/SubscriptionService';
import type { Subscription } from 'react-native-iap';
import { useRouter } from 'expo-router';

export default function PaywallScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const horizontalPadding = Math.max(22, Math.min(34, width * 0.07));
  const privacyPolicyUrl = 'https://sites.google.com/view/phone-grab-tracker-pro/home';
  const termsOfUseUrl = 'https://sites.google.com/view/phone-grab-tracker-pro-terms/home';

  const [products, setProducts] = useState<Subscription[]>([]);
  const [selectedSku, setSelectedSku] = useState<string | null>(
    SUBSCRIPTION_PRODUCTS[0] || null
  );
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [trialDays, setTrialDays] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const status = await SubscriptionService.getStatus();
    setTrialDays(status.trialDaysRemaining);

    if (Platform.OS === 'web') {
      setLoadingProducts(false);
      return;
    }

    setLoadingProducts(true);
    try {
      await SubscriptionService.prepareStore();
      setProducts(SubscriptionService.getProducts());
    } finally {
      setLoadingProducts(false);
    }
  }

  async function handleSubscribe() {
    if (!selectedSku) return;
    setLoading(true);
    try {
      const result = await SubscriptionService.subscribe(selectedSku);

      if (result.success) {
        const status = await SubscriptionService.getStatus();
        if (status.isSubscribed) {
          Alert.alert('Welcome!', 'Your subscription is active.');
          router.replace('/pages/home/home');
          return;
        }
        // Purchase sheet may still be open — wait for purchaseUpdatedListener.
        return;
      }

      Alert.alert('Unable to Subscribe', result.error ?? 'Something went wrong. Please try again.');
    } catch (e) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    setRestoring(true);
    try {
      const restored = await SubscriptionService.restorePurchases();
      if (restored) {
        Alert.alert('Restored', 'Your subscription has been restored.');
        router.replace('/pages/home/home');
      } else {
        Alert.alert('Not Found', 'No previous purchases found.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not restore purchases.');
    } finally {
      setRestoring(false);
    }
  }

  async function openLink(url: string) {
    try {
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Error', 'Could not open the link.');
    }
  }

  const features = [
    'Unlimited phone grab tracking',
    'Detailed daily & weekly analytics',
    'Streak tracking & motivation',
    'Focus blocks & phone-free windows',
    'Morning & evening check-ins',
    'Home screen widget support',
    'Ad-free experience',
  ];

  const isYearly = (sku: string) => sku.includes('yearly');
  const getPrice = (p: Subscription) => {
    const subscription = p as Record<string, any>;
    return subscription.localizedPrice || subscription.price || subscription.subscriptionOfferDetails?.[0]?.pricingPhases?.pricingPhaseList?.[0]?.formattedPrice || '';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={isDark ? ['#1A1A18', '#241B2E'] : ['#F5F3FF', '#EDE9FE']} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 32, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.headerRow}>
          <Pressable onPress={() => router.replace('/pages/home/home')} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </Pressable>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.titleWrap}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="lock-open" size={28} color="#FFFFFF" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Unlock Full Access</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {trialDays > 0
              ? `${trialDays} day${trialDays > 1 ? 's' : ''} left in your free trial`
              : 'Your free trial has ended. Subscribe to continue.'}
          </Text>
        </Animated.View>

        {/* Features */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.featuresCard}>
          <LinearGradient
            colors={isDark ? [colors.surface, '#2A2233'] : ['#FFFFFF', '#F8F6FF']}
            style={[styles.cardBg, { borderColor: colors.border }]}
          >
            <Text style={[styles.featuresTitle, { color: colors.text }]}>What you get</Text>
            {features.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={{ marginRight: 10 }} />
                <Text style={[styles.featureText, { color: colors.textMuted }]}>{f}</Text>
              </View>
            ))}
          </LinearGradient>
        </Animated.View>

        {/* Pricing */}
        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.pricingWrap}>
          <Text style={[styles.pricingTitle, { color: colors.text }]}>Choose your plan</Text>

          {loadingProducts && (
            <View style={styles.loadingProducts}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.loadingProductsText, { color: colors.textMuted }]}>
                Loading plans…
              </Text>
            </View>
          )}

          {products.map((p) => {
            const selected = selectedSku === p.productId;
            const yearly = isYearly(p.productId);
            return (
              <Pressable
                key={p.productId}
                onPress={() => setSelectedSku(p.productId)}
                style={[
                  styles.planCard,
                  {
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? (isDark ? '#2A1F3D' : '#F5F3FF') : colors.surface,
                  },
                ]}
              >
                {yearly && (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.badgeText}>Save 30%</Text>
                  </View>
                )}
                <View style={styles.planRow}>
                  <View style={styles.radio}>
                    {selected && <View style={[styles.radioFill, { backgroundColor: colors.primary }]} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planName, { color: colors.text }]}>
                      {yearly ? 'Yearly' : 'Monthly'}
                    </Text>
                    <Text style={[styles.planSub, { color: colors.textMuted }]}>
                      {yearly ? 'Billed annually' : 'Billed monthly'}
                    </Text>
                  </View>
                  <Text style={[styles.planPrice, { color: colors.text }]}>{getPrice(p)}</Text>
                </View>
              </Pressable>
            );
          })}

          {products.length === 0 && !loadingProducts && Platform.OS !== 'web' && (
            <>
              {/* Fallback pricing until StoreKit loads on subscribe */}
              <Pressable
                onPress={() => setSelectedSku(SUBSCRIPTION_PRODUCTS[0])}
                style={[
                  styles.planCard,
                  {
                    borderColor: selectedSku === SUBSCRIPTION_PRODUCTS[0] ? colors.primary : colors.border,
                    backgroundColor: selectedSku === SUBSCRIPTION_PRODUCTS[0] ? (isDark ? '#2A1F3D' : '#F5F3FF') : colors.surface,
                  },
                ]}
              >
                <View style={styles.planRow}>
                  <View style={styles.radio}>
                    {selectedSku === SUBSCRIPTION_PRODUCTS[0] && <View style={[styles.radioFill, { backgroundColor: colors.primary }]} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planName, { color: colors.text }]}>Monthly</Text>
                    <Text style={[styles.planSub, { color: colors.textMuted }]}>Billed monthly</Text>
                  </View>
                  <Text style={[styles.planPrice, { color: colors.text }]}>$4.99/mo</Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => setSelectedSku(SUBSCRIPTION_PRODUCTS[1])}
                style={[
                  styles.planCard,
                  {
                    borderColor: selectedSku === SUBSCRIPTION_PRODUCTS[1] ? colors.primary : colors.border,
                    backgroundColor: selectedSku === SUBSCRIPTION_PRODUCTS[1] ? (isDark ? '#2A1F3D' : '#F5F3FF') : colors.surface,
                  },
                ]}
              >
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>Save 30%</Text>
                </View>
                <View style={styles.planRow}>
                  <View style={styles.radio}>
                    {selectedSku === SUBSCRIPTION_PRODUCTS[1] && <View style={[styles.radioFill, { backgroundColor: colors.primary }]} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planName, { color: colors.text }]}>Yearly</Text>
                    <Text style={[styles.planSub, { color: colors.textMuted }]}>Billed annually</Text>
                  </View>
                  <Text style={[styles.planPrice, { color: colors.text }]}>$39.99/yr</Text>
                </View>
              </Pressable>
            </>
          )}
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.ctaWrap}>
          <Pressable
            onPress={handleSubscribe}
            disabled={loading || !selectedSku}
            style={[styles.subscribeBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.subscribeText}>Subscribe Now</Text>
            )}
          </Pressable>

          <Pressable onPress={handleRestore} disabled={restoring} style={styles.restoreBtn}>
            {restoring ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.restoreText, { color: colors.primary }]}>Restore Purchases</Text>
            )}
          </Pressable>

          <Text style={[styles.terms, { color: colors.textMuted }]}>
            Subscriptions auto-renew. You can cancel anytime in your App Store settings.
          </Text>

          <Text style={[styles.legalHint, { color: colors.textMuted }]}>
            By continuing, you agree to our legal terms below.
          </Text>

          <View style={styles.legalLinksRow}>
            <Pressable onPress={() => openLink(privacyPolicyUrl)} hitSlop={8}>
              <Text style={[styles.legalLinkText, { color: colors.primary }]}>Privacy Policy</Text>
            </Pressable>
            <Text style={[styles.legalLinkSeparator, { color: colors.textMuted }]}>•</Text>
            <Pressable onPress={() => openLink(termsOfUseUrl)} hitSlop={8}>
              <Text style={[styles.legalLinkText, { color: colors.primary }]}>Terms of Use</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 },
  closeBtn: { padding: 6 },
  titleWrap: { alignItems: 'center', marginBottom: 24 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 15, textAlign: 'center' },
  featuresCard: { marginBottom: 24 },
  cardBg: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  featuresTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  featureText: { fontSize: 15, flex: 1 },
  pricingWrap: { marginBottom: 24 },
  pricingTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14 },
  loadingProducts: { alignItems: 'center', paddingVertical: 16, marginBottom: 8 },
  loadingProductsText: { fontSize: 14, marginTop: 8 },
  noProducts: { fontSize: 14, textAlign: 'center', marginBottom: 12 },
  planCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  planRow: { flexDirection: 'row', alignItems: 'center' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C4B5FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioFill: { width: 12, height: 12, borderRadius: 6 },
  planName: { fontSize: 16, fontWeight: '700' },
  planSub: { fontSize: 13, marginTop: 2 },
  planPrice: { fontSize: 16, fontWeight: '700' },
  ctaWrap: { marginTop: 4 },
  subscribeBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  subscribeText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  restoreBtn: { alignItems: 'center', paddingVertical: 8, marginBottom: 12 },
  restoreText: { fontSize: 15, fontWeight: '600' },
  terms: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  legalHint: { fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 4 },
  legalLinksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  legalLinkText: { fontSize: 13, fontWeight: '600' },
  legalLinkSeparator: { fontSize: 13, marginHorizontal: 10 },
});
