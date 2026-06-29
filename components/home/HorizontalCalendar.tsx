import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet, View, Dimensions } from 'react-native';

interface CalendarDay {
  dayNum: number;
  dayName: string;
  isToday: boolean;
  fullDate: string;
}

interface HorizontalCalendarProps {
  days: CalendarDay[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  dailyStats?: Record<string, { count: number; limit: number }>;
}

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Rect, Defs, ClipPath } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';
import { getLocalDateString } from '@/utils/date';

const AttemptPill: React.FC<{ size: number; count: number; limit: number; isActive: boolean; isDark: boolean }> = ({ size, count, limit, isActive, isDark }) => {
  const safeLimit = limit > 0 ? limit : 40;
  const fillPercent = Math.min(100, Math.max(0, (count / safeLimit) * 100));
  const isOver = count > safeLimit;

  // Premium vibrant color spectrum
  let pillBg = 'rgba(128, 128, 128, 0.08)';
  let pillTextColor = isDark ? '#FFFFFF' : '#1A1A18';

  if (count > 0) {
    if (isOver) {
      pillBg = '#EF4444'; // deep neon crimson
      pillTextColor = '#FFFFFF';
    } else if (fillPercent > 80) {
      pillBg = '#FF9F0A'; // warning orange
      pillTextColor = '#FFFFFF';
    } else if (fillPercent > 45) {
      pillBg = '#FFD60A'; // sunshine yellow
      pillTextColor = '#1A1A18';
    } else {
      pillBg = '#0A84FF'; // glowing sky blue
      pillTextColor = '#FFFFFF';
    }
  } else {
    // 0 grabs
    pillBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
    pillTextColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)';
  }

  // ActiveOverrides
  if (isActive && count === 0) {
    pillBg = 'rgba(255, 255, 255, 0.2)';
    pillTextColor = 'rgba(255, 255, 255, 0.65)';
  } else if (isActive && count > 0) {
    // Selected day with count
    if (!isOver && fillPercent <= 45) {
      pillBg = '#FFFFFF';
      pillTextColor = '#0A84FF';
    } else if (!isOver && fillPercent <= 80) {
      pillBg = '#FFFFFF';
      pillTextColor = '#D6B000';
    }
  }

  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: pillBg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: count > 0 ? 0 : 1,
      borderColor: isActive ? 'rgba(255,255,255,0.3)' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)')
    }}>
      <Text style={{
        fontSize: size * 0.48,
        fontWeight: '900',
        color: pillTextColor
      }}>
        {count}
      </Text>
    </View>
  );
};

const DoneIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 128 128">
    <Path
      fill={color}
      d="M118.52326,36.73483l-17.22791-20.5351a21.58065,21.58065,0,0,0-12.77347-7.3761L62.12027,4.16943A21.554,21.554,0,0,0,47.591,6.72877L24.37583,20.13394a21.5618,21.5618,0,0,0-9.48022,11.301L5.73123,56.62425A21.54433,21.54433,0,0,0,5.72658,71.3718l9.169,25.19395a21.5791,21.5791,0,0,0,9.48022,11.301L47.591,121.26731a21.55616,21.55616,0,0,0,14.52923,2.564l26.40161-4.65882a21.53362,21.53362,0,0,0,12.77347-7.3761l17.22791-20.53045a21.57094,21.57094,0,0,0,5.049-13.865V50.59519A21.55855,21.55855,0,0,0,118.52326,36.73483ZM94.30014,53.14523,61.17272,86.27264a8.10767,8.10767,0,0,1-11.50077,0L33.61919,70.21523a7.839,7.839,0,0,1-2.35032-5.69A8.1159,8.1159,0,0,1,45.14318,58.812L55.4595,69.12834,82.85975,41.72809a8.10237,8.10237,0,0,1,11.51934.02322,7.8508,7.8508,0,0,1,2.355,5.69A7.62208,7.62208,0,0,1,94.30014,53.14523Z"
    />
  </Svg>
);

export const HorizontalCalendar: React.FC<HorizontalCalendarProps> = ({ days, selectedDate, onSelectDate, dailyStats }) => {
  const { colors, isDark } = useTheme();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const todayStr = getLocalDateString();
  const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const scrollViewRef = React.useRef<ScrollView>(null);
  const todayIndex = days.findIndex(d => d.isToday);

  React.useEffect(() => {
    if (!isExpanded && todayIndex !== -1 && scrollViewRef.current) {
      // Delay slightly for render layout computation to complete
      const timer = setTimeout(() => {
        const screenWidth = Dimensions.get('window').width;
        const cellWidth = 52;
        const gap = 10;
        const itemOffset = todayIndex * (cellWidth + gap);

        // Position today slightly to the right of the middle (e.g. 58% of screen width)
        const targetOffset = Math.max(0, itemOffset - (screenWidth * 0.58) + (cellWidth / 2));
        scrollViewRef.current?.scrollTo({ x: targetOffset, animated: true });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isExpanded, todayIndex]);

  const getDaysInCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // First day of month
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 (Sun) to 6 (Sat)

    // Total days in month
    const totalDays = new Date(year, month + 1, 0).getDate();

    const daysGrid = [];

    // Padding from previous month to align grid starting day
    for (let i = startDayOfWeek; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      daysGrid.push({
        dayNum: d.getDate(),
        dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
        isToday: false,
        fullDate: getLocalDateString(d),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      daysGrid.push({
        dayNum: i,
        dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
        isToday: d.toDateString() === new Date().toDateString(),
        fullDate: getLocalDateString(d),
        isCurrentMonth: true,
      });
    }

    return daysGrid;
  };

  return (
    <View style={styles.outerContainer}>
      {/* Header with expand button */}
      <View style={styles.headerRow}>
        <Text style={[styles.monthLabel, { color: colors.text }]}>{currentMonthName}</Text>
        <Pressable
          style={({ pressed }) => [
            styles.toggleBtn,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.85 : 1
            }
          ]}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Ionicons name={isExpanded ? "layers" : "calendar-outline"} size={12} color="#FFFFFF" />
          <Text style={[styles.toggleBtnText, { color: '#FFFFFF' }]}>
            {isExpanded ? "Weekly View" : "Full Month"}
          </Text>
        </Pressable>
      </View>

      {!isExpanded ? (
        <ScrollView 
          ref={scrollViewRef}
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.calendarContainer}
        >
          {days.map((item, index) => {
            const isActive = selectedDate === item.fullDate;
            const isFuture = item.fullDate > todayStr;
            const stats = dailyStats?.[item.fullDate] || { count: 0, limit: 40 };
            
            return (
              <Pressable 
                key={index} 
                onPress={() => !isFuture && onSelectDate(item.fullDate)}
                style={[styles.calendarDayWrapper, isFuture && { opacity: 0.4 }]}
              >
                {isActive ? (
                  <LinearGradient
                    colors={colors.activeDayGradient}
                    style={styles.calendarDayActive}
                  >
                    <Text style={styles.calendarDayNameActive}>{item.dayName}</Text>
                    <Text style={styles.calendarDayNumActive}>{item.dayNum}</Text>
                    
                    <View style={styles.indicatorContainer}>
                      <AttemptPill size={22} count={stats.count} limit={stats.limit} isActive={true} isDark={isDark} />
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={[styles.calendarDay, { 
                    borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)' 
                  }]}>
                    <Text style={[styles.calendarDayName, { color: colors.textMuted }]}>{item.dayName}</Text>
                    <Text style={[styles.calendarDayNum, { color: colors.text }]}>{item.dayNum}</Text>
                    
                    <View style={styles.indicatorContainer}>
                      <AttemptPill size={22} count={stats.count} limit={stats.limit} isActive={false} isDark={isDark} />
                    </View>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <View style={[styles.gridContainer, { 
          backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'
        }]}>
          {/* Week Headers */}
          <View style={styles.gridWeekRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
              <Text key={idx} style={[styles.gridWeekText, { color: colors.textMuted }]}>{day}</Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.gridDaysWrapper}>
            {getDaysInCurrentMonth().map((item, index) => {
              const isActive = selectedDate === item.fullDate;
              const isFuture = item.fullDate > todayStr;
              const stats = dailyStats?.[item.fullDate] || { count: 0, limit: 40 };
              
              return (
                <View key={index} style={styles.gridCellWrapper}>
                  <Pressable
                    onPress={() => !isFuture && onSelectDate(item.fullDate)}
                    style={[
                      styles.gridDayCell,
                      !item.isCurrentMonth && { opacity: 0.2 },
                      isFuture && item.isCurrentMonth && { opacity: 0.4 },
                      isActive ? { backgroundColor: colors.primary, borderColor: colors.primary } : {
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
                      }
                    ]}
                  >
                    <Text style={[
                      styles.gridDayNum, 
                      { color: isActive ? (isDark ? '#1A1A18' : '#FFFFFF') : colors.text },
                      isActive && { fontWeight: '900' }
                    ]}>
                      {item.dayNum}
                    </Text>
                    
                    <View style={styles.gridCupContainer}>
                      <AttemptPill size={16} count={stats.count} limit={stats.limit} isActive={isActive} isDark={isDark} />
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: { width: '100%', marginBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
  monthLabel: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  toggleBtnText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  calendarContainer: { paddingBottom: 16, gap: 10 },
  calendarDayWrapper: { width: 54, height: 86 },
  calendarDay: { width: 54, height: 86, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, position: 'relative' },
  calendarDayActive: { width: 54, height: 86, borderRadius: 16, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, position: 'relative' },
  calendarDayNum: { fontSize: 17, fontWeight: '800' },
  calendarDayNumActive: { fontSize: 17, fontWeight: '900', color: '#FFFFFF' },
  calendarDayName: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  calendarDayNameActive: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' },
  indicatorContainer: { alignItems: 'center', justifyContent: 'center' },
  liveDot: { width: 6, height: 6, borderRadius: 3, borderWidth: 1 },

  gridContainer: { borderWidth: 1, borderRadius: 24, padding: 14 },
  gridWeekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  gridWeekText: { fontSize: 10, fontWeight: '900', width: '14.28%', textAlign: 'center', opacity: 0.6 },
  gridDaysWrapper: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', rowGap: 8 },
  gridCellWrapper: { width: '14.28%', aspectRatio: 1, padding: 2, alignItems: 'center', justifyContent: 'center' },
  gridDayCell: { width: '100%', height: '100%', borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'space-between', position: 'relative', paddingVertical: 6 },
  gridDayNum: { fontSize: 11, fontWeight: '700' },
  gridCupContainer: { width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
});
