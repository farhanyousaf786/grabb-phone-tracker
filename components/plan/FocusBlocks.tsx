import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import Animated, { FadeInUp, FadeIn, FadeOut } from 'react-native-reanimated';

export interface FocusBlock {
  id: string;
  label: string;
  startHour: number;
  endHour: number;
  daysOfWeek: number[]; // 0=Sun ... 6=Sat
}

interface FocusBlocksProps {
  blocks: FocusBlock[];
  onAdd: (block: FocusBlock) => void;
  onRemove: (id: string) => void;
  grabCountsDuringBlocks: { id: string; count: number }[];
}

const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const FocusBlocks: React.FC<FocusBlocksProps> = ({
  blocks,
  onAdd,
  onRemove,
  grabCountsDuringBlocks,
}) => {
  const { colors, isDark } = useTheme();
  const [showAdd, setShowAdd] = useState(false);
  const [label, setLabel] = useState('');
  const [startHour, setStartHour] = useState(20);
  const [endHour, setEndHour] = useState(22);
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const formatHour = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour} ${period}`;
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleAdd = () => {
    if (!label.trim()) return;
    onAdd({
      id: `fb-${Date.now()}`,
      label: label.trim(),
      startHour,
      endHour,
      daysOfWeek: selectedDays,
    });
    setLabel('');
    setStartHour(20);
    setEndHour(22);
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    setShowAdd(false);
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(400).duration(500)}
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          borderWidth: 1,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>FOCUS BLOCKS</Text>
        <Pressable
          onPress={() => setShowAdd(!showAdd)}
          style={({ pressed }) => [
            styles.addBtn,
            {
              backgroundColor: colors.primary + '18',
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Ionicons name={showAdd ? 'close' : 'add'} size={14} color={colors.primary} />
          <Text style={[styles.addBtnText, { color: colors.primary }]}>
            {showAdd ? 'Cancel' : 'Add'}
          </Text>
        </Pressable>
      </View>

      {showAdd && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.addForm}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="e.g. Morning focus, Bedtime"
            placeholderTextColor={colors.textMuted}
            value={label}
            onChangeText={setLabel}
          />

          <View style={styles.timeRow}>
            <View style={styles.timeCol}>
              <Text style={[styles.timeLabel, { color: colors.textMuted }]}>START</Text>
              <View style={styles.stepperRow}>
                <Pressable
                  onPress={() => setStartHour((h) => Math.max(0, h - 1))}
                  style={({ pressed }) => [
                    styles.stepperBtn,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Ionicons name="remove-sharp" size={14} color={colors.text} />
                </Pressable>
                <Text style={[styles.stepperValue, { color: colors.text }]}>{formatHour(startHour)}</Text>
                <Pressable
                  onPress={() => setStartHour((h) => Math.min(23, h + 1))}
                  style={({ pressed }) => [
                    styles.stepperBtn,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Ionicons name="add-sharp" size={14} color={colors.text} />
                </Pressable>
              </View>
            </View>

            <View style={styles.timeCol}>
              <Text style={[styles.timeLabel, { color: colors.textMuted }]}>END</Text>
              <View style={styles.stepperRow}>
                <Pressable
                  onPress={() => setEndHour((h) => Math.max(0, h - 1))}
                  style={({ pressed }) => [
                    styles.stepperBtn,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Ionicons name="remove-sharp" size={14} color={colors.text} />
                </Pressable>
                <Text style={[styles.stepperValue, { color: colors.text }]}>{formatHour(endHour)}</Text>
                <Pressable
                  onPress={() => setEndHour((h) => Math.min(23, h + 1))}
                  style={({ pressed }) => [
                    styles.stepperBtn,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Ionicons name="add-sharp" size={14} color={colors.text} />
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.daysRow}>
            {DAY_NAMES.map((name, idx) => {
              const isSelected = selectedDays.includes(idx);
              return (
                <Pressable
                  key={idx}
                  onPress={() => toggleDay(idx)}
                  style={[
                    styles.dayChip,
                    {
                      backgroundColor: isSelected ? colors.primary + '18' : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      borderColor: isSelected ? colors.primary : 'transparent',
                      borderWidth: 1.5,
                    },
                  ]}
                >
                  <Text style={[styles.dayChipText, { color: isSelected ? colors.primary : colors.textMuted }]}>
                    {name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={handleAdd}
            style={({ pressed }) => [
              styles.confirmBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Text style={styles.confirmBtnText}>Create Focus Block</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Existing blocks */}
      {blocks.length === 0 && !showAdd ? (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No focus blocks yet. Tap Add to create one.</Text>
      ) : (
        <View style={styles.blocksList}>
          {blocks.map((block) => {
            const violation = grabCountsDuringBlocks.find((v) => v.id === block.id);
            const hadGrabs = (violation?.count || 0) > 0;
            return (
              <View
                key={block.id}
                style={[
                  styles.blockRow,
                  { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
                ]}
              >
                <View style={styles.blockInfo}>
                  <View style={styles.blockTop}>
                    <Ionicons name="time-outline" size={14} color={colors.primary} />
                    <Text style={[styles.blockLabel, { color: colors.text }]}>{block.label}</Text>
                  </View>
                  <Text style={[styles.blockTime, { color: colors.textMuted }]}>
                    {formatHour(block.startHour)} – {formatHour(block.endHour)} ·{' '}
                    {block.daysOfWeek.map((d) => DAY_NAMES[d]).join(' ')}
                  </Text>
                  {hadGrabs && (
                    <View style={styles.violationBadge}>
                      <Ionicons name="warning" size={10} color={colors.danger} />
                      <Text style={[styles.violationText, { color: colors.danger }]}>
                        {violation?.count} grab{violation?.count === 1 ? '' : 's'} during block
                      </Text>
                    </View>
                  )}
                </View>
                <Pressable
                  onPress={() => onRemove(block.id)}
                  style={({ pressed }) => [
                    styles.removeBtn,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Ionicons name="trash-outline" size={14} color={colors.textMuted} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.015,
    shadowRadius: 8,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 9.5,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '900',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  addBtnText: {
    fontSize: 10,
    fontWeight: '800',
  },
  addForm: {
    gap: 10,
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '700',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  timeCol: {
    flex: 1,
    gap: 4,
  },
  timeLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 13,
    fontWeight: '900',
    width: 56,
    textAlign: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  dayChip: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  confirmBtn: {
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 20,
  },
  blocksList: {
    gap: 2,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  blockInfo: {
    flex: 1,
    gap: 3,
  },
  blockTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  blockLabel: {
    fontSize: 12.5,
    fontWeight: '900',
  },
  blockTime: {
    fontSize: 10,
    fontWeight: '700',
  },
  violationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  violationText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
