import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface HomeHeaderProps {
  userName?: string;
  greeting: string;
  showMotivationsBtn?: boolean;
  onShowMotivations?: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ greeting, userName, showMotivationsBtn, onShowMotivations }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.header}>
      <View>
        <Text style={[styles.greetingText, { color: colors.text }]}>{greeting}</Text>
        {userName && <Text style={[styles.userName, { color: colors.textMuted }]}>{userName}</Text>}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {showMotivationsBtn && (
          <Pressable onPress={onShowMotivations}>
            <Text style={[styles.motivationsText, { color: colors.primary }]}>Motivations</Text>
          </Pressable>
        )}
        <Pressable style={[styles.notifButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="notifications-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greetingText: { fontSize: 14, fontWeight: '800', letterSpacing: -0.5 },
  userName: { fontSize: 18, fontWeight: '700', marginTop: 1 },
  motivationsText: { fontSize: 14, fontWeight: '800' },
  notifButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});
