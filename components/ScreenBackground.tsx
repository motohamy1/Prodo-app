import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Rect } from 'react-native-svg';
import useTheme from '@/hooks/useTheme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ScreenBackgroundProps {
  children?: React.ReactNode;
  style?: any;
}

export const ScreenBackground: React.FC<ScreenBackgroundProps> = ({ children, style }) => {
  const { colors, isDarkMode } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }, style]}>
      {isDarkMode && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${SCREEN_WIDTH} ${SCREEN_HEIGHT}`}
            style={StyleSheet.absoluteFill}
          >
            <Defs>
              {/* Primary Top-Right Diagonal Ambient Glow (matches reference image atmospheric light) */}
              <RadialGradient
                id="ambientTopRightGlow"
                cx="85%"
                cy="12%"
                rx="65%"
                ry="45%"
                fx="85%"
                fy="12%"
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0%" stopColor="#dbd4fd" stopOpacity="0.10" />
                <Stop offset="35%" stopColor="#c7d2fe" stopOpacity="0.06" />
                <Stop offset="70%" stopColor="#818cf8" stopOpacity="0.02" />
                <Stop offset="100%" stopColor={colors.bg} stopOpacity="0" />
              </RadialGradient>

              {/* Secondary Soft Mid-Body Sheen */}
              <RadialGradient
                id="ambientMidSheen"
                cx="18%"
                cy="52%"
                rx="50%"
                ry="35%"
                fx="18%"
                fy="52%"
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0%" stopColor="#defef9" stopOpacity="0.035" />
                <Stop offset="60%" stopColor={colors.bg} stopOpacity="0" />
              </RadialGradient>

              {/* Soft Diagonal Studio Sheen */}
              <LinearGradient id="topSheen" x1="100%" y1="0%" x2="0%" y2="55%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.03" />
                <Stop offset="45%" stopColor={colors.bg} stopOpacity="0" />
              </LinearGradient>
            </Defs>

            {/* Ambient Lighting Layers */}
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#ambientTopRightGlow)" />
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#ambientMidSheen)" />
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#topSheen)" />
          </Svg>
        </View>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ScreenBackground;
