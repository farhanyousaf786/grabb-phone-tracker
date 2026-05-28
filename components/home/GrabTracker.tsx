import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { CircularProgress } from './CircularProgress';
import { useTheme } from '@/context/ThemeContext';

interface GrabTrackerProps {
  count: number;
  limit: number;
  statusColor: string;
  onAdd: () => void;
  onRemove: () => void;
  isCalibrating?: boolean;
  calibrationDay?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const GrabTracker: React.FC<GrabTrackerProps> = ({ 
  count, 
  limit, 
  statusColor, 
  onAdd, 
  onRemove,
  isCalibrating = false,
  calibrationDay = 1
}) => {
  const { colors, isDark } = useTheme();
  const plusScale = useSharedValue(1);
  const minusScale = useSharedValue(1);

  const plusStyle = useAnimatedStyle(() => ({
    transform: [{ scale: plusScale.value }],
  }));

  const minusStyle = useAnimatedStyle(() => ({
    transform: [{ scale: minusScale.value }],
  }));

  const progress = Math.min(count / limit, 1);

  return (
    <View style={styles.container}>
      {/* Central Circular progress HUD */}
      <View style={styles.countContainer}>
        <CircularProgress 
          size={180} 
          strokeWidth={14} 
          progress={progress} 
          color={statusColor} 
          count={count} 
          limit={limit} 
          isCalibrating={isCalibrating}
          calibrationDay={calibrationDay}
        />
      </View>

      {/* Futuristic Branded keycap buttons */}
      <View style={styles.buttonRow}>
        <AnimatedPressable 
          style={[
            styles.minusButton, 
            { 
              backgroundColor: colors.surface, 
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' 
            },
            minusStyle
          ]} 
          onPress={onRemove}
          onPressIn={() => { minusScale.value = withSpring(0.92, { damping: 10, stiffness: 200 }); }}
          onPressOut={() => { minusScale.value = withSpring(1, { damping: 10, stiffness: 200 }); }}
        >
          <Ionicons name="remove-sharp" size={24} color={colors.text} />
        </AnimatedPressable>
        
        <AnimatedPressable 
          style={[
            styles.plusButton, 
            { 
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
            },
            plusStyle
          ]} 
          onPress={onAdd}
          onPressIn={() => { plusScale.value = withSpring(0.92, { damping: 10, stiffness: 200 }); }}
          onPressOut={() => { plusScale.value = withSpring(1, { damping: 10, stiffness: 200 }); }}
        >
          <Ionicons name="add-sharp" size={24} color="#FFFFFF" />
        </AnimatedPressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 14, width: '100%' },
  countContainer: { 
    alignItems: 'center', 
    width: '100%',
    marginBottom: 20
  },
  buttonRow: { flexDirection: 'row', gap: 20, alignItems: 'center' },
  minusButton: { 
    width: 58, 
    height: 58, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  plusButton: { 
    width: 58, 
    height: 58, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
});
