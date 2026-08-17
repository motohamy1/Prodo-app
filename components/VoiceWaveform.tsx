import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface VoiceWaveformProps {
  isListening: boolean;
  audioLevel?: number; // 0 to 1
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  isListening = false,
  audioLevel = 0.5,
}) => {
  const phase1 = useSharedValue(0);
  const phase2 = useSharedValue(0);
  const amplitude = useSharedValue(isListening ? 1 : 0);
  const targetLevel = useSharedValue(0.5);

  useEffect(() => {
    if (audioLevel !== undefined) {
      targetLevel.value = withTiming(Math.max(0.2, Math.min(1.2, audioLevel)), { duration: 150 });
    }
  }, [audioLevel]);

  useEffect(() => {
    if (isListening) {
      // Smoothly ramp up amplitude when user speaks / active
      amplitude.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) });

      phase1.value = withRepeat(
        withTiming(2 * Math.PI, {
          duration: 2200,
          easing: Easing.linear,
        }),
        -1,
        false
      );

      phase2.value = withRepeat(
        withTiming(2 * Math.PI, {
          duration: 1800,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    } else {
      // Smoothly return to a calm, flat resting line when idle
      amplitude.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) });
    }
  }, [isListening, amplitude, phase1, phase2]);

  const animatedWaveProps1 = useAnimatedProps(() => {
    const p = phase1.value;
    const a = amplitude.value * targetLevel.value;
    const w = 360;
    const midY = 45;

    if (a <= 0.001) {
      return { d: `M 0 ${midY} L ${w} ${midY}` };
    }

    const y1 = midY - 24 * a * Math.sin(p + 0.5);
    const y2 = midY + 28 * a * Math.cos(p + 1.2);
    const y3 = midY - 18 * a * Math.sin(p + 2.4);

    const d = `M 0 ${midY} 
      Q ${w * 0.2} ${midY - 4 * a} ${w * 0.35} ${y1} 
      T ${w * 0.65} ${y2} 
      T ${w * 0.85} ${y3} 
      T ${w} ${midY}`;

    return { d };
  });

  const animatedWaveProps2 = useAnimatedProps(() => {
    const p = phase2.value;
    const a = amplitude.value;
    const w = 360;
    const midY = 45;

    if (a <= 0.001) {
      return { d: `M 0 ${midY} L ${w} ${midY}` };
    }

    const y1 = midY + 20 * a * Math.cos(p);
    const y2 = midY - 22 * a * Math.sin(p + 1.6);
    const y3 = midY + 14 * a * Math.cos(p + 2.8);

    const d = `M 0 ${midY} 
      Q ${w * 0.25} ${midY + 5 * a} ${w * 0.42} ${y1} 
      T ${w * 0.68} ${y2} 
      T ${w * 0.88} ${y3} 
      T ${w} ${midY}`;

    return { d };
  });

  const animatedWaveProps3 = useAnimatedProps(() => {
    const p = phase1.value * 0.8;
    const a = amplitude.value * 0.9;
    const w = 360;
    const midY = 45;

    if (a <= 0.001) {
      return { d: `M 0 ${midY} L ${w} ${midY}` };
    }

    const y1 = midY - 12 * a * Math.cos(p + 0.8);
    const y2 = midY + 16 * a * Math.sin(p + 1.9);

    const d = `M 0 ${midY} 
      Q ${w * 0.3} ${midY} ${w * 0.5} ${y1} 
      T ${w * 0.75} ${y2} 
      T ${w} ${midY}`;

    return { d };
  });

  return (
    <View style={styles.container}>
      <Svg width="100%" height={90} viewBox="0 0 360 90">
        <Defs>
          {/* Main Cyan-Magenta-Indigo Gradient */}
          <LinearGradient id="siriGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
            <Stop offset="25%" stopColor="#38BDF8" stopOpacity="0.85" />
            <Stop offset="50%" stopColor="#6366F1" stopOpacity="0.95" />
            <Stop offset="75%" stopColor="#EC4899" stopOpacity="0.85" />
            <Stop offset="100%" stopColor="#EC4899" stopOpacity="0" />
          </LinearGradient>

          {/* Cyan-Purple Gradient */}
          <LinearGradient id="siriGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#06B6D4" stopOpacity="0" />
            <Stop offset="30%" stopColor="#3B82F6" stopOpacity="0.8" />
            <Stop offset="60%" stopColor="#A855F7" stopOpacity="0.9" />
            <Stop offset="85%" stopColor="#F43F5E" stopOpacity="0.7" />
            <Stop offset="100%" stopColor="#F43F5E" stopOpacity="0" />
          </LinearGradient>

          {/* Core White Line Gradient */}
          <LinearGradient id="coreLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.2" />
            <Stop offset="20%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
            <Stop offset="80%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.2" />
          </LinearGradient>
        </Defs>

        {/* Outer Glow Wave Layer 1 (Active only when listening) */}
        {isListening && (
          <AnimatedPath
            animatedProps={animatedWaveProps1}
            stroke="url(#siriGrad1)"
            strokeWidth={14}
            strokeOpacity={0.45}
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Secondary Fluid Wave Layer 2 (Active only when listening) */}
        {isListening && (
          <AnimatedPath
            animatedProps={animatedWaveProps2}
            stroke="url(#siriGrad2)"
            strokeWidth={9}
            strokeOpacity={0.7}
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Tertiary Overlay Wave Layer 3 (Active only when listening) */}
        {isListening && (
          <AnimatedPath
            animatedProps={animatedWaveProps3}
            stroke="url(#siriGrad1)"
            strokeWidth={5}
            strokeOpacity={0.85}
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Center Glowing Hairline Wave - Resting or undulating */}
        <AnimatedPath
          animatedProps={animatedWaveProps1}
          stroke={isListening ? 'url(#coreLineGrad)' : 'rgba(255, 255, 255, 0.25)'}
          strokeWidth={isListening ? 2.4 : 1.2}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VoiceWaveform;
