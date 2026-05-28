import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function AnalyticsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.description}>Habit charts and progress insights will be added here.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 34, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  description: { fontSize: 16, lineHeight: 24, color: '#64748B' },
});
