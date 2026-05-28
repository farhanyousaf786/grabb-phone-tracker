import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { storage } from '@/utils/storage';

export default function Index() {
  const [route, setRoute] = useState<'/onboarding/one' | '/pages/home/home' | null>(null);

  useEffect(() => {
    async function checkOnboarding() {
      const complete = await storage.getOnboardingComplete();
      setRoute(complete ? '/pages/home/home' : '/onboarding/one');
    }

    checkOnboarding();
  }, []);

  if (!route) {
    return null;
  }

  return <Redirect href={route} />;
}
