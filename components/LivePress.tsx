import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const PRESS_SPRING = { damping: 18, stiffness: 320, mass: 0.7 };

interface LivePressProps extends TouchableOpacityProps {
  staticPress?: boolean;
  pressScale?: number;
}

export default function LivePress({
  staticPress = false,
  pressScale = 0.96,
  style,
  onPressIn,
  onPressOut,
  activeOpacity = 0.92,
  ...props
}: LivePressProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      {...props}
      style={[style, animatedStyle]}
      activeOpacity={activeOpacity}
      onPressIn={(e) => {
        if (!staticPress) scale.value = withSpring(pressScale, PRESS_SPRING);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!staticPress) scale.value = withSpring(1, PRESS_SPRING);
        onPressOut?.(e);
      }}
    />
  );
}
