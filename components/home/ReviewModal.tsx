import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.reviewOverlay}>
        <View style={styles.reviewSheet}>
          <View style={styles.reviewHandle} />
          <Text style={styles.reviewTitle}>Yesterday's Review</Text>
          <View style={styles.reviewStats}>
            <View style={styles.reviewStat}>
              <Text style={[styles.reviewNum, { color: '#FF5C5C' }]}>47</Text>
              <Text style={styles.reviewLabel}>Total grabs</Text>
            </View>
            <View style={styles.reviewStat}>
              <Text style={[styles.reviewNum, { color: '#FFAA33' }]}>+7</Text>
              <Text style={styles.reviewLabel}>Over limit</Text>
            </View>
            <View style={styles.reviewStat}>
              <Text style={[styles.reviewNum, { color: '#5FDDaa' }]}>38m</Text>
              <Text style={styles.reviewLabel}>Clear AM</Text>
            </View>
          </View>
          <View style={styles.reviewInsight}>
            <Text style={styles.reviewInsightText}>📍 Most grabs between <Text style={styles.statusStrong}>8–10am</Text>. Top trigger: <Text style={styles.statusStrong}>anxiety</Text>. Your best window was after lunch.</Text>
          </View>
          <Pressable style={styles.reviewClose} onPress={onClose}>
            <Text style={styles.reviewCloseText}>Got it — start today</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  reviewOverlay: { flex: 1, backgroundColor: 'rgba(20,20,18,0.55)', justifyContent: 'flex-end' },
  reviewSheet: { backgroundColor: '#FAF9F6', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 36, gap: 13 },
  reviewHandle: { width: 36, height: 4, backgroundColor: '#E0DDD8', borderRadius: 4, alignSelf: 'center', marginBottom: 4 },
  reviewTitle: { fontSize: 24, fontWeight: '700', color: '#1A1A18' },
  reviewStats: { flexDirection: 'row', gap: 8 },
  reviewStat: { flex: 1, backgroundColor: '#F5F4F0', borderRadius: 14, paddingVertical: 13, paddingHorizontal: 10, alignItems: 'center' },
  reviewNum: { fontSize: 28, fontWeight: '700' },
  reviewLabel: { fontSize: 9, color: '#AAA49C', textTransform: 'uppercase', letterSpacing: 1, marginTop: 3 },
  reviewInsight: { backgroundColor: '#F5F4F0', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14 },
  reviewInsightText: { fontSize: 13, color: '#55504A', lineHeight: 21 },
  statusStrong: { color: '#1A1A18', fontWeight: '700' },
  reviewClose: { backgroundColor: '#1A1A18', borderRadius: 14, padding: 14, alignItems: 'center' },
  reviewCloseText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
