import { Link, router } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { storage } from '@/utils/storage';
import { SubscriptionService } from '@/services/SubscriptionService';

export default function OnboardingOneScreen() {
  const { height, width } = useWindowDimensions();
  const compact = height < 760;
  const horizontalPadding = Math.max(22, Math.min(34, width * 0.07));
  const heroSize = Math.min(width * 0.48, compact ? 138 : 170);
  const phoneHeight = heroSize * 1.58;

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
          <View style={styles.lineActive} />
          <View style={styles.line} />
          <View style={styles.line} />
          <View style={styles.line} />
        </View>

        <View style={[styles.hero, { minHeight: compact ? 240 : 300, marginBottom: compact ? 20 : 32 }]}>
          <View style={[styles.phone, { width: heroSize, height: phoneHeight, borderRadius: heroSize * 0.2 }]}>
            <View style={styles.phoneTop} />
            <View style={[styles.screenCard, { width: heroSize * 0.7, height: heroSize * 0.7, borderRadius: heroSize * 0.16 }]}>
              <Text style={[styles.screenNumber, { fontSize: compact ? 42 : 52 }]}>12</Text>
              <Text style={styles.screenLabel}>grabs</Text>
            </View>
          </View>
          <View style={styles.bubbleOne}><Text style={styles.bubbleText}>tap</Text></View>
          <View style={styles.bubbleTwo}><Text style={styles.bubbleText}>pause</Text></View>
          <Text style={styles.scribbleOne}>⌁</Text>
          <Text style={styles.scribbleTwo}>✦</Text>
        </View>

        <View style={[styles.copy, { marginBottom: compact ? 18 : 28 }]}>
          <Text style={styles.kicker}>Awareness first</Text>
          <Text style={[styles.title, { fontSize: compact ? 36 : 44, lineHeight: compact ? 38 : 46 }]}>Notice every phone pickup</Text>
          <Text style={[styles.description, { fontSize: compact ? 15 : 17, lineHeight: compact ? 22 : 25 }]}>Quickly log each grab so you can understand when and why you reach for your phone.</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingHorizontal: horizontalPadding, paddingTop: compact ? 12 : 16, paddingBottom: compact ? 20 : 28 }]}>
        <Text style={styles.step}>01 of 04</Text>
        <Link href="/onboarding/two" style={styles.button}>Next</Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3D7D0' },
  skipRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  skipButton: { fontSize: 14, fontWeight: '700', color: '#1A1A18', opacity: 0.55, paddingVertical: 8 },
  scrollContent: { paddingBottom: 40 },
  progressLines: { flexDirection: 'row', gap: 10, paddingTop: 20 },
  lineActive: { flex: 1, height: 3, borderRadius: 2, backgroundColor: '#1A1A18' },
  line: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(26,26,24,0.18)' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  phone: { backgroundColor: '#1A1A18', padding: 16, alignItems: 'center', transform: [{ rotate: '-8deg' }] },
  phoneTop: { width: 54, height: 5, borderRadius: 4, backgroundColor: '#FAF9F6', opacity: 0.7, marginBottom: 36 },
  screenCard: { width: 118, height: 118, borderRadius: 28, backgroundColor: '#FAF9F6', alignItems: 'center', justifyContent: 'center' },
  screenNumber: { fontSize: 52, fontWeight: '900', color: '#1A1A18', letterSpacing: -2 },
  screenLabel: { fontSize: 13, color: '#1A1A18', opacity: 0.7 },
  bubbleOne: { position: 'absolute', top: 92, left: 12, backgroundColor: '#FAF9F6', borderWidth: 3, borderColor: '#1A1A18', borderRadius: 24, paddingVertical: 10, paddingHorizontal: 18 },
  bubbleTwo: { position: 'absolute', bottom: 102, right: 8, backgroundColor: '#5FDDaa', borderWidth: 3, borderColor: '#1A1A18', borderRadius: 24, paddingVertical: 10, paddingHorizontal: 18 },
  bubbleText: { fontSize: 14, fontWeight: '900', color: '#1A1A18' },
  scribbleOne: { position: 'absolute', left: 34, bottom: 172, fontSize: 48, color: '#1A1A18' },
  scribbleTwo: { position: 'absolute', right: 44, top: 128, fontSize: 34, color: '#1A1A18' },
  copy: { marginBottom: 26 },
  kicker: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.8, color: '#1A1A18', opacity: 0.55, fontWeight: '900', marginBottom: 10 },
  title: { fontSize: 44, lineHeight: 46, fontWeight: '900', color: '#1A1A18', letterSpacing: -2.2, marginBottom: 14 },
  description: { fontSize: 17, lineHeight: 25, color: '#1A1A18', opacity: 0.75 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10 },
  step: { fontSize: 12, color: '#1A1A18', opacity: 0.55, fontWeight: '800' },
  button: { backgroundColor: '#1A1A18', color: '#FFFFFF', fontSize: 15, fontWeight: '900', paddingVertical: 16, paddingHorizontal: 42, borderRadius: 28, overflow: 'hidden' },
});
