import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '@/hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
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

const TabLayout = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { language } = useAuth();
  const { t } = useTranslation(language);
  const paddingBottom = Platform.OS === 'android' ? Math.max(insets.bottom, 12) : Math.max(insets.bottom, 30);
  const tabHeight = 60 + paddingBottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bg,
          position: 'absolute',
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          borderTopWidth: 1,
          borderTopColor: colors.border + '66',
          borderLeftWidth: 0,
          borderRightWidth: 0,
          borderBottomWidth: 0,
          elevation: 0,
          height: tabHeight,
          paddingBottom: paddingBottom,
          paddingTop: 12,
          left: 0,
          right: 0,
          bottom: 0,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
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
