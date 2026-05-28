import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';

interface CircularProgressProps {
  size: number;
  strokeWidth: number;
  progress: number;
  color: string;
  count: number;
  limit: number;
  isCalibrating?: boolean;
  calibrationDay?: number;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({ 
  size, 
  strokeWidth, 
  progress, 
  color, 
  count, 
  limit,
  isCalibrating = false,
  calibrationDay = 1
}) => {
  const { colors, isDark } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Custom neon gradient colors based on status color
  const activeColor = isCalibrating ? '#8B5CF6' : color;
  const gradientEnd = isCalibrating ? '#C4B5FD' : 
                      color === '#8B5CF6' ? '#C4B5FD' : 
                      color === '#FF5C5C' ? '#FF8A8A' : 
                      '#FFD280';

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer ambient glow track */}
      <View 
        style={[
          styles.glowBackdrop, 
          { 
            width: size - 10, 
            height: size - 10, 
            borderRadius: (size - 10) / 2, 
            backgroundColor: activeColor, 
            opacity: isDark ? 0.03 : 0.015,
            shadowColor: activeColor,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
          }
        ]} 
      />

      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={activeColor} />
            <Stop offset="100%" stopColor={gradientEnd} />
          </LinearGradient>
        </Defs>
        
        {/* Background Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Active Progress */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - (isCalibrating ? 1 : progress))}
          strokeLinecap="round"
          fill="transparent"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* Central Cyber Metrics HUD Display */}
      <View style={styles.content}>
        <Text style={[styles.countNum, { color: colors.text }]}>{count}</Text>
        
        <View style={[styles.separator, { backgroundColor: activeColor }]} />
        
        <Text style={[styles.labelInside, { color: colors.textMuted }]}>
          {isCalibrating ? 'CALIBRATING' : 'TOTAL GRABS'}
        </Text>
        
        {/* Futuristic limit mini capsule badge */}
        <View 
          style={[
            styles.limitBadge, 
            { 
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
            }
          ]}
        >
          <Text style={[styles.limitBadgeText, { color: colors.textMuted }]}>
            {isCalibrating ? `DAY ${calibrationDay} OF 3` : `limit ${limit}`}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  glowBackdrop: { position: 'absolute', zIndex: 0 },
  svg: { position: 'absolute', zIndex: 1 },
  content: { alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  countNum: { fontSize: 66, fontWeight: '900', letterSpacing: -2.5, marginBottom: -3 },
  separator: { width: 28, height: 2, borderRadius: 1, marginVertical: 6 },
  labelInside: { fontSize: 8.5, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
  limitBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  limitBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
