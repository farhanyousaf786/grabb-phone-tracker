import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Modal, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { storage, PlanConfig } from '@/utils/storage';
import { NotificationService } from '@/services/NotificationService';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';

interface PlanSelectorProps {
  onPlanChanged: () => void;
  onClose: () => void;
  planConfig: PlanConfig;
}

export const PlanSelector: React.FC<PlanSelectorProps> = ({ onPlanChanged, onClose, planConfig }) => {
  const { colors, isDark } = useTheme();
  
  const [selectedType, setSelectedType] = useState<PlanConfig['planType']>(planConfig.planType);
  const [isEditing, setIsEditing] = useState(false);
  
  // Custom week limits inputs
  const [p1, setP1] = useState(planConfig.phase1Limit.toString());
  const [p2, setP2] = useState(planConfig.phase2Limit.toString());
  const [p3, setP3] = useState(planConfig.phase3Limit.toString());
  const [p4, setP4] = useState(planConfig.phase4Limit.toString());

  useEffect(() => {
    setSelectedType(planConfig.planType);
    setP1(planConfig.phase1Limit.toString());
    setP2(planConfig.phase2Limit.toString());
    setP3(planConfig.phase3Limit.toString());
    setP4(planConfig.phase4Limit.toString());
  }, [planConfig]);

  const selectPredefined = (type: 'easy' | 'moderate' | 'hard') => {
    setSelectedType(type);
  };

  const handleConfirmAndApply = async () => {
    if (selectedType !== 'custom') {
      let config: PlanConfig;
      if (selectedType === 'easy') {
        config = { planType: 'easy', phase1Limit: 45, phase2Limit: 40, phase3Limit: 35, phase4Limit: 30 };
      } else if (selectedType === 'moderate') {
        config = { planType: 'moderate', phase1Limit: 40, phase2Limit: 30, phase3Limit: 20, phase4Limit: 10 };
      } else {
        config = { planType: 'hard', phase1Limit: 25, phase2Limit: 20, phase3Limit: 15, phase4Limit: 10 };
      }
      await storage.setPlanConfig(config);
      await NotificationService.schedulePlanChanged(selectedType, config.phase1Limit);
      onPlanChanged();
    } else {
      // For custom, it is saved when 'Apply Config' is clicked in the custom modal. 
      // But we can re-trigger onPlanChanged to be safe.
      onPlanChanged();
    }
    onClose();
  };

  const handleCustomSave = async () => {
    const config: PlanConfig = {
      planType: 'custom',
      phase1Limit: Math.max(5, parseInt(p1, 10) || 40),
      phase2Limit: Math.max(5, parseInt(p2, 10) || 30),
      phase3Limit: Math.max(5, parseInt(p3, 10) || 20),
      phase4Limit: Math.max(5, parseInt(p4, 10) || 10),
    };
    await storage.setPlanConfig(config);
    await NotificationService.schedulePlanChanged('custom', config.phase1Limit);
    setSelectedType('custom');
    setIsEditing(false);
    onPlanChanged();
  };

  const getPlanIcon = (type: PlanConfig['planType']) => {
    if (type === 'easy') return 'leaf-sharp';
    if (type === 'moderate') return 'compass-sharp';
    if (type === 'hard') return 'nuclear-sharp';
    return 'construct-sharp';
  };

  const getPlanColor = (type: PlanConfig['planType']) => {
    if (type === 'easy') return '#34D399';
    if (type === 'moderate') return colors.primary;
    if (type === 'hard') return '#EF4444';
    return '#A78BFA';
  };

  // Educational explanations about why they are reducing grabs
  const getPlanSlogan = (type: PlanConfig['planType']) => {
    if (type === 'easy') return 'MINDFUL TAPER PROTOCOL';
    if (type === 'moderate') return 'BALANCED RESET PROTOCOL';
    if (type === 'hard') return 'RADICAL DETOX PROTOCOL';
    return 'BESPOKE TUNING PROFILE';
  };

  const getPlanDescription = (type: PlanConfig['planType']) => {
    if (type === 'easy') {
      return 'Allows a comfortable, low-stress ceiling to gradually smooth out grab impulses. Starts at 45 grabs/day and slowly tapers down to 30. Perfect for building dynamic self-awareness without withdrawal fatigue.';
    }
    if (type === 'moderate') {
      return 'Our recommended neuro-tapering syllabus. Designed to steadily down-regulate dopamine pathways by tapering from 40 daily ceiling grabs down to a clean 10. Reclaims focus and cognitive freedom.';
    }
    if (type === 'hard') {
      return 'An aggressive behavioral detox program. Starts extremely strict at 25 grabs/day and drops rapidly to 10 grabs/day. Best for high-performers ready to immediately shatter digital dependencies.';
    }
    return 'A fully customized digital discipline program tailored exclusively to your personal behavioral parameters. Calibrated specifically for your unique target thresholds.';
  };

  const getPlanStartLimit = (type: PlanConfig['planType']) => {
    if (type === 'easy') return '45';
    if (type === 'moderate') return '40';
    if (type === 'hard') return '25';
    return p1;
  };

  const getPlanEndLimit = (type: PlanConfig['planType']) => {
    if (type === 'easy') return '30';
    if (type === 'moderate') return '10';
    if (type === 'hard') return '10';
    return p4;
  };

  const getPlanEncouragement = (type: PlanConfig['planType']) => {
    if (type === 'easy') return 'Great for a gentle transition. Every saved grab reclaims roughly 15 minutes of deep focus!';
    if (type === 'moderate') return 'The golden path to mindfulness. Tapers gradually to allow organic dopamine resets.';
    if (type === 'hard') return 'Highly intense! Enforces strict trigger awareness. Perfect for taking back your time today.';
    return 'Your custom parameters are locked in. A bespoke protocol designed by you, for you.';
  };

  const activePlanColor = getPlanColor(selectedType);

  return (
    <View style={styles.container}>
      {/* Preset toggles header */}
      <Text style={[styles.heading, { color: colors.textMuted }]}>SELECT MISSION PROTOCOL</Text>

      {/* Preset grid buttons */}
      <View style={styles.presetRow}>
        {(['easy', 'moderate', 'hard'] as const).map((type) => {
          const isSelected = selectedType === type;
          const activeColor = getPlanColor(type);
          
          return (
            <Pressable
              key={type}
              style={({ pressed }) => [
                styles.presetCell,
                { 
                  backgroundColor: isSelected ? activeColor + '12' : colors.surface,
                  borderColor: isSelected ? activeColor : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                  opacity: pressed ? 0.9 : 1
                }
              ]}
              onPress={() => selectPredefined(type)}
            >
              <View style={[styles.presetIconContainer, { backgroundColor: activeColor + '1C' }]}>
                <Ionicons name={getPlanIcon(type)} size={16} color={activeColor} />
              </View>
              <Text style={[styles.presetText, { color: isSelected ? colors.text : colors.textMuted }]}>
                {type.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Custom limits keycap toggler */}
      <Pressable
        onPress={() => setIsEditing(true)}
        style={({ pressed }) => [
          styles.customBtn,
          { 
            backgroundColor: selectedType === 'custom' ? colors.primary + '12' : colors.surface,
            borderColor: selectedType === 'custom' ? colors.primary : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
            opacity: pressed ? 0.9 : 1
          }
        ]}
      >
        <Ionicons name={selectedType === 'custom' ? 'options-sharp' : 'options-outline'} size={16} color={colors.primary} />
        <Text style={[styles.customBtnText, { color: colors.text }]}>
          {selectedType === 'custom' ? 'CUSTOM PROTOCOL (ACTIVE)' : 'CUSTOMIZE WEEK LIMITS'}
        </Text>
        <Ionicons name="chevron-forward-sharp" size={12} color={colors.textMuted} />
      </Pressable>

      {/* DYNAMIC PROTOCOL BRIEFING PANEL */}
      <Animated.View 
        entering={FadeIn.duration(220)} 
        style={[
          styles.briefCard, 
          { 
            backgroundColor: activePlanColor + '08', 
            borderColor: activePlanColor + '30',
          }
        ]}
      >
        <View style={styles.briefHeader}>
          <Ionicons name={getPlanIcon(selectedType)} size={18} color={activePlanColor} />
          <Text style={[styles.briefSlogan, { color: activePlanColor }]}>
            {getPlanSlogan(selectedType)}
          </Text>
        </View>
        
        <Text style={[styles.briefDesc, { color: colors.text, lineHeight: 18 }]}>
          {getPlanDescription(selectedType)}
        </Text>

        {/* Dynamic Targets summary statistics */}
        <View style={[styles.briefIndicatorRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
          <View style={styles.briefStat}>
            <Text style={[styles.briefStatLabel, { color: colors.textMuted }]}>START LIMIT</Text>
            <Text style={[styles.briefStatVal, { color: colors.text }]}>
              {getPlanStartLimit(selectedType)} grabs/day
            </Text>
          </View>
          
          <View style={[styles.briefStatDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]} />
          
          <View style={styles.briefStat}>
            <Text style={[styles.briefStatLabel, { color: colors.textMuted }]}>FINAL TARGET</Text>
            <Text style={[styles.briefStatVal, { color: activePlanColor }]}>
              {getPlanEndLimit(selectedType)} grabs/day
            </Text>
          </View>
        </View>

        {/* Educational bullet tip callout */}
        <Text style={[styles.encouragementText, { color: colors.textMuted }]}>
          💡 <Text style={{ fontWeight: '800', color: colors.text }}>Tip: </Text>
          {getPlanEncouragement(selectedType)}
        </Text>
      </Animated.View>

      <Pressable
        style={({ pressed }) => [
          styles.confirmStrategyBtn,
          {
            backgroundColor: colors.primary,
            opacity: pressed ? 0.9 : 1
          }
        ]}
        onPress={handleConfirmAndApply}
      >
        <Text style={styles.confirmStrategyBtnText}>Confirm & Apply Strategy</Text>
      </Pressable>

      {/* CUSTOM PROTOCOL MODAL EDITOR */}
      <Modal
        visible={isEditing}
        transparent
        animationType="none"
        onRequestClose={() => setIsEditing(false)}
      >
        <Animated.View 
          entering={FadeIn.duration(180)} 
          exiting={FadeOut.duration(140)} 
          style={[
            styles.modalOverlay,
            { backgroundColor: isDark ? 'rgba(8, 5, 24, 0.85)' : 'rgba(240, 237, 232, 0.85)' }
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsEditing(false)} />
          
          <Animated.View 
            entering={ZoomIn.duration(200)} 
            exiting={ZoomOut.duration(150)}
            style={[
              styles.modalDialog, 
              { 
                backgroundColor: colors.surface,
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
              }
            ]}
          >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Ionicons name="construct-sharp" size={20} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>CUSTOMIZE CEILING LIMITS</Text>
              </View>
              <Text style={[styles.modalDesc, { color: colors.textMuted }]}>
                Tune the maximum daily grab threshold for each 2-week block in your roadmap. A daily limit enforces a constant, healthy tape-down rate.
              </Text>

              {/* Custom week inputs */}
              <View style={styles.inputGrid}>
                {[
                  { label: 'Wk 1–2 Daily Limit', state: p1, setState: setP1 },
                  { label: 'Wk 3–4 Daily Limit', state: p2, setState: setP2 },
                  { label: 'Wk 5–6 Daily Limit', state: p3, setState: setP3 },
                  { label: 'Wk 7–8 Daily Limit', state: p4, setState: setP4 },
                ].map((item, index) => (
                  <View key={item.label} style={styles.inputRow}>
                    <View style={styles.labelContainer}>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>{item.label}</Text>
                      <Text style={[styles.inputLabelSub, { color: colors.textMuted }]}>Max grabs per day</Text>
                    </View>
                    <View style={styles.stepperContainer}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.stepBtn,
                          { 
                            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                            opacity: pressed ? 0.8 : 1,
                            transform: [{ scale: pressed ? 0.92 : 1 }]
                          }
                        ]}
                        onPress={() => {
                          const currentVal = parseInt(item.state, 10) || 0;
                          item.setState(Math.max(5, currentVal - 5).toString());
                        }}
                      >
                        <Ionicons name="remove-sharp" size={14} color={colors.text} />
                      </Pressable>

                      <TextInput
                        style={[
                          styles.textInput, 
                          { 
                            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                            color: colors.text,
                            borderColor: colors.border
                          }
                        ]}
                        value={item.state}
                        onChangeText={item.setState}
                        keyboardType="numeric"
                        maxLength={3}
                      />

                      <Pressable
                        style={({ pressed }) => [
                          styles.stepBtn,
                          { 
                            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                            opacity: pressed ? 0.8 : 1,
                            transform: [{ scale: pressed ? 0.92 : 1 }]
                          }
                        ]}
                        onPress={() => {
                          const currentVal = parseInt(item.state, 10) || 0;
                          item.setState((currentVal + 5).toString());
                        }}
                      >
                        <Ionicons name="add-sharp" size={14} color={colors.text} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>

            <View style={styles.actionRow}>
              <Pressable
                onPress={() => setIsEditing(false)}
                style={({ pressed }) => [
                  styles.cancelBtn,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', opacity: pressed ? 0.8 : 1 }
                ]}
              >
                <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
              
              <Pressable
                onPress={handleCustomSave}
                style={({ pressed }) => [
                  styles.saveBtn,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }
                ]}
              >
                <Text style={styles.saveBtnText}>Apply Config</Text>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  heading: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  presetCell: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  presetIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  customBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  customBtnText: {
    flex: 1,
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Dynamic Briefing Card Styles
  briefCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    marginVertical: 4,
  },
  briefHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  briefSlogan: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 1,
  },
  briefDesc: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 14,
  },
  briefIndicatorRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  briefStat: {
    flex: 1,
  },
  briefStatLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  briefStatVal: {
    fontSize: 13,
    fontWeight: '900',
  },
  briefStatDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 12,
  },
  encouragementText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },

  // Modal styling definitions
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalDialog: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    position: 'relative',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modalDesc: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  inputGrid: {
    gap: 12,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  labelContainer: {
    flexDirection: 'column',
    gap: 2,
  },
  inputLabelSub: {
    fontSize: 9,
    fontWeight: '600',
  },
  textInput: {
    width: 48,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '900',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '900',
  },
  saveBtn: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  confirmStrategyBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  confirmStrategyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
