import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '@/hooks/useTheme';
import { useTranslation } from '@/utils/i18n';
import { useAuth } from '@/hooks/useAuth';
import { createScrollStackStyles } from '@/assets/styles/scrollStack.styles';

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

  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.iconBadge, { backgroundColor: isDarkMode ? 'rgba(246, 229, 201, 0.18)' : 'rgba(246, 229, 201, 0.35)' }]}>
            <Ionicons name="stats-chart" size={20} color="#f6e5c9" />
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
      </View>

      {/* Body: Monthly Stats Grid */}
      <View style={styles.monthlyStatsGrid}>
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
                { width: `${Math.min(100, Math.max(0, completionRate))}%`, backgroundColor: '#dbd4fd' }
              ]} 
            />
          </View>
        </View>

        {/* Stat 2: Active Goals */}
        <View style={styles.monthlyStatItem}>
          <Text style={[styles.monthlyStatNumber, { color: '#f6e5c9' }]}>{activeGoalsCount}</Text>
          <Text style={styles.monthlyStatLabel}>{t.activeGoals}</Text>
          <View style={styles.monthlyProgressBarContainer}>
            <View 
              style={[
                styles.monthlyProgressBarFill, 
                { width: activeGoalsCount > 0 ? '75%' : '0%', backgroundColor: '#f6e5c9' }
              ]} 
            />
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.footerActionBtn}>
          <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
          <Text style={styles.footerActionText}>{t.tapToOpenPlanner}</Text>
        </View>

        <Ionicons name={isArabic ? 'arrow-back' : 'arrow-forward'} size={16} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
};

export default MonthlyOverviewCard;
