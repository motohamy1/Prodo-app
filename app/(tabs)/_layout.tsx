import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import useTheme from '@/hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/utils/i18n';

const AnimatedTabIcon = ({ name, focused, color, size }: { name: React.ComponentProps<typeof Ionicons>['name']; focused: boolean; color: string; size: number }) => {  const scale = useSharedValue(focused ? 1.15 : 1);
  useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, { damping: 12, stiffness: 260 });
  }, [focused, scale]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
};

const GLASS_RADIUS = 32;

const TabLayout = () => {
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { language } = useAuth();
  const { t } = useTranslation(language);
  const paddingBottom = Platform.OS === 'android' ? Math.max(insets.bottom, 12) : Math.max(insets.bottom, 30);
  const tabHeight = 60 + paddingBottom;
  const glassBackground =
    Platform.OS === 'ios'
      ? isDarkMode ? 'rgba(15, 23, 42, 0.55)' : 'rgba(252, 248, 237, 0.55)'
      : isDarkMode ? 'rgba(15, 23, 42, 0.92)' : 'rgba(252, 248, 237, 0.92)';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarBackground: () => (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderTopLeftRadius: GLASS_RADIUS,
              borderTopRightRadius: GLASS_RADIUS,
              overflow: 'hidden',
            }}
          >
            <BlurView
              intensity={isDarkMode ? 60 : 80}
              tint={isDarkMode ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          </View>
        ),
        tabBarStyle: {
          backgroundColor: glassBackground,
          position: 'absolute',
          borderTopLeftRadius: GLASS_RADIUS,
          borderTopRightRadius: GLASS_RADIUS,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.65)',
          borderLeftWidth: 0,
          borderRightWidth: 0,
          borderBottomWidth: 0,
          elevation: 16,
          height: tabHeight,
          paddingBottom: paddingBottom,
          paddingTop: 12,
          left: 0,
          right: 0,
          bottom: 0,
          shadowColor: isDarkMode ? '#000000' : colors.shadow,
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: isDarkMode ? 0.35 : 0.18,
          shadowRadius: 20,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabTodo,
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name={focused ? 'home' : 'home-outline'} focused={focused} size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: t.tabPlanner,
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name={focused ? 'calendar' : 'calendar-outline'} focused={focused} size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: t.tabAdd,
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name="add-circle" focused={focused} size={size + 4} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: t.tabProjects,
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name={focused ? 'briefcase' : 'briefcase-outline'} focused={focused} size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabSettings,
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name={focused ? 'settings' : 'settings-outline'} focused={focused} size={size} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabLayout;
