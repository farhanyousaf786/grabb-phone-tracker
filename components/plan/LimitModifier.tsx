import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { getLimitLevelLabel, getLimitLevelColor } from '@/utils/level';

interface LimitModifierProps {
  limit: number;
  setLimit: React.Dispatch<React.SetStateAction<number>>;
  originalLimit: number;
  saveLimit: () => Promise<void>;
}

export const LimitModifier: React.FC<LimitModifierProps> = ({
  limit,
  setLimit,
  originalLimit,
  saveLimit,
}) => {
  const { colors, isDark } = useTheme();
  const isDirty = limit !== originalLimit;

  return (
    <View>
      <Animated.Text entering={FadeInUp.delay(380)} style={[styles.sectionHeading, { color: colors.textMuted }]}>
        TARGET CALIBRATION
      </Animated.Text>

      <Animated.View entering={FadeInUp.delay(400)} style={[styles.card, { backgroundColor: colors.surface, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={[styles.sectionLabel, { color: colors.text, marginBottom: 0, marginRight: 8 }]}>Daily grab Ceiling</Text>
              <Pressable onPress={() => {
                Alert.alert(
                  "Level Ranges",
                  "1-99: Light awareness\n100-199: Moderate habit\n200-299: Strong habit\n300-399: Heavy habit\n400+: Compulsive habit",
                  [{ text: "Got it" }]
                );
              }} hitSlop={10}>
                <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>Info</Text>
              </Pressable>
            </View>
            <Text style={[styles.muted, { color: colors.textMuted }]}>Adjust daily limit constraints. Roadmap updates automatically.</Text>
          </View>
          <View style={[styles.levelBadge, { backgroundColor: getLimitLevelColor(limit), marginTop: 0 }]}>
            <Text style={styles.levelBadgeText}>{getLimitLevelLabel(limit)}</Text>
          </View>
        </View>
        
        <View style={styles.limitRow}>
          <Pressable 
            style={({ pressed }) => [
              styles.limitButton, 
              { 
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }]
              }
            ]} 
            onPress={() => setLimit(prev => Math.max(5, prev - 5))}
          >
            <Ionicons name="remove-sharp" size={20} color={colors.text} />
          </Pressable>
          
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.limitValue, { color: colors.text, flex: 0 }]}>{limit}</Text>
          </View>
          
          <Pressable 
            style={({ pressed }) => [
              styles.limitButton, 
              { 
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }]
              }
            ]} 
            onPress={() => setLimit(prev => prev + 5)}
          >
            <Ionicons name="add-sharp" size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* Slide-In Glowing Save Button */}
        {isDirty && (
          <Animated.View 
            entering={FadeInUp.duration(200)} 
            exiting={FadeOutDown.duration(150)}
            style={styles.saveContainer}
          >
            <Pressable 
              style={({ pressed }) => [
                styles.saveButton, 
                { 
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }]
                }
              ]}
              onPress={saveLimit}
            >
              <Ionicons name="shield-checkmark-sharp" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.saveButtonText}>Apply new Limit</Text>
            </Pressable>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeading: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10, marginTop: 14 },
  card: { borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.015, shadowRadius: 8, elevation: 1 },
  sectionLabel: { fontSize: 12, fontWeight: '900', marginBottom: 4 },
  muted: { fontSize: 11.5, marginBottom: 18, fontWeight: '600', lineHeight: 16 },
  limitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  limitButton: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  limitValue: { flex: 1, textAlign: 'center', fontSize: 38, fontWeight: '900', letterSpacing: -1 },
  levelBadge: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  levelBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  saveContainer: {
    marginTop: 18,
    width: '100%',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
