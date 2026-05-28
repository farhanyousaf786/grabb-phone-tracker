import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Tip {
  icon: string;
  title: string;
  body: string;
}

interface DailyTipProps {
  tip: Tip;
}

import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '@/context/ThemeContext';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  FadeOutLeft
} from 'react-native-reanimated';

interface DailyTipProps {
  tip: Tip;
  onDismiss: () => void;
}

export const DailyTip: React.FC<DailyTipProps> = ({ tip, onDismiss }) => {
  const { colors, isDark } = useTheme();
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      opacity.value = 1 - Math.abs(event.translationX) / 300;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > 120 || Math.abs(event.velocityX) > 500) {
        // Swipe to dismiss
        const direction = event.translationX > 0 ? 1 : -1;
        translateX.value = withTiming(500 * direction, { duration: 200 }, () => {
          runOnJS(onDismiss)();
        });
      } else {
        // Snap back
        translateX.value = withSpring(0);
        opacity.value = withSpring(1);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>
        <LinearGradient 
          colors={colors.dailyTipGradient} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }} 
          style={styles.tipCard}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.tipIcon}>{tip.icon}</Text>
          </View>
          <View style={styles.tipBodyWrap}>
            <Text style={styles.tipLabel}>TIP OF THE DAY</Text>
            <Text style={styles.tipTitle}>{tip.title}</Text>
            <Text style={styles.tipBody}>{tip.body}</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  tipCard: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 20,
    gap: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tipIcon: { fontSize: 24 },
  tipBodyWrap: { flex: 1 },
  tipLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 },
  tipTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginBottom: 6, letterSpacing: -0.5 },
  tipBody: { fontSize: 13, lineHeight: 20, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
});
