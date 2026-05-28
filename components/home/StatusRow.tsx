import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';

interface StatusRowProps {
  statusColor: string;
  statusLabel: string;
  count: number;
  limit: number;
  over: boolean;
  lastTrigger: string | null;
  isCalibrating?: boolean;
  calibrationDay?: number;
}

export const StatusRow: React.FC<StatusRowProps> = ({ 
  statusColor, 
  statusLabel, 
  count, 
  limit, 
  over, 
  lastTrigger,
  isCalibrating = false,
  calibrationDay = 1
}) => {
  const activeColor = isCalibrating ? '#8B5CF6' : statusColor;

  return (
    <Pressable 
      onPress={() => router.push('/pages/plan/plan')}
      disabled={isCalibrating}
      style={({ pressed }) => [
        styles.statusRow, 
        { 
          backgroundColor: activeColor,
          opacity: pressed ? 0.95 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }]
        }
      ]}
    >
      {/* Glowing Pulsing Status Indicator */}
      <View style={styles.indicatorWrapper}>
        <View style={[styles.pulseRing, { borderColor: '#FFFFFF', opacity: 0.35 }]} />
        <View style={[styles.statusDot, { backgroundColor: '#FFFFFF' }]} />
      </View>

      {/* Telemetry Core Grid */}
      <View style={styles.contentContainer}>
        <View style={styles.leftMetrics}>
          <Text style={[styles.statusStrong, { color: '#FFFFFF' }]}>
            {isCalibrating ? 'SILENT CALIBRATION BASELINE' : over ? 'LIMIT EXCEEDED' : 'TODAY REMAINING'}
          </Text>
          {isCalibrating && (
            <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#E9D5FF', marginTop: 2, letterSpacing: 0.3 }}>
              Just use your phone naturally. Day {calibrationDay} of 3.
            </Text>
          )}
        </View>

        {!isCalibrating && (
          <View style={styles.rightMetrics}>
            <Text style={[styles.statusValue, { color: '#FFFFFF' }]}>
              {over ? `+${count - limit}` : `${limit - count}`}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  statusRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 8, 
    paddingVertical: 12, 
    paddingHorizontal: 14, 
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  indicatorWrapper: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pulseRing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  statusDot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3 
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftMetrics: {
    flex: 1,
    justifyContent: 'center',
  },
  statusStrong: { 
    fontSize: 12, 
    fontWeight: '900', 
    letterSpacing: 1.2,
  },
  rightMetrics: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  statusValue: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
});
