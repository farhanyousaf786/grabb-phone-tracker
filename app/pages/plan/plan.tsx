import React, { useState, useCallback } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable, Modal } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { DAILY_LIMIT_DEFAULT, TRIGGERS } from '@/constants/mockData';
import { storage, PlanConfig, FocusBlock } from '@/utils/storage';
import { NotificationService } from '@/services/NotificationService';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';

// Custom split HUD subcomponents
import { PlanSelector } from '@/components/plan/PlanSelector';
import { JourneyProgress } from '@/components/plan/JourneyProgress';
import { DiagnosticsGrid } from '@/components/plan/DiagnosticsGrid';
import { LimitModifier } from '@/components/plan/LimitModifier';
import { QuestRoadmap } from '@/components/plan/QuestRoadmap';
import { FocusBlocks } from '@/components/plan/FocusBlocks';
import { getLocalDateString } from '@/utils/date';

export default function PlanScreen() {
  const { colors, isDark } = useTheme();

  // Dynamic stats & configs
  const [limit, setLimit] = useState(DAILY_LIMIT_DEFAULT);
  const [originalLimit, setOriginalLimit] = useState(DAILY_LIMIT_DEFAULT);
  const [showSelectorModal, setShowSelectorModal] = useState(false);

  // Simplified Bypass Calibration Setup States
  const [showBypassModal, setShowBypassModal] = useState(false);
  const [startLimit, setStartLimit] = useState(40);
  const [weeklyTaper, setWeeklyTaper] = useState(5);
  const [focusTriggers, setFocusTriggers] = useState<string[]>([]);

  const [planConfig, setPlanConfig] = useState<PlanConfig>({
    planType: 'moderate',
    phase1Limit: 40,
    phase2Limit: 30,
    phase3Limit: 20,
    phase4Limit: 10,
  });

  const [hoursReclaimed, setHoursReclaimed] = useState('0.0 hrs');
  const [daysUnderLimit, setDaysUnderLimit] = useState(0);
  const [clearMornings, setClearMornings] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [elapsedDaysCount, setElapsedDaysCount] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [calibrationElapsedDays, setCalibrationElapsedDays] = useState(1);

  // Focus blocks
  const [focusBlocks, setFocusBlocks] = useState<FocusBlock[]>([]);
  const [grabCountsDuringBlocks, setGrabCountsDuringBlocks] = useState<{ id: string; count: number }[]>([]);

  const loadPlanData = useCallback(async () => {
    try {
      const allGrabs = await storage.getAllGrabs();
      const config = await storage.getPlanConfig();
      setPlanConfig(config);

      // Calculate elapsed days timezone-aligned using UTC date strings
      const dates = allGrabs.map(g => g.date).sort();
      let elapsedDays = 0;
      if (dates.length > 0) {
        const firstD = new Date(dates[0]);
        const lastD = new Date(dates[dates.length - 1]);
        const diffTime = Math.abs(lastD.getTime() - firstD.getTime());
        elapsedDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
      }
      setElapsedDaysCount(elapsedDays);

      const calAdopted = await storage.getCalibrationAdopted();
      const activeCal = elapsedDays < 3 && !calAdopted;
      setIsCalibrating(activeCal);
      setCalibrationElapsedDays(elapsedDays);

      // Determine active target limit based on elapsed days & PlanConfig phases
      let activePhaseLimit = config.phase4Limit;
      if (elapsedDays <= 14) activePhaseLimit = config.phase1Limit;
      else if (elapsedDays <= 28) activePhaseLimit = config.phase2Limit;
      else if (elapsedDays <= 42) activePhaseLimit = config.phase3Limit;

      setLimit(activePhaseLimit);
      setOriginalLimit(activePhaseLimit);

      // Wins calculation
      if (allGrabs.length === 0) {
        setHoursReclaimed('0.0 hrs');
        setDaysUnderLimit(0);
        setClearMornings(0);
        setCurrentStreak(0);
        return;
      }

      // Group by date
      const grouped = allGrabs.reduce((acc, g) => {
        acc[g.date] = (acc[g.date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Reclaimed hours: baseline 40 grabs. 15 mins (0.25 hrs) saved per grab.
      const dailyAvg = allGrabs.length / elapsedDays;
      const reclaimedHrs = Math.max(0, (40 - dailyAvg) * elapsedDays * 0.25);
      setHoursReclaimed(`${reclaimedHrs.toFixed(1)} hrs`);

      // Days under limit
      let underLimitCount = 0;
      Object.keys(grouped).forEach(date => {
        if (grouped[date] <= activePhaseLimit) {
          underLimitCount++;
        }
      });
      setDaysUnderLimit(underLimitCount);

      // Clear mornings: 0 logs before 12:00 PM on that calendar day
      const morningGrabs = new Set<string>();
      allGrabs.forEach(g => {
        const timestampDate = new Date(g.timestamp);
        if (timestampDate.getHours() < 12) {
          morningGrabs.add(g.date);
        }
      });

      let clearMorningsCount = 0;
      Object.keys(grouped).forEach(date => {
        if (!morningGrabs.has(date)) {
          clearMorningsCount++;
        }
      });
      setClearMornings(clearMorningsCount);

      // Streak calculation
      let streakVal = 0;
      const todayStr = getLocalDateString();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getLocalDateString(yesterday);

      let checkDate = new Date();
      if (!grouped[todayStr] && grouped[yesterdayStr]) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      while (true) {
        const dateStr = getLocalDateString(checkDate);
        if (grouped[dateStr] !== undefined && grouped[dateStr] <= activePhaseLimit) {
          streakVal++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      setCurrentStreak(streakVal);

      // ---- FOCUS BLOCKS ----
      const blocks = await storage.getFocusBlocks();
      setFocusBlocks(blocks);

      const violations: { id: string; count: number }[] = [];
      blocks.forEach((block) => {
        let count = 0;
        allGrabs.forEach((g) => {
          const gDate = new Date(g.timestamp);
          const dayOfWeek = gDate.getDay();
          if (!block.daysOfWeek.includes(dayOfWeek)) return;
          const hour = gDate.getHours();
          // Handle blocks that wrap past midnight
          if (block.startHour <= block.endHour) {
            if (hour >= block.startHour && hour < block.endHour) count++;
          } else {
            if (hour >= block.startHour || hour < block.endHour) count++;
          }
        });
        violations.push({ id: block.id, count });
      });
      setGrabCountsDuringBlocks(violations);

    } catch (error) {
      console.error('Error loading plan statistics:', error);
    }
  }, []);

  // Sync statistics and plan configs on screen focus
  useFocusEffect(
    useCallback(() => {
      loadPlanData();
    }, [loadPlanData])
  );

  // Manual target limit updates
  async function saveLimit() {
    try {
      await storage.setDailyLimit(limit);
      setOriginalLimit(limit);
      const notificationPrefs = await storage.getNotificationPreferences();
      if (notificationPrefs.goalReminders) {
        await NotificationService.scheduleGoalReminder(limit);
      }
      await loadPlanData(); // Re-sync entire HUD stats immediately
    } catch (error) {
      console.error('Error saving daily limit:', error);
    }
  }

  async function handleSkipCalibration() {
    setShowBypassModal(true);
  }

  async function saveBypassSetup() {
    try {
      const config: PlanConfig = {
        planType: 'custom',
        phase1Limit: startLimit,
        phase2Limit: Math.max(5, startLimit - weeklyTaper),
        phase3Limit: Math.max(5, startLimit - 2 * weeklyTaper),
        phase4Limit: Math.max(5, startLimit - 3 * weeklyTaper),
      };
      
      await storage.setPlanConfig(config);
      await storage.setDailyLimit(startLimit);
      await storage.setCalibrationAdopted(true);
      await storage.setFocusTriggers(focusTriggers);
      await NotificationService.schedulePlanChanged('custom', startLimit);
      const notificationPrefs = await storage.getNotificationPreferences();
      if (notificationPrefs.goalReminders) {
        await NotificationService.scheduleGoalReminder(startLimit);
      }

      setShowBypassModal(false);
      await loadPlanData();
    } catch (error) {
      console.error('Error saving simplified setup:', error);
    }
  }

  async function addFocusBlock(block: FocusBlock) {
    try {
      const current = await storage.getFocusBlocks();
      const updated = [...current, block];
      await storage.setFocusBlocks(updated);
      setFocusBlocks(updated);
      await loadPlanData();
    } catch (error) {
      console.error('Error adding focus block:', error);
    }
  }

  async function removeFocusBlock(id: string) {
    try {
      const current = await storage.getFocusBlocks();
      const updated = current.filter((b) => b.id !== id);
      await storage.setFocusBlocks(updated);
      setFocusBlocks(updated);
      await loadPlanData();
    } catch (error) {
      console.error('Error removing focus block:', error);
    }
  }

  // Dynamic values for progress tracking
  const currentWeek = Math.min(8, Math.max(1, Math.floor((elapsedDaysCount) / 7) + 1));
  const planProgressPercent = Math.min(100, Math.round((elapsedDaysCount / 56) * 100));

  // Determine styles for the active plan type capsule
  const activeColor = planConfig.planType === 'easy' ? '#34D399' :
    planConfig.planType === 'moderate' ? colors.primary :
      planConfig.planType === 'hard' ? '#EF4444' :
        '#A78BFA';

  const activeIcon = planConfig.planType === 'easy' ? 'leaf-sharp' :
    planConfig.planType === 'moderate' ? 'compass-sharp' :
      planConfig.planType === 'hard' ? 'nuclear-sharp' :
        'construct-sharp';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0A061E' : '#F5F3FF' }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header Title Section */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.headerBlock}>
          <Text style={[styles.title, { color: colors.text }]}>Reduction Plan</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Your path to mindful device usage and digital freedom.
          </Text>
        </Animated.View>

        {isCalibrating && (
          <Animated.View 
            entering={FadeInUp.delay(150).duration(600)} 
            style={[
              styles.topUnlockBanner, 
              { 
                backgroundColor: isDark ? 'rgba(139, 92, 246, 0.12)' : 'rgba(139, 92, 246, 0.05)',
                borderColor: '#8B5CF6' + '40',
                borderWidth: 1
              }
            ]}
          >
            <Ionicons name="time-sharp" size={18} color="#8B5CF6" />
            <Text style={[styles.topUnlockText, { color: colors.text }]}>
              Your personalized protocol unlocks automatically on <Text style={{ fontWeight: '900', color: '#8B5CF6' }}>Day 3</Text>!
            </Text>
          </Animated.View>
        )}

        {isCalibrating ? (
          <Animated.View entering={FadeInUp.delay(200).duration(600)} style={[styles.calCard, { backgroundColor: colors.surface, borderColor: '#8B5CF6' + '30', borderWidth: 1.5 }]}>
            <View style={[styles.calIconOuter, { backgroundColor: '#8B5CF6' + '15' }]}>
              <Ionicons name="sync-sharp" size={32} color="#8B5CF6" />
            </View>
            <Text style={[styles.calCardTitle, { color: colors.text }]}>Silent Neuro-Calibration Active</Text>
            <Text style={[styles.calCardSubtitle, { color: colors.textMuted }]}>
              Day {calibrationElapsedDays} of 3 Days Mapped
            </Text>
            
            {/* Step progress pills */}
            <View style={styles.calProgressPills}>
              {[1, 2, 3].map(step => {
                const isActive = step <= calibrationElapsedDays;
                return (
                  <View 
                    key={step} 
                    style={[
                      styles.calPill, 
                      { 
                        backgroundColor: isActive ? '#8B5CF6' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')
                      }
                    ]} 
                  />
                );
              })}
            </View>

            <View style={[styles.calDescBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]}>
              <Ionicons name="sparkles" size={16} color="#8B5CF6" style={{ marginBottom: 6 }} />
              <Text style={[styles.calDescText, { color: colors.text }]}>
                We are quietly observing your device usage habits to construct the perfect digital tapering routine.
              </Text>
              <Text style={[styles.calDescBodyText, { color: colors.textMuted }]}>
                To build a screen-reduction plan that actually succeeds, our clinical tapering method avoids "prompt shock." By observing your natural baseline behavior first, we can suggest a highly customized daily goal tailored precisely to your neuro-profile.
              </Text>
            </View>
            
            <View style={[styles.calSkipDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]} />

            <View style={styles.calSkipSection}>
              <Text style={[styles.calSkipTitleText, { color: colors.text }]}>
                Want to skip calibration and start today?
              </Text>
              <Text style={[styles.calSkipBodyText, { color: colors.textMuted }]}>
                You can bypass the silent observation phase and immediately customize your goals, limits, and tapering protocol.
              </Text>
              
              <View style={styles.calSkipBtnRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.calSkipBtnPrimary,
                    { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }
                  ]}
                  onPress={handleSkipCalibration}
                >
                  <Ionicons name="flash" size={13} color="#FFFFFF" />
                  <Text style={styles.calSkipBtnTextPrimary}>Bypass & Setup Today</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        ) : (
          <>
            {/* HERO: Journey Timeline progress card */}
            <JourneyProgress
              elapsedDaysCount={elapsedDaysCount}
              planProgressPercent={planProgressPercent}
            />

            {/* Capsule showing active strategy and "Edit Plan" trigger */}
            <Animated.View
              entering={FadeInUp.delay(250)}
              style={[
                styles.activePlanCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: activeColor + '30',
                  borderWidth: 1.5
                }
              ]}
            >
              <View style={styles.activePlanLeft}>
                <View style={[styles.activePlanIconContainer, { backgroundColor: activeColor + '15' }]}>
                  <Ionicons name={activeIcon} size={20} color={activeColor} />
                </View>
                <View style={styles.activePlanTexts}>
                  <View style={styles.activeLabelRow}>
                    <Text style={[styles.activePlanLabel, { color: colors.textMuted }]}>ACTIVE STRATEGY</Text>
                    <View
                      style={[
                        styles.typeTag,
                        {
                          backgroundColor: planConfig.planType === 'custom' ? '#A78BFA' + '1A' : '#34D399' + '1A',
                          borderColor: planConfig.planType === 'custom' ? '#A78BFA' + '50' : '#34D399' + '50',
                        }
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeTagText,
                          { color: planConfig.planType === 'custom' ? '#C4B5FD' : '#34D399' }
                        ]}
                      >
                        {planConfig.planType === 'custom' ? 'CUSTOM' : 'RECOMMENDED'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.activePlanName, { color: colors.text }]}>
                    {planConfig.planType.toUpperCase()} PROTOCOL
                  </Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.configureBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.9 : 1
                  }
                ]}
                onPress={() => setShowSelectorModal(true)}
              >
                <Ionicons name="cog-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.configureBtnText}>Edit Plan</Text>
              </Pressable>
            </Animated.View>

            {/* HUD Diagnostics parameters */}
            <DiagnosticsGrid
              hoursReclaimed={hoursReclaimed}
              daysUnderLimit={daysUnderLimit}
              clearMornings={clearMornings}
              currentStreak={currentStreak}
            />

            {/* Target limit slider */}
            <LimitModifier
              limit={limit}
              setLimit={setLimit}
              originalLimit={originalLimit}
              saveLimit={saveLimit}
            />

            {/* Connective pipeline roadmap Questline */}
            <QuestRoadmap
              elapsedDaysCount={elapsedDaysCount}
              currentWeek={currentWeek}
              planConfig={planConfig}
            />

            {/* Focus Blocks */}
            <FocusBlocks
              blocks={focusBlocks}
              onAdd={addFocusBlock}
              onRemove={removeFocusBlock}
              grabCountsDuringBlocks={grabCountsDuringBlocks}
            />
          </>
        )}

      </ScrollView>

      {/* FULL SCREEN STRATEGY EDIT MODAL SHEET */}
      <Modal
        visible={showSelectorModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSelectorModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? '#0A061E' : '#F5F3FF' }]}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Protocol</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  Select or customize your reduction strategy.
                </Text>
              </View>
              <Pressable
                style={[styles.closeIconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
                onPress={() => setShowSelectorModal(false)}
              >
                <Ionicons name="close-sharp" size={20} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              <PlanSelector
                planConfig={planConfig}
                onPlanChanged={loadPlanData}
                onClose={() => setShowSelectorModal(false)}
              />
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* SIMPLIFIED FAST-TRACK SETUP MODAL */}
      <Modal
        visible={showBypassModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBypassModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(8, 5, 24, 0.85)' : 'rgba(240, 237, 232, 0.85)', justifyContent: 'center', alignItems: 'center' }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowBypassModal(false)} />

          <Animated.View
            entering={ZoomIn.duration(200)}
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
                <Ionicons name="flash-sharp" size={20} color="#8B5CF6" />
                <Text style={[styles.modalTitle, { color: colors.text }]}>FAST-TRACK SETUP</Text>
              </View>
              <Text style={[styles.modalDesc, { color: colors.textMuted }]}>
                Skip calibration and build a custom tapering plan instantly.
              </Text>

              {/* Input 1: Starting Daily Limit */}
              <View style={styles.setupCard}>
                <Text style={[styles.setupLabel, { color: colors.text }]}>1. STARTING DAILY LIMIT</Text>
                <Text style={[styles.setupDesc, { color: colors.textMuted }]}>Maximum daily swipes to start with.</Text>
                <View style={styles.setupStepper}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.stepperBtn,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', opacity: pressed ? 0.8 : 1 }
                    ]}
                    onPress={() => setStartLimit(prev => Math.max(10, prev - 5))}
                  >
                    <Ionicons name="remove-sharp" size={18} color={colors.text} />
                  </Pressable>
                  <View style={styles.stepperValueContainer}>
                    <Text style={[styles.stepperValue, { color: colors.text }]}>{startLimit}</Text>
                    <Text style={[styles.stepperValueSub, { color: colors.textMuted }]}>grabs/day</Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.stepperBtn,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', opacity: pressed ? 0.8 : 1 }
                    ]}
                    onPress={() => setStartLimit(prev => Math.min(100, prev + 5))}
                  >
                    <Ionicons name="add-sharp" size={18} color={colors.text} />
                  </Pressable>
                </View>
              </View>

              {/* Input 2: Weekly Taper Rate */}
              <View style={styles.setupCard}>
                <Text style={[styles.setupLabel, { color: colors.text }]}>2. WEEKLY TAPER RATE</Text>
                <Text style={[styles.setupDesc, { color: colors.textMuted }]}>Reduce this many swipes each week.</Text>
                <View style={styles.setupStepper}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.stepperBtn,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', opacity: pressed ? 0.8 : 1 }
                    ]}
                    onPress={() => setWeeklyTaper(prev => Math.max(1, prev - 1))}
                  >
                    <Ionicons name="remove-sharp" size={18} color={colors.text} />
                  </Pressable>
                  <View style={styles.stepperValueContainer}>
                    <Text style={[styles.stepperValue, { color: colors.text }]}>{weeklyTaper}</Text>
                    <Text style={[styles.stepperValueSub, { color: colors.textMuted }]}>swipes/week</Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.stepperBtn,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', opacity: pressed ? 0.8 : 1 }
                    ]}
                    onPress={() => setWeeklyTaper(prev => Math.min(20, prev + 1))}
                  >
                    <Ionicons name="add-sharp" size={18} color={colors.text} />
                  </Pressable>
                </View>
              </View>

              {/* Input 3: Focus Triggers */}
              <View style={styles.setupCard}>
                <Text style={[styles.setupLabel, { color: colors.text }]}>3. REDUCE SPECIFIC TRIGGERS</Text>
                <Text style={[styles.setupDesc, { color: colors.textMuted }]}>Select triggers you wish to focus on reducing.</Text>
                <View style={styles.triggerSelectGrid}>
                  {TRIGGERS.map((trigger) => {
                    const isSelected = focusTriggers.includes(trigger);
                    return (
                      <Pressable
                        key={trigger}
                        style={({ pressed }) => [
                          styles.triggerSelectChip,
                          {
                            backgroundColor: isSelected ? colors.primary + '1C' : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                            borderColor: isSelected ? colors.primary : colors.border,
                            opacity: pressed ? 0.85 : 1
                          }
                        ]}
                        onPress={() => {
                          if (isSelected) {
                            setFocusTriggers(prev => prev.filter(t => t !== trigger));
                          } else {
                            setFocusTriggers(prev => [...prev, trigger]);
                          }
                        }}
                      >
                        <Text style={[styles.triggerSelectText, { color: isSelected ? colors.text : colors.textMuted, fontWeight: isSelected ? '900' : '600' }]}>
                          {trigger}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Save & Confirm Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.confirmStrategyBtn,
                  {
                    backgroundColor: '#8B5CF6',
                    opacity: pressed ? 0.9 : 1,
                    marginTop: 10
                  }
                ]}
                onPress={saveBypassSetup}
              >
                <Ionicons name="flash-sharp" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.confirmStrategyBtnText}>Initialize Taper Plan</Text>
              </Pressable>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 120 },
  headerBlock: {
    marginTop: 12,
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 13, fontWeight: '600', lineHeight: 18 },

  // Active Plan Capsule styling
  activePlanCard: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.015,
    shadowRadius: 8,
    elevation: 1,
  },
  activePlanLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  activePlanIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePlanTexts: {
    gap: 2,
    flexShrink: 1,
  },
  activePlanLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 1,
  },
  activePlanName: {
    fontSize: 14.5,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  activeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  typeTagText: {
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  configureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  configureBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  // Modal Sheet Styling definitions
  modalOverlay: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
  },
  closeIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
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
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  
  // Calibration Active styling rules
  calCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  calIconOuter: {
    width: 68,
    height: 68,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  calCardTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  calCardSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calProgressPills: {
    flexDirection: 'row',
    gap: 8,
    width: 140,
    marginBottom: 24,
  },
  calPill: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  calDescBox: {
    borderRadius: 18,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  calDescText: {
    fontSize: 12.5,
    fontWeight: '900',
    lineHeight: 18,
    marginBottom: 8,
  },
  calDescBodyText: {
    fontSize: 11,
    lineHeight: 16.5,
    fontWeight: '600',
  },
  calActionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    width: '100%',
    paddingTop: 16,
    justifyContent: 'center',
  },
  calNoticeText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  
  // Custom standalone unlock banner styles
  topUnlockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    gap: 12,
    marginBottom: 20,
  },
  topUnlockText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    flex: 1,
  },
  calSkipDivider: {
    height: 1,
    width: '100%',
    marginVertical: 18,
  },
  calSkipSection: {
    width: '100%',
    alignItems: 'center',
  },
  calSkipTitleText: {
    fontSize: 13.5,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  calSkipBodyText: {
    fontSize: 11,
    lineHeight: 16.5,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  calSkipBtnRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    width: '100%',
  },
  calSkipBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 12,
    gap: 6,
  },
  calSkipBtnTextPrimary: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  setupCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.15)',
    padding: 16,
    marginBottom: 16,
  },
  setupLabel: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },
  setupDesc: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 14,
  },
  setupStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValueContainer: {
    alignItems: 'center',
  },
  stepperValue: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  stepperValueSub: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: -2,
  },
  triggerSelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  triggerSelectChip: {
    borderRadius: 10,
    borderWidth: 1.5,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  triggerSelectText: {
    fontSize: 10.5,
    letterSpacing: 0.2,
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
  modalDesc: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
});
