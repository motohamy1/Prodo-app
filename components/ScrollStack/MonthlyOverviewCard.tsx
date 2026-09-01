import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '@/hooks/useTheme';
import { useTranslation } from '@/utils/i18n';
import { useAuth } from '@/hooks/useAuth';
import { createScrollStackStyles, CARD_ACCENTS, createCardFrame } from '@/assets/styles/scrollStack.styles';

interface MonthlyOverviewCardProps {
  monthName: string;
  year: number;
  completedTasks: number;
  totalTasks: number;
  activeGoalsCount: number;
  onPress: () => void;
}

export const MonthlyOverviewCard: React.FC<MonthlyOverviewCardProps> = ({
  monthName,
  year,
  completedTasks,
  totalTasks,
  activeGoalsCount,
  onPress,
}) => {
  const { colors, isDarkMode } = useTheme();
  const { language } = useAuth();
  const { t, isArabic } = useTranslation(language);
  const styles = createScrollStackStyles(colors, isArabic, isDarkMode);
  const frame = createCardFrame(CARD_ACCENTS.cream, isDarkMode, colors.secondaryText);
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const handlePress = () => {
    onPress();
  };

  return (
    <View style={[styles.card, { borderColor: frame.edge }]}>
      {/* Header */}
      <TouchableOpacity 
        style={styles.cardHeader} 
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.iconBadge, { backgroundColor: frame.badgeBg }]}>
            <Ionicons name="stats-chart" size={20} color={frame.badgeFg} />
          </View>
          <View style={isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }}>
            <Text style={styles.cardTitle}>{t.monthlyOverview}</Text>
            <Text style={styles.cardSubtitle}>
              {monthName} {year}
            </Text>
          </View>
        </View>

        <View style={styles.headerPill}>
          <Ionicons name="open-outline" size={14} color={colors.primary} />
          <Text style={styles.headerPillText}>{t.tabPlanner}</Text>
        </View>
      </TouchableOpacity>

      {/* Body: Monthly Stats Grid */}
      <TouchableOpacity 
        style={styles.monthlyStatsGrid}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        {/* Stat 1: Tasks Completion */}
        <View style={styles.monthlyStatItem}>
          <Text style={styles.monthlyStatNumber}>{completionRate}%</Text>
          <Text style={styles.monthlyStatLabel}>
            {completedTasks}/{totalTasks} {t.completed}
          </Text>
          <View style={styles.monthlyProgressBarContainer}>
            <View 
              style={[
                styles.monthlyProgressBarFill, 
                { width: `${Math.min(100, Math.max(0, completionRate))}%`, backgroundColor: isDarkMode ? CARD_ACCENTS.lavender.pastel : CARD_ACCENTS.lavender.ink }
              ]} 
            />
          </View>
        </View>

        {/* Stat 2: Active Goals */}
        <View style={styles.monthlyStatItem}>
          <Text style={[styles.monthlyStatNumber, { color: frame.fg }]}>{activeGoalsCount}</Text>
          <Text style={styles.monthlyStatLabel}>{t.activeGoals}</Text>
          <View style={styles.monthlyProgressBarContainer}>
            <View 
              style={[
                styles.monthlyProgressBarFill, 
                { width: activeGoalsCount > 0 ? '75%' : '0%', backgroundColor: frame.fg }
              ]} 
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Footer */}
      <TouchableOpacity 
        style={styles.cardFooter}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.footerActionBtn}>
          <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
          <Text style={styles.footerActionText}>{t.tapToOpenPlanner}</Text>
        </View>

        <Ionicons name={isArabic ? 'arrow-back' : 'arrow-forward'} size={16} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

export default MonthlyOverviewCard;
