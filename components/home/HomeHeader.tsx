import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface HomeHeaderProps {
  userName?: string;
  greeting: string;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ greeting, userName }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.header}>
      <View>
        <Text style={[styles.greetingText, { color: colors.text }]}>{greeting}</Text>
        {userName && <Text style={[styles.userName, { color: colors.textMuted }]}>{userName}</Text>}
      </View>
      <Pressable style={[styles.notifButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="notifications-outline" size={22} color={colors.primary} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greetingText: { fontSize: 14, fontWeight: '800', letterSpacing: -0.5 },
  userName: { fontSize: 18, fontWeight: '700', marginTop: 1 },
  notifButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});
