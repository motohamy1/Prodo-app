import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import MonthCreditCard, { CARD_H, getMonthPalette } from './MonthCreditCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DECK_CONTAINER_H = 470;
const SWIPE_THRESHOLD = 15;
const AUTO_RETURN_DELAY = 4000; // 4 seconds auto-return timer

interface MonthWalletDeckProps {
  months: string[];
  currentYear: number;
  currentMonthIndex: number;
  getTasksForMonth: (monthIndex: number) => any[];
  onSelectMonth: (monthIndex: number) => void;
  isArabic?: boolean;
  t: {
    current: string;
    task: string;
    tasksThisMonth: string;
    empty: string;
  };
}

// Vertical Stack Card Item
const VerticalStackCardItem: React.FC<{
  monthName: string;
  idx: number;
  focusedIndex: number;
  currentYear: number;
  currentMonthIndex: number;
  tasks: any[];
  isArabic?: boolean;
  t: any;
  onSelect: () => void;
  onOpen: () => void;
}> = ({
  monthName,
  idx,
  focusedIndex,
  currentYear,
  currentMonthIndex,
  tasks,
  isArabic,
  t,
  onSelect,
  onOpen,
}) => {
    const diff = idx - focusedIndex;
    const isFocused = diff === 0;
    const isUpcoming = diff > 0;
    const isPrevious = diff < 0;

    const completedTasks = tasks.filter((task) => task.status === 'done').length;
    const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    const isCurrent = idx === currentMonthIndex;

    // Compute 3D Vertical Offsets
    let targetTranslateY = 0;
    let targetScale = 1.0;
    let targetOpacity = 1.0;
    let zIndex = 50;

    if (isFocused) {
      targetTranslateY = 0;
      targetScale = 1.0;
      targetOpacity = 1.0;
      zIndex = 50;
    } else if (isUpcoming) {
      // Upcoming months stack ABOVE the center card
      const depth = Math.min(diff, 4);
      targetScale = 1 - depth * 0.04;
      targetTranslateY = -(depth * 36);
      zIndex = 50 - diff;
      targetOpacity = 1.0;
    } else if (isPrevious) {
      // Previous months stack BELOW the center card
      const depth = Math.min(-diff, 4);
      targetScale = 1 - depth * 0.04;
      targetTranslateY = depth * 36;
      zIndex = 50 - (-diff);
      targetOpacity = 1.0;
    }

    // Animated shared values
    const animTranslateY = useSharedValue(targetTranslateY);
    const animScale = useSharedValue(targetScale);
    const animOpacity = useSharedValue(targetOpacity);

    useEffect(() => {
      animTranslateY.value = withSpring(targetTranslateY, { damping: 18, stiffness: 180 });
      animScale.value = withSpring(targetScale, { damping: 18, stiffness: 180 });
      animOpacity.value = withTiming(targetOpacity, { duration: 180 });
    }, [targetTranslateY, targetScale, targetOpacity]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateY: animTranslateY.value },
        { scale: animScale.value },
      ],
      opacity: animOpacity.value,
      zIndex,
    }));

    // Only render cards within range for performance
    if (Math.abs(diff) > 4) return null;

    return (
      <Animated.View
        style={[
          styles.cardPositioner,
          animatedStyle,
        ]}
        pointerEvents="box-none"
      >
        <MonthCreditCard
          month={monthName}
          monthIndex={idx}
          year={currentYear}
          taskCount={tasks.length}
          completionRate={completionRate}
          isFocused={isFocused}
          isCurrent={isCurrent}
          isPrevious={isPrevious}
          isArabic={isArabic}
          palette={getMonthPalette(idx)}
          currentLabel={t.current}
          tasksLabel={tasks.length === 1 ? t.task : t.tasksThisMonth}
          emptyLabel={t.empty}
          onPress={isFocused ? onOpen : onSelect}
        />

        {/* Touch interceptor on peeking cards to bring them to focus when tapped */}
        {!isFocused && (
          <TouchableOpacity
            onPress={onSelect}
            style={StyleSheet.absoluteFill}
            activeOpacity={0.9}
          />
        )}
      </Animated.View>
    );
  };

export const MonthWalletDeck: React.FC<MonthWalletDeckProps> = ({
  months,
  currentYear,
  currentMonthIndex,
  getTasksForMonth,
  onSelectMonth,
  isArabic = false,
  t,
}) => {
  const [focusedIndex, setFocusedIndex] = useState(currentMonthIndex);
  const focusedIndexRef = useRef(currentMonthIndex);
  focusedIndexRef.current = focusedIndex;

  const autoReturnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetAutoReturnTimer = useCallback(() => {
    if (autoReturnTimer.current) {
      clearTimeout(autoReturnTimer.current);
    }
    // Schedule auto-return after 4 seconds if user is away from current month card
    autoReturnTimer.current = setTimeout(() => {
      if (focusedIndexRef.current !== currentMonthIndex) {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        setFocusedIndex(currentMonthIndex);
      }
    }, AUTO_RETURN_DELAY);
  }, [currentMonthIndex]);

  const goToMonth = useCallback((targetIndex: number) => {
    const clamped = Math.max(0, Math.min(months.length - 1, targetIndex));
    if (clamped !== focusedIndexRef.current) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setFocusedIndex(clamped);
      if (clamped !== currentMonthIndex) {
        resetAutoReturnTimer();
      } else if (autoReturnTimer.current) {
        clearTimeout(autoReturnTimer.current);
      }
    }
  }, [months.length, currentMonthIndex, resetAutoReturnTimer]);

  useEffect(() => {
    return () => {
      if (autoReturnTimer.current) {
        clearTimeout(autoReturnTimer.current);
      }
    };
  }, []);

  // Robust PanResponder that captures vertical swipe gestures inside the parent ScrollView
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 8;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        // Capture vertical move events before parent ScrollView intercepts
        return Math.abs(gestureState.dy) > 8 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderGrant: () => {
        if (autoReturnTimer.current) {
          clearTimeout(autoReturnTimer.current);
        }
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_, gestureState) => {
        const current = focusedIndexRef.current;
        if (gestureState.dy < -SWIPE_THRESHOLD) {
          // Swiping UP -> Go to next month (upcoming)
          goToMonth(current + 1);
        } else if (gestureState.dy > SWIPE_THRESHOLD) {
          // Swiping DOWN -> Go to previous month
          goToMonth(current - 1);
        }
      },
    })
  ).current;

  return (
    <View style={styles.deckWrapper}>
      {/* ─── Controls & Quick Month Navigator (Placed ABOVE the stack, high zIndex) ── */}
      <View style={styles.deckHeaderContainer}>
        <View style={[styles.deckNavRow, isArabic && styles.rowReverse]}>
          <TouchableOpacity
            style={[styles.navArrowBtn, focusedIndex === 0 && styles.navArrowBtnDisabled]}
            onPress={() => goToMonth(focusedIndex - 1)}
            disabled={focusedIndex === 0}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isArabic ? 'chevron-forward' : 'chevron-back'}
              size={18}
              color={focusedIndex === 0 ? '#4B5563' : '#FFFFFF'}
            />
          </TouchableOpacity>

          <View style={styles.deckNavCenter}>
            <Text style={styles.deckNavMonthTitle}>
              {months[focusedIndex]} {currentYear}
            </Text>
            <Text style={styles.deckNavHint}>
              {isArabic ? 'اضغط البطاقة للتفاصيل — اسحب للتنقل' : 'Tap card to open · Swipe up/down'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.navArrowBtn, focusedIndex === months.length - 1 && styles.navArrowBtnDisabled]}
            onPress={() => goToMonth(focusedIndex + 1)}
            disabled={focusedIndex === months.length - 1}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isArabic ? 'chevron-back' : 'chevron-forward'}
              size={18}
              color={focusedIndex === months.length - 1 ? '#4B5563' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── 3D Vertical Perspective Stack Viewport ─────────────────── */}
      <View style={styles.stackViewport} {...panResponder.panHandlers}>
        {months.map((monthName, idx) => {
          const tasks = getTasksForMonth(idx);

          return (
            <VerticalStackCardItem
              key={monthName}
              monthName={monthName}
              idx={idx}
              focusedIndex={focusedIndex}
              currentYear={currentYear}
              currentMonthIndex={currentMonthIndex}
              tasks={tasks}
              isArabic={isArabic}
              t={t}
              onSelect={() => goToMonth(idx)}
              onOpen={() => onSelectMonth(idx)}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  deckWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 4,
  },
  deckHeaderContainer: {
    width: '100%',
    zIndex: 999,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  deckNavRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  deckNavCenter: {
    alignItems: 'center',
  },
  deckNavMonthTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  deckNavHint: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 3,
  },
  navArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  navArrowBtnDisabled: {
    opacity: 0.35,
  },
  stackViewport: {
    width: SCREEN_WIDTH - 32,
    height: DECK_CONTAINER_H,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  cardPositioner: {
    position: 'absolute',
    width: '100%',
    height: CARD_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MonthWalletDeck;
