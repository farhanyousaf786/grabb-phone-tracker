import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MotivationCardProps {
  streak: number;
}

export const MotivationCard: React.FC<MotivationCardProps> = ({ streak }) => {
  return (
    <View style={styles.motivationCard}>
      <View style={styles.motivationContent}>
        <View style={styles.streakInfo}>
          <Ionicons name="flame" size={32} color="#FF7A00" />
          <Text style={styles.streakCount}>{streak} Days</Text>
          <Text style={styles.streakLabel}>Streak Steps</Text>
        </View>
        <View style={styles.motivationTextWrap}>
          <Text style={styles.motivationTitle}>Keep up your streak!</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  motivationCard: { backgroundColor: '#FFF0ED', borderRadius: 20, padding: 14, marginBottom: 16 },
  motivationContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  streakInfo: { alignItems: 'center' },
  streakCount: { fontSize: 22, fontWeight: '700', color: '#FF7A00', marginTop: 2 },
  streakLabel: { fontSize: 10, color: '#FF7A00', opacity: 0.6, marginTop: 1 },
  motivationTextWrap: { flex: 1, marginLeft: 16 },
  motivationTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A18', lineHeight: 24 },
});
