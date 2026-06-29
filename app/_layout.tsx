import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';

import { ThemeProvider } from '@/context/ThemeContext';
import { NotificationService } from '@/services/NotificationService';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    NotificationService.init().then(() => {
      NotificationService.requestPermissions();
    });

    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      NotificationService.saveToHistory(notification);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const type = response.notification.request.content.data?.type;
      NotificationService.saveToHistory(response.notification);

      if (type) {
        if (type === 'approaching_limit' || type === 'limit_exceeded') {
          router.push('/pages/progress/progress');
        } else if (type === 'streak_at_risk' || type === 'morning_checkin' || type === 'evening_checkin' || type === 'goal_reminder') {
          router.push('/pages/home/home');
        } else if (type === 'focus_block_start' || type === 'focus_block_end' || type === 'plan_changed') {
          router.push('/pages/plan/plan');
        }
      }
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="pages" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
