import { Tabs, usePathname, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import useTheme from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/utils/i18n';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Warm Cream color requested by the user
const CREAM = '#fbe3c2';
const CREAM_INK = '#1B1917';
const DOCK_HEIGHT = 64;
const DOCK_CORNER = 28;
const BUBBLE_SIZE = 52;
const FAB_LIFT = 26;
const ICON_SIZE = 24;

type IconProps = { color: string; knockout: string; filled?: boolean };

// ─── 1. Home Icon ───
const HomeIcon = ({ color, knockout, filled }: IconProps) => (
  <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
    {filled ? (
      <>
        <Path
          d="M12 3.2L3.5 10.2A1.8 1.8 0 0 0 3 11.4V19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7.6a1.8 1.8 0 0 0-.5-1.2L12 3.2Z"
          fill={color}
        />
        <Rect x={10.8} y={13.8} width={2.4} height={5.2} rx={1.2} fill={knockout} />
      </>
    ) : (
      <Path
        d="M12 3.2L3.5 10.2A1.8 1.8 0 0 0 3 11.4V19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7.6a1.8 1.8 0 0 0-.5-1.2L12 3.2Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    )}
  </Svg>
);

// ─── 2. Planner / Tasks Icon ───
const PlannerIcon = ({ color, knockout, filled }: IconProps) => (
  <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
    <Rect
      x={3.5}
      y={3.5}
      width={17}
      height={17}
      rx={5.5}
      fill={filled ? color : 'none'}
      stroke={filled ? 'none' : color}
      strokeWidth={1.8}
    />
    <Path
      d="M7.8 9.5l1.6 1.6 2.6-2.6M14.2 9.5h2.6M7.8 14.5l1.6 1.6 2.6-2.6M14.2 14.5h2.6"
      stroke={filled ? knockout : color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ─── 3. Add Icon ───
const AddIcon = ({ color, filled }: IconProps) => (
  <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5.5v13M5.5 12h13"
      stroke={color}
      strokeWidth={filled ? 2.5 : 1.8}
      strokeLinecap="round"
    />
  </Svg>
);

// ─── 4. Projects / Chat Icon ───
const ProjectsIcon = ({ color, knockout, filled }: IconProps) => (
  <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 4C7.6 4 4 7.4 4 11.5c0 1.9.8 3.6 2 4.9L5.2 20l4-1.3c.9.5 1.8.8 2.8.8 4.4 0 8-3.4 8-7.5S16.4 4 12 4Z"
      fill={filled ? color : 'none'}
      stroke={filled ? 'none' : color}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
    <Circle cx={8.5} cy={11.5} r={1.1} fill={filled ? knockout : color} />
    <Circle cx={12} cy={11.5} r={1.1} fill={filled ? knockout : color} />
    <Circle cx={15.5} cy={11.5} r={1.1} fill={filled ? knockout : color} />
  </Svg>
);

// ─── 5. Profile / Settings Icon ───
const ProfileIcon = ({ color, filled }: IconProps) => (
  <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
    <Circle
      cx={12}
      cy={8}
      r={3.4}
      fill={filled ? color : 'none'}
      stroke={filled ? 'none' : color}
      strokeWidth={1.8}
    />
    <Path
      d="M6 19.2c0-2.8 2.7-4.7 6-4.7s6 1.9 6 4.7"
      fill={filled ? color : 'none'}
      stroke={filled ? 'none' : color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

// ─── Continuous G2 Spline Generator for Dynamic Notch ───
function getDockPath(width: number, height: number, cx: number): string {
  'worklet';
  if (width <= 0) return '';
  const notchDepth = 36;
  const notchSpan = 44;
  const topCorner = DOCK_CORNER;
  const bottomCorner = DOCK_CORNER;

  const leftNotchStart = Math.max(topCorner, cx - notchSpan);
  const rightNotchEnd = Math.min(width - topCorner, cx + notchSpan);

  return `M 0 ${height - bottomCorner} L 0 ${topCorner} Q 0 0 ${topCorner} 0 L ${leftNotchStart} 0 C ${cx - 34} 0, ${cx - 28} 14, ${cx - 22} 24 C ${cx - 15} ${notchDepth - 1}, ${cx - 8} ${notchDepth}, ${cx} ${notchDepth} C ${cx + 8} ${notchDepth}, ${cx + 15} ${notchDepth - 1}, ${cx + 22} 24 C ${cx + 28} 14, ${cx + 34} 0, ${rightNotchEnd} 0 L ${width - topCorner} 0 Q ${width} 0 ${width} ${topCorner} L ${width} ${height - bottomCorner} Q ${width} ${height} ${width - bottomCorner} ${height} L ${bottomCorner} ${height} Q 0 ${height} 0 ${height - bottomCorner} Z`;
}

// ─── Smooth Floating Dock Background with Dynamic Notch ───
const DockShape = ({
  width,
  height,
  fill,
  stroke,
  notchX,
}: {
  width: number;
  height: number;
  fill: string;
  stroke: string;
  notchX: SharedValue<number>;
}) => {
  const animatedProps = useAnimatedProps(() => {
    return {
      d: getDockPath(width, height, notchX.value),
    };
  });

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={styles.dockSvg}>
      <AnimatedPath animatedProps={animatedProps} fill={fill} stroke={stroke} strokeWidth={1} />
    </Svg>
  );
};

const DockBackground = ({
  dockHeight,
  fill,
  stroke,
  notchX,
  setWidth,
}: {
  dockHeight: number;
  fill: string;
  stroke: string;
  notchX: SharedValue<number>;
  setWidth: (w: number) => void;
}) => {
  const [layoutWidth, setLayoutWidth] = useState(0);

  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={(event) => {
        const w = event.nativeEvent.layout.width;
        setLayoutWidth(w);
        setWidth(w);
      }}
    >
      {layoutWidth > 0 && (
        <View style={[StyleSheet.absoluteFill, styles.dockAnchor]}>
          <DockShape
            width={layoutWidth}
            height={dockHeight}
            fill={fill}
            stroke={stroke}
            notchX={notchX}
          />
        </View>
      )}
    </View>
  );
};

// ─── Dynamic Tab Button with Active Warm Cream Elevation ───
interface DockTabButtonProps {
  isActive: boolean;
  onPress: (e: any) => void;
  accessibilityLabel?: string;
  label: string;
  activeLabelColor: string;
  inactiveLabelColor: string;
  paddingBottom: number;
  children: (isElevated: boolean) => React.ReactNode;
}

const DockTabButton = ({
  isActive,
  onPress,
  accessibilityLabel,
  label,
  activeLabelColor,
  inactiveLabelColor,
  paddingBottom,
  children,
}: DockTabButtonProps) => {
  const progress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(isActive ? 1 : 0, {
      damping: 15,
      stiffness: 240,
      mass: 0.8,
    });
  }, [isActive]);

  const elevatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [12, 0], Extrapolation.CLAMP);
    const scale = interpolate(progress.value, [0, 0.3, 1], [0.4, 0.7, 1], Extrapolation.CLAMP);
    const opacity = interpolate(progress.value, [0, 0.2, 1], [0, 0.3, 1], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  });

  const flatStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.3, 1], [1, 0.2, 0], Extrapolation.CLAMP);
    const scale = interpolate(progress.value, [0, 1], [1, 0.7], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={(event) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(event);
      }}
      style={styles.slot}
    >
      {/* Elevated Solid Warm Cream Bubble (When Active) */}
      <Animated.View
        style={[styles.elevatedAnchor, elevatedStyle]}
        pointerEvents={isActive ? 'auto' : 'none'}
      >
        <View style={styles.activeBubble}>
          {children(true)}
        </View>
        <Text style={[styles.tabLabel, { color: activeLabelColor }]}>{label}</Text>
      </Animated.View>

      {/* Flat Resting Icon in Dock (When Inactive) */}
      <Animated.View
        style={[styles.slotInner, { bottom: paddingBottom }, flatStyle]}
        pointerEvents={!isActive ? 'auto' : 'none'}
      >
        {children(false)}
        <Text style={[styles.tabLabel, { color: inactiveLabelColor }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
};

import ScreenBackground from '@/components/ScreenBackground';

const TabLayout = () => {
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { language } = useAuth();
  const { t } = useTranslation(language);
  const pathname = usePathname();
  const router = useRouter();

  const [containerWidth, setContainerWidth] = useState(0);
  const notchX = useSharedValue(0);

  const activeIndex = React.useMemo(() => {
    if (!pathname || pathname === '/' || pathname === '/index' || pathname === '/(tabs)' || pathname === '/(tabs)/index') return 0;
    if (pathname.includes('planner')) return 1;
    if (pathname.includes('add')) return 2;
    if (pathname.includes('projects')) return 3;
    if (pathname.includes('settings')) return 4;
    return 0;
  }, [pathname]);

  useEffect(() => {
    if (containerWidth > 0) {
      const tabWidth = containerWidth / 5;
      const targetX = tabWidth * (activeIndex + 0.5);
      notchX.value = withSpring(targetX, {
        damping: 18,
        stiffness: 220,
        mass: 0.8,
      });
    }
  }, [activeIndex, containerWidth]);

  const paddingBottom = Platform.OS === 'android' ? Math.max(insets.bottom, 10) : Math.max(insets.bottom, 24);
  const dockHeight = DOCK_HEIGHT + paddingBottom;
  const dockFill = isDarkMode ? '#191A20' : '#FFFFFF';
  const dockStroke = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const inactiveColor = isDarkMode ? '#8E92A0' : '#64748B';
  const activeLabelColor = isDarkMode ? '#E5E7EB' : '#1B1917';

  return (
    <ScreenBackground style={StyleSheet.absoluteFill}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarBackground: () => (
            <DockBackground
              dockHeight={dockHeight}
              fill={dockFill}
              stroke={dockStroke}
              notchX={notchX}
              setWidth={setContainerWidth}
            />
          ),
          tabBarStyle: {
            backgroundColor: 'transparent',
            position: 'absolute',
            borderTopWidth: 0,
            elevation: 0,
            height: FAB_LIFT + dockHeight,
            paddingBottom: 0,
            paddingTop: 0,
            left: 4,
            right: 4,
            bottom: 4,
          },
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabTodo,
          tabBarButton: () => (
            <DockTabButton
              isActive={activeIndex === 0}
              onPress={() => router.replace('/(tabs)')}
              accessibilityLabel={t.tabTodo}
              label={t.tabTodo}
              activeLabelColor={activeLabelColor}
              inactiveLabelColor={inactiveColor}
              paddingBottom={paddingBottom}
            >
              {(isElevated) => (
                <HomeIcon
                  color={isElevated ? CREAM_INK : inactiveColor}
                  knockout={CREAM}
                  filled={isElevated}
                />
              )}
            </DockTabButton>
          ),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: t.tabPlanner,
          tabBarButton: () => (
            <DockTabButton
              isActive={activeIndex === 1}
              onPress={() => router.replace('/(tabs)/planner')}
              accessibilityLabel={t.tabPlanner}
              label={t.tabPlanner}
              activeLabelColor={activeLabelColor}
              inactiveLabelColor={inactiveColor}
              paddingBottom={paddingBottom}
            >
              {(isElevated) => (
                <PlannerIcon
                  color={isElevated ? CREAM_INK : inactiveColor}
                  knockout={CREAM}
                  filled={isElevated}
                />
              )}
            </DockTabButton>
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: t.tabAdd,
          tabBarButton: () => (
            <DockTabButton
              isActive={activeIndex === 2}
              onPress={() => router.replace('/(tabs)/add')}
              accessibilityLabel={t.tabAdd}
              label={t.tabAdd}
              activeLabelColor={activeLabelColor}
              inactiveLabelColor={inactiveColor}
              paddingBottom={paddingBottom}
            >
              {(isElevated) => (
                <AddIcon
                  color={isElevated ? CREAM_INK : inactiveColor}
                  knockout={CREAM}
                  filled={isElevated}
                />
              )}
            </DockTabButton>
          ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: t.tabProjects,
          tabBarButton: () => (
            <DockTabButton
              isActive={activeIndex === 3}
              onPress={() => router.replace('/(tabs)/projects')}
              accessibilityLabel={t.tabProjects}
              label={t.tabProjects}
              activeLabelColor={activeLabelColor}
              inactiveLabelColor={inactiveColor}
              paddingBottom={paddingBottom}
            >
              {(isElevated) => (
                <ProjectsIcon
                  color={isElevated ? CREAM_INK : inactiveColor}
                  knockout={CREAM}
                  filled={isElevated}
                />
              )}
            </DockTabButton>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabSettings,
          tabBarButton: () => (
            <DockTabButton
              isActive={activeIndex === 4}
              onPress={() => router.replace('/(tabs)/settings')}
              accessibilityLabel={t.tabSettings}
              label={t.tabSettings}
              activeLabelColor={activeLabelColor}
              inactiveLabelColor={inactiveColor}
              paddingBottom={paddingBottom}
            >
              {(isElevated) => (
                <ProfileIcon
                  color={isElevated ? CREAM_INK : inactiveColor}
                  knockout={CREAM}
                  filled={isElevated}
                />
              )}
            </DockTabButton>
          ),
        }}
      />
    </Tabs>
  </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  dockSvg: {
    alignSelf: 'stretch',
  },
  dockAnchor: {
    justifyContent: 'flex-end',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  slotInner: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: DOCK_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  elevatedAnchor: {
    position: 'absolute',
    top: FAB_LIFT - BUBBLE_SIZE / 2 + 6,
    alignSelf: 'center',
    width: 72,
    height: BUBBLE_SIZE + 18,
    alignItems: 'center',
  },
  activeBubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: CREAM,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
  },
});

export default TabLayout;
