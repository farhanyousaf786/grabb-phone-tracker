import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BADGES } from '@/constants/mockData';

export default function BadgesScreen() {
  const earned = BADGES.filter((badge) => badge.earned).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Achievements</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryDark}>
            <Text style={[styles.summaryNum, styles.green]}>{earned}</Text>
            <Text style={styles.summaryDarkLabel}>Earned</Text>
          </View>
          <View style={styles.summaryLight}>
            <Text style={styles.summaryNum}>{BADGES.length - earned}</Text>
            <Text style={styles.summaryLightLabel}>Remaining</Text>
          </View>
          <View style={styles.summaryLight}>
            <Text style={[styles.summaryNum, styles.orange]}>2</Text>
            <Text style={styles.summaryLightLabel}>Day streak</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {BADGES.map((badge) => (
            <View key={badge.id} style={[styles.badgeCell, !badge.earned && styles.locked]}>
              <Text style={styles.badgeIcon}>{badge.icon}</Text>
              <Text style={styles.badgeName}>{badge.label}</Text>
              {badge.earned ? <Text style={styles.earnedTag}>earned</Text> : null}
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Next up</Text>
          <View style={styles.nextRow}>
            <Text style={styles.nextIcon}>🌅</Text>
            <View style={styles.nextTextWrap}>
              <Text style={styles.nextTitle}>Clear Morning</Text>
              <Text style={styles.nextBody}>No phone for 30min after waking. You've done 2 of 7 days.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  content: { padding: 20, paddingBottom: 120 },
  title: { fontSize: 30, fontWeight: '700', color: '#1A1A18', paddingVertical: 18 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryDark: { flex: 1, backgroundColor: '#1A1A18', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16 },
  summaryLight: { flex: 1, backgroundColor: '#F5F4F0', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16 },
  summaryNum: { fontSize: 30, color: '#1A1A18', fontWeight: '700' },
  summaryDarkLabel: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  summaryLightLabel: { fontSize: 11, color: '#BBB6AE', marginTop: 2 },
  green: { color: '#5FDDaa' },
  orange: { color: '#FFAA33' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCell: { width: '31.7%', backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center', gap: 6, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  locked: { opacity: 0.32 },
  badgeIcon: { fontSize: 26 },
  badgeName: { fontSize: 10, color: '#44403A', fontWeight: '700', textAlign: 'center', lineHeight: 14 },
  earnedTag: { fontSize: 9, color: '#5FDDaa', backgroundColor: 'rgba(95,221,170,0.12)', paddingVertical: 2, paddingHorizontal: 7, borderRadius: 8, overflow: 'hidden', textTransform: 'uppercase', fontWeight: '700' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginTop: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  sectionLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: '#BBB6AE', marginBottom: 10, fontWeight: '700' },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  nextIcon: { fontSize: 28 },
  nextTextWrap: { flex: 1 },
  nextTitle: { fontSize: 13, fontWeight: '700', color: '#1A1A18' },
  nextBody: { fontSize: 11, color: '#AAA49C', marginTop: 2, lineHeight: 17 },
});
