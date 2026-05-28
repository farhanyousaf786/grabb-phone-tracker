import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeIn, 
  FadeOut, 
  ZoomIn, 
  ZoomOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';

interface HonestyModalProps {
  visible: boolean;
  onClose: () => void;
}

export const HonestyModal: React.FC<HonestyModalProps> = ({ visible, onClose }) => {
  const { colors, isDark } = useTheme();
  const [shouldRender, setShouldRender] = React.useState(visible);

  // Pulse animation for the warning shield icon
  const pulseValue = useSharedValue(1);

  React.useEffect(() => {
    if (visible) {
      setShouldRender(true);
      pulseValue.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800 }),
          withTiming(1.0, { duration: 800 })
        ),
        -1, // Loop infinitely
        true
      );
    } else {
      const timer = setTimeout(() => setShouldRender(false), 120);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  if (!shouldRender) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View 
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={[
          styles.overlay, 
          { backgroundColor: isDark ? 'rgba(8, 5, 24, 0.85)' : 'rgba(240, 237, 232, 0.85)' }
        ]}
      >
        <Animated.View 
          entering={ZoomIn.duration(200)}
          exiting={ZoomOut.duration(150)}
          style={[
            styles.card, 
            { 
              backgroundColor: colors.surface, 
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' 
            }
          ]}
        >
          {/* Animated Warning Icon with Glow */}
          <Animated.View style={[styles.iconContainer, pulseStyle]}>
            <View style={[styles.glowRing, { backgroundColor: isDark ? 'rgba(255, 92, 92, 0.15)' : 'rgba(255, 92, 92, 0.1)' }]}>
              <Ionicons 
                name="shield-half-sharp" 
                size={42} 
                color={colors.danger || '#FF5C5C'} 
              />
            </View>
          </Animated.View>

          {/* Dialog Text content */}
          <Text style={[styles.title, { color: colors.text }]}>Track Honestly</Text>
          
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Hey! Be honest with yourself, you can't do that!
          </Text>

          {/* Action button without sharp black lines */}
          <Pressable 
            onPress={onClose}
            style={({ pressed }) => [
              styles.button, 
              { 
                backgroundColor: colors.primary,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }]
              }
            ]}
          >
            <Text style={styles.buttonText}>Got it</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  button: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
