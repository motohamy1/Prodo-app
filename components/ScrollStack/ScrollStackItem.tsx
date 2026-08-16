import React, { ReactNode, useEffect } from 'react';
import { StyleProp, ViewStyle, TouchableOpacity, View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming 
} from 'react-native-reanimated';

interface ScrollStackItemProps {
  children: ReactNode;
  index: number;
  activeIndex: number;
  totalCards: number;
  onSelect: () => void;
  style?: StyleProp<ViewStyle>;
  isArabic?: boolean;
}

export const ScrollStackItem: React.FC<ScrollStackItemProps> = ({
  children,
  index,
  activeIndex,
  totalCards,
  onSelect,
  style,
}) => {
  const diff = index - activeIndex;

  const animTranslateY = useSharedValue(diff * 10);
  const animTranslateX = useSharedValue(0);
  const animScale = useSharedValue(1 - Math.max(0, diff) * 0.05);
  const animOpacity = useSharedValue(diff === 0 ? 1 : 0.8);

  useEffect(() => {
    if (diff === 0) {
      // Active Top Card
      animTranslateY.value = withSpring(0, { damping: 16, stiffness: 160 });
      animTranslateX.value = withSpring(0, { damping: 16, stiffness: 160 });
      animScale.value = withSpring(1.0, { damping: 16, stiffness: 160 });
      animOpacity.value = withTiming(1.0, { duration: 180 });
    } else if (diff > 0) {
      // Peeking cards stacked underneath
      const depth = Math.min(diff, 3);
      const targetTranslateY = depth * 11;
      const targetScale = 1 - depth * 0.045;
      const targetOpacity = Math.max(0.4, 0.95 - depth * 0.18);

      animTranslateY.value = withSpring(targetTranslateY, { damping: 16, stiffness: 160 });
      animTranslateX.value = withSpring(0, { damping: 16, stiffness: 160 });
      animScale.value = withSpring(targetScale, { damping: 16, stiffness: 160 });
      animOpacity.value = withTiming(targetOpacity, { duration: 180 });
    } else {
      // Past cards swiped off to the left
      animTranslateX.value = withSpring(-350, { damping: 16, stiffness: 160 });
      animTranslateY.value = withSpring(-10, { damping: 16, stiffness: 160 });
      animScale.value = withSpring(0.85, { damping: 16, stiffness: 160 });
      animOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [diff]);

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: animTranslateX.value },
        { translateY: animTranslateY.value },
        { scale: animScale.value },
      ],
      opacity: animOpacity.value,
      zIndex: diff === 0 ? 100 : Math.max(1, 80 - diff * 10),
    };
  });

  const isActive = diff === 0;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 16,
          right: 16,
          top: 0,
        },
        animatedCardStyle,
        style,
      ]}
      pointerEvents={isActive ? 'auto' : 'box-none'}
    >
      {/* If not active, allow tapping the visible peeking edge to select card */}
      {!isActive && (
        <TouchableOpacity
          onPress={onSelect}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          activeOpacity={0.9}
        />
      )}
      {children}
    </Animated.View>
  );
};

export default ScrollStackItem;
