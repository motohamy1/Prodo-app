import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import useTheme from '@/hooks/useTheme';
import { useTranslation } from '@/utils/i18n';
import { useAuth } from '@/hooks/useAuth';
import { createScrollStackStyles } from '@/assets/styles/scrollStack.styles';

interface ProductivityCardProps {
  streakDays: number;
  weeklyRate: number; // Percentage 0 - 100
  onStartFocus: () => void;
}

export const ProductivityCard: React.FC<ProductivityCardProps> = ({
  streakDays,
  weeklyRate,
  onStartFocus,
}) => {
  const { colors, isDarkMode } = useTheme();
  const { language } = useAuth();
  const { t, isArabic } = useTranslation(language);
  const styles = createScrollStackStyles(colors, isArabic, isDarkMode);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.iconBadge, { backgroundColor: isDarkMode ? 'rgba(229, 241, 157, 0.18)' : 'rgba(229, 241, 157, 0.35)' }]}>
            <Ionicons name="flame" size={20} color="#e5f19d" />
          </View>
          <View style={isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }}>
            <Text style={styles.cardTitle}>{t.productivityFocus}</Text>
            <Text style={styles.cardSubtitle}>
              {weeklyRate}% {t.weeklyRate}
            </Text>
          </View>
        </View>

        <View style={styles.headerPill}>
          <Ionicons name="flash" size={14} color="#e5f19d" />
          <Text style={[styles.headerPillText, { color: '#e5f19d' }]}>{streakDays}d Streak</Text>
        </View>
      </View>

      {/* Body: Streak and Focus Launcher */}
      <View style={styles.productivityRow}>
        {/* Streak Counter Box */}
        <View style={styles.streakCard}>
          <View style={styles.streakIconCircle}>
            <Ionicons name="flame" size={22} color="#16270E" />
          </View>
          <View style={isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }}>
            <Text style={styles.streakNumber}>{streakDays}</Text>
            <Text style={styles.streakLabel}>{t.dailyStreak}</Text>
          </View>
        </View>

        {/* Start Focus Button */}
        <TouchableOpacity
          style={styles.focusActionBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onStartFocus();
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="timer-outline" size={18} color="#FFFFFF" />
          <Text style={styles.focusActionBtnText}>{t.startFocus}</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.footerActionBtn}>
          <Ionicons name="trophy-outline" size={16} color={colors.textMuted} />
          <Text style={styles.footerActionText}>{t.statistics}</Text>
        </View>

        <Text style={styles.footerHintText}>Deep Focus Mode</Text>
      </View>
    </View>
  );
};

export default ProductivityCard;
