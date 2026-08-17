import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import useTheme from '@/hooks/useTheme';
import { useTranslation } from '@/utils/i18n';
import { useAuth } from '@/hooks/useAuth';
import { createScrollStackStyles } from '@/assets/styles/scrollStack.styles';

interface InsightsCardProps {
  insights: any;
  onPress: () => void;
}

export const InsightsCard: React.FC<InsightsCardProps> = ({
  insights,
  onPress,
}) => {
  const { colors, isDarkMode } = useTheme();
  const { language } = useAuth();
  const { t, isArabic } = useTranslation(language);
  const baseStyles = createScrollStackStyles(colors, isArabic, isDarkMode);

  const productivity = insights?.productivityScore ?? 85;
  const balance = insights?.balanceScore ?? 78;
  const streak = insights?.consistencyStreak ?? 0;
  const stress = insights?.stressLevel ?? 20;
  const neglectedCount = insights?.neglectedTopics?.length ?? 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.danger;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={baseStyles.card}
    >
      {/* Header */}
      <View style={baseStyles.cardHeader}>
        <View style={baseStyles.cardHeaderLeft}>
          <View
            style={[
              baseStyles.iconBadge,
              { backgroundColor: isDarkMode ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.15)' },
            ]}
          >
            <Ionicons name="analytics" size={20} color="#a855f7" />
          </View>
          <View style={isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }}>
            <Text style={baseStyles.cardTitle}>{t.tabInsights || (isArabic ? 'رؤى الذكاء الاصطناعي' : 'AI Insights & Wellbeing')}</Text>
            <Text style={baseStyles.cardSubtitle}>
              {productivity}% {isArabic ? 'درجة الإنتاجية' : 'Productivity Score'}
            </Text>
          </View>
        </View>

        <View style={[baseStyles.headerPill, { backgroundColor: isDarkMode ? 'rgba(168, 85, 247, 0.15)' : 'rgba(168, 85, 247, 0.12)' }]}>
          <Ionicons name="sparkles" size={13} color="#a855f7" />
          <Text style={[baseStyles.headerPillText, { color: '#a855f7' }]}>
            {isArabic ? 'تحليل ذكي' : 'AI Health'}
          </Text>
        </View>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={[styles.metricPill, { backgroundColor: isDarkMode ? '#1F222A' : '#F4F5F8' }]}>
          <View style={[styles.miniDot, { backgroundColor: getScoreColor(productivity) }]} />
          <Text style={[styles.metricVal, { color: colors.text }]}>{productivity}%</Text>
          <Text style={[styles.metricLbl, { color: colors.textMuted }]}>{isArabic ? 'إنتاجية' : 'Productivity'}</Text>
        </View>

        <View style={[styles.metricPill, { backgroundColor: isDarkMode ? '#1F222A' : '#F4F5F8' }]}>
          <View style={[styles.miniDot, { backgroundColor: getScoreColor(balance) }]} />
          <Text style={[styles.metricVal, { color: colors.text }]}>{balance}%</Text>
          <Text style={[styles.metricLbl, { color: colors.textMuted }]}>{isArabic ? 'توازن' : 'Balance'}</Text>
        </View>

        <View style={[styles.metricPill, { backgroundColor: isDarkMode ? '#1F222A' : '#F4F5F8' }]}>
          <View style={[styles.miniDot, { backgroundColor: colors.warning }]} />
          <Text style={[styles.metricVal, { color: colors.text }]}>{streak}d</Text>
          <Text style={[styles.metricLbl, { color: colors.textMuted }]}>{isArabic ? 'استمرار' : 'Streak'}</Text>
        </View>
      </View>

      {/* Focus & Neglected highlight strip */}
      {neglectedCount > 0 ? (
        <View
          style={[
            styles.alertBanner,
            {
              backgroundColor: isDarkMode ? 'rgba(234, 179, 8, 0.12)' : 'rgba(234, 179, 8, 0.14)',
              borderColor: isDarkMode ? 'rgba(234, 179, 8, 0.25)' : 'rgba(234, 179, 8, 0.3)',
            },
          ]}
        >
          <Ionicons name="alert-circle-outline" size={16} color="#eab308" />
          <Text style={[styles.alertText, { color: isDarkMode ? '#fef08a' : '#854d0e' }]} numberOfLines={1}>
            {neglectedCount} {isArabic ? 'مجالات تحتاج إلى انتباه اليوم' : 'areas need attention today'}
          </Text>
        </View>
      ) : (
        <View
          style={[
            styles.alertBanner,
            {
              backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.12)',
              borderColor: isDarkMode ? 'rgba(34, 197, 94, 0.25)' : 'rgba(34, 197, 94, 0.25)',
            },
          ]}
        >
          <Ionicons name="checkmark-circle-outline" size={16} color="#22c55e" />
          <Text style={[styles.alertText, { color: isDarkMode ? '#86efac' : '#15803d' }]} numberOfLines={1}>
            {isArabic ? 'كل مجالات التركيز متوازنة بشكل ممتاز' : 'All focus topics are on track'}
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={baseStyles.cardFooter}>
        <View style={baseStyles.footerActionBtn}>
          <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          <Text style={[baseStyles.footerActionText, { color: colors.primary }]}>
            {isArabic ? 'عرض التقرير الكامل ورادار التركيز' : 'View Full Insights & Radar'}
          </Text>
        </View>

        <Text style={baseStyles.footerHintText}>
          {isArabic ? 'تحديث يومي' : 'Daily Sync'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 10,
  },
  metricPill: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    gap: 3,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  metricLbl: {
    fontSize: 11,
    fontWeight: '500',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 4,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});

export default InsightsCard;
