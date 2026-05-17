import { useAuth } from '@/hooks/useAuth';
import useTheme, { getNeoShadow } from '@/hooks/useTheme';
import { useTranslation } from '@/utils/i18n';
import React from 'react';
import { Platform, StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

interface FloatingActionButtonProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function FloatingActionButton({ onPress, style }: FloatingActionButtonProps) {
  const { colors } = useTheme();
  const { language } = useAuth();
  const { isArabic } = useTranslation(language);
  const raisedLg = getNeoShadow(colors, 'raisedLg', isArabic);

  return (
    <TouchableOpacity
      style={[
        styles.fab, 
        { 
          backgroundColor: colors.primary,
          shadowColor: raisedLg.shadowColor,
          shadowOffset: raisedLg.shadowOffset,
          shadowOpacity: raisedLg.shadowOpacity,
          shadowRadius: raisedLg.shadowRadius,
          elevation: raisedLg.elevation,
        }, 
        style
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[
        styles.text, 
        { 
          color: colors.surfaceText,
          fontSize: 12,
          fontWeight: '800',
          fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif-medium'
        }
      ]}>
        {isArabic ? 'إضافة مهمة' : 'Add a Task'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    height: 42,
    paddingHorizontal: 24,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 6,
    zIndex: 100,
  },
  text: {
    textAlign: 'center',
  },
});
