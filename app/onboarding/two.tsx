import { Link, router } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { storage } from '@/utils/storage';
import { SubscriptionService } from '@/services/SubscriptionService';

export default function OnboardingTwoScreen() {
  const { height, width } = useWindowDimensions();
  const compact = height < 760;
  const horizontalPadding = Math.max(22, Math.min(34, width * 0.07));
  const cardSize = Math.min(width * 0.56, compact ? 176 : 218);

  async function finishOnboarding() {
    await storage.setOnboardingComplete();
    await SubscriptionService.startTrialIfNeeded();
    router.replace('/pages/home/home');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.skipRow, { paddingHorizontal: horizontalPadding, paddingTop: compact ? 8 : 12 }]}>
        <Pressable onPress={finishOnboarding}>
          <Text style={styles.skipButton}>Skip</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: compact ? 24 : 32 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.progressLines, { paddingBottom: compact ? 18 : 28 }]}>
          <View style={styles.line} />
          <View style={styles.lineActive} />
          <View style={styles.line} />
          <View style={styles.line} />
        </View>

        <View style={[styles.hero, { minHeight: compact ? 240 : 300, marginBottom: compact ? 20 : 32 }]}>
          <View style={[styles.chartCard, { width: cardSize, height: cardSize, borderRadius: cardSize * 0.17 }]}>
            <View style={styles.barSmall} />
            <View style={styles.barMedium} />
            <View style={styles.barTall} />
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>✓</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statText}>−18%</Text>
          </View>
          <Text style={styles.scribbleOne}>⌁</Text>
          <Text style={styles.scribbleTwo}>✦</Text>
        </View>

        <View style={[styles.copy, { marginBottom: compact ? 18 : 28 }]}>
          <Text style={styles.kicker}>Track the pattern</Text>
          <Text style={[styles.title, { fontSize: compact ? 36 : 44, lineHeight: compact ? 38 : 46 }]}>See what pulls you in</Text>
          <Text style={[styles.description, { fontSize: compact ? 15 : 17, lineHeight: compact ? 22 : 25 }]}>Review triggers, streaks, and weekly trends so your progress becomes easy to understand.</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingHorizontal: horizontalPadding, paddingTop: compact ? 12 : 16, paddingBottom: compact ? 20 : 28 }]}>
        <Text style={styles.step}>02 of 04</Text>
        <Link href="/onboarding/three" style={styles.button}>Next</Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFF8D8' },
  skipRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  skipButton: { fontSize: 14, fontWeight: '700', color: '#1A1A18', opacity: 0.55, paddingVertical: 8 },
  scrollContent: { paddingBottom: 40 },
  progressLines: { flexDirection: 'row', gap: 10, paddingTop: 20 },
  lineActive: { flex: 1, height: 3, borderRadius: 2, backgroundColor: '#1A1A18' },
  line: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(26,26,24,0.18)' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chartCard: { width: 210, height: 210, borderRadius: 36, backgroundColor: '#FAF9F6', borderWidth: 4, borderColor: '#1A1A18', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 16, paddingBottom: 34 },
  barSmall: { width: 34, height: 72, borderRadius: 17, backgroundColor: '#1A1A18' },
  barMedium: { width: 34, height: 116, borderRadius: 17, backgroundColor: '#5FDDaa', borderWidth: 3, borderColor: '#1A1A18' },
  barTall: { width: 34, height: 148, borderRadius: 17, backgroundColor: '#FFAA33', borderWidth: 3, borderColor: '#1A1A18' },
  badge: { position: 'absolute', right: 38, top: 110, width: 70, height: 70, borderRadius: 35, backgroundColor: '#1A1A18', alignItems: 'center', justifyContent: 'center' },
  badgeIcon: { color: '#FFFFFF', fontSize: 38, fontWeight: '900' },
  statPill: { position: 'absolute', left: 22, bottom: 116, backgroundColor: '#FAF9F6', borderWidth: 3, borderColor: '#1A1A18', borderRadius: 26, paddingVertical: 10, paddingHorizontal: 18 },
  statText: { fontSize: 18, fontWeight: '900', color: '#1A1A18' },
  scribbleOne: { position: 'absolute', right: 32, bottom: 92, fontSize: 46, color: '#1A1A18' },
  scribbleTwo: { position: 'absolute', left: 44, top: 116, fontSize: 34, color: '#1A1A18' },
  copy: { marginBottom: 26 },
  kicker: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.8, color: '#1A1A18', opacity: 0.55, fontWeight: '900', marginBottom: 10 },
  title: { fontSize: 44, lineHeight: 46, fontWeight: '900', color: '#1A1A18', letterSpacing: -2.2, marginBottom: 14 },
  description: { fontSize: 17, lineHeight: 25, color: '#1A1A18', opacity: 0.75 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10 },
  step: { fontSize: 12, color: '#1A1A18', opacity: 0.55, fontWeight: '800' },
  button: { backgroundColor: '#1A1A18', color: '#FFFFFF', fontSize: 15, fontWeight: '900', paddingVertical: 16, paddingHorizontal: 42, borderRadius: 28, overflow: 'hidden' },
});
