import React, { Children, useState, useCallback, useRef } from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleProp, 
  ViewStyle, 
  PanResponder 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import useTheme from '@/hooks/useTheme';
import { createScrollStackStyles } from '@/assets/styles/scrollStack.styles';
import ScrollStackItem from './ScrollStackItem';

interface ScrollStackProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onCardChange?: (index: number) => void;
  isArabic?: boolean;
}

const SWIPE_THRESHOLD = 35;

export const ScrollStack: React.FC<ScrollStackProps> = ({
  children,
  style,
  onCardChange,
  isArabic = false,
}) => {
  const { colors, isDarkMode } = useTheme();
  const styles = createScrollStackStyles(colors, isArabic, isDarkMode);

  const cardArray = Children.toArray(children);
  const totalCards = cardArray.length;

  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  activeIndexRef.current = activeIndex;

  const goToCard = useCallback((targetIndex: number) => {
    const nextIdx = (targetIndex + totalCards) % totalCards;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveIndex(nextIdx);
    onCardChange?.(nextIdx);
  }, [totalCards, onCardChange]);

  // PanResponder to handle horizontal swipe gestures on the card deck
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Capture swipe if horizontal movement is dominant
        return Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        const isSwipeLeft = gestureState.dx < -SWIPE_THRESHOLD;
        const isSwipeRight = gestureState.dx > SWIPE_THRESHOLD;

        const current = activeIndexRef.current;

        if (isArabic) {
          if (isSwipeRight) {
            goToCard(current + 1);
          } else if (isSwipeLeft) {
            goToCard(current - 1);
          }
        } else {
          if (isSwipeLeft) {
            goToCard(current + 1);
          } else if (isSwipeRight) {
            goToCard(current - 1);
          }
        }
      },
    })
  ).current;

  return (
    <View style={[styles.container, style]}>
      {/* Stacked Cards Container */}
      <View style={styles.stackContainer} {...panResponder.panHandlers}>
        {cardArray.map((child, idx) => (
          <ScrollStackItem
            key={idx}
            index={idx}
            activeIndex={activeIndex}
            totalCards={totalCards}
            onSelect={() => goToCard(idx)}
            isArabic={isArabic}
          >
            {child}
          </ScrollStackItem>
        ))}
      </View>

      {/* Pagination & Next/Prev Controls */}
      {totalCards > 1 && (
        <View style={styles.paginationRow}>
          {/* Previous Arrow */}
          <TouchableOpacity
            onPress={() => goToCard(activeIndex - 1)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
            style={{ paddingHorizontal: 6 }}
          >
            <Ionicons 
              name={isArabic ? "chevron-forward" : "chevron-back"} 
              size={16} 
              color={colors.textMuted} 
            />
          </TouchableOpacity>

          {/* Dots */}
          {cardArray.map((_, dotIdx) => {
            const isActive = dotIdx === activeIndex;
            return (
              <TouchableOpacity
                key={dotIdx}
                onPress={() => goToCard(dotIdx)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                style={[
                  styles.paginationDot,
                  isActive && styles.paginationDotActive,
                ]}
              />
            );
          })}

          {/* Next Arrow */}
          <TouchableOpacity
            onPress={() => goToCard(activeIndex + 1)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
            style={{ paddingHorizontal: 6 }}
          >
            <Ionicons 
              name={isArabic ? "chevron-back" : "chevron-forward"} 
              size={16} 
              color={colors.textMuted} 
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ScrollStack;
