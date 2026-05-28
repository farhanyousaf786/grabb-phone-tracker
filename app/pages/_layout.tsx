import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useTheme } from '@/context/ThemeContext';

export default function TabsLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          height: 84,
          paddingBottom: 26,
          paddingTop: 10,
          borderTopWidth: 0,
          backgroundColor: isDark ? '#0A061E' : '#EDE9FE',
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home/home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="radio-button-on" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="progress/progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="plan/plan"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color, size }) => <Ionicons name="ellipse-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="badges/badges" options={{ href: null }} />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="settings/settings" options={{ href: null }} />
      <Tabs.Screen name="analytics/analytics" options={{ href: null }} />
      <Tabs.Screen name="profile/profile" options={{ href: null }} />
    </Tabs>
  );
}
