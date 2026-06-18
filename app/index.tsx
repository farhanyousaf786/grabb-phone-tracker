import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { storage } from '@/utils/storage';
import { SubscriptionService } from '@/services/SubscriptionService';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    async function checkEntry() {
      const complete = await storage.getOnboardingComplete();
      if (!complete) {
        router.replace('/onboarding/one');
        return;
      }

      await SubscriptionService.startTrialIfNeeded();
      router.replace('/pages/home/home');
    }

    checkEntry().finally(() => {
      SplashScreen.hideAsync().catch(() => {});
    });
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/logo/appLogo_clean.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F8FA',
  },
  logo: {
    width: 180,
    height: 180,
  },
});
