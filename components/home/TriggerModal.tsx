import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TRIGGERS, TRIGGER_EMOJI, TriggerName } from '@/constants/mockData';

interface TriggerModalProps {
  visible: boolean;
  title?: string;
  subtitle?: React.ReactNode | string;
  onSelect: (trigger: TriggerName) => void;
  onClose: () => void;
}

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

export const TriggerModal: React.FC<TriggerModalProps> = ({ visible, title, subtitle, onSelect, onClose }) => {
  const { colors, isDark } = useTheme();
  const [shouldRender, setShouldRender] = React.useState(visible);

  // Floating continuous loop animation for the question mark icon
  const floatValue = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      setShouldRender(true);
      // Start floating loop
      floatValue.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 1600 }),
          withTiming(0, { duration: 1600 })
        ),
        -1, // Loop infinitely
        true // Reverse direction
      );
    } else {
      const timer = setTimeout(() => setShouldRender(false), 120);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatValue.value }],
  }));

  if (!shouldRender) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View 
        entering={FadeIn.duration(120)} 
        exiting={FadeOut.duration(100)} 
        style={styles.reviewOverlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        
        <Animated.View 
          entering={ZoomIn.springify().damping(11).mass(0.55)} 
          exiting={ZoomOut.duration(100)}
          style={[styles.reviewDialog, { backgroundColor: colors.surface }]}
        >
          {/* Animated floating Question Mark (Caution query icon) */}
          <Animated.View 
            style={[
              styles.floatingIconContainer, 
              floatStyle, 
              { backgroundColor: colors.primary, borderColor: colors.surface }
            ]}
          >
            <Ionicons name="help-sharp" size={24} color="#FFFFFF" />
          </Animated.View>

          <Text style={[styles.triggerHeading, { color: colors.text }]}>{title || 'What triggered this?'}</Text>
          <Text style={[styles.triggerSubheading, { color: colors.textMuted }]}>{subtitle || 'Select the pattern that pulled you in.'}</Text>
          
          <View style={styles.triggerGrid}>
            {TRIGGERS.map((trigger) => (
              <Pressable 
                key={trigger} 
                style={[
                  styles.triggerChip, 
                  { 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', 
                    borderColor: colors.border 
                  }
                ]} 
                onPress={() => onSelect(trigger)}
              >
                <Text style={[styles.triggerText, { color: colors.text }]}>{trigger}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  reviewOverlay: { flex: 1, backgroundColor: 'rgba(15,15,13,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  reviewDialog: { width: 320, borderRadius: 24, padding: 24, paddingTop: 36, alignItems: 'center', position: 'relative' },
  floatingIconContainer: {
    position: 'absolute',
    top: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4
  },
  triggerHeading: { fontSize: 18, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
  triggerSubheading: { fontSize: 12, textAlign: 'center', marginTop: 6, marginBottom: 20, fontWeight: '500' },
  triggerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', width: '100%' },
  triggerChip: { 
    width: '47%', 
    borderRadius: 14, 
    paddingVertical: 14, 
    paddingHorizontal: 8,
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  triggerText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  skipButton: { marginTop: 20, paddingVertical: 6, paddingHorizontal: 12 },
  triggerSkip: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
});
