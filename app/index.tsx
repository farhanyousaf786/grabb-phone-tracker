import { useRouter } from 'expo-router';
import { useEffect } from 'react';
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

      // Start trial on first open after onboarding
      await SubscriptionService.startTrialIfNeeded();

      router.replace('/pages/home/home');
    }

    checkEntry();
  }, []);

  return null;
}
