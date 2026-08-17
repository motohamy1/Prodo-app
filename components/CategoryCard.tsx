import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LivePress from '@/components/LivePress';
import { getCategoryTheme } from '@/assets/styles/projects.styles';
import useTheme from '@/hooks/useTheme';

export interface CategoryCardProps {
  id: string;
  name: string;
  icon?: string;
  index: number;
  subtitle?: string;
  status?: string;
  progressPct?: number;
  isArabic?: boolean;
  onPress: () => void;
  onMenuPress: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  name,
  icon = 'briefcase-outline',
  index,
  subtitle,
  status,
  progressPct = 0,
  isArabic = false,
  onPress,
  onMenuPress,
}) => {
  const { colors } = useTheme();
  const theme = getCategoryTheme(index);
  const displayStatus = status || theme.status;
  const displaySubtitle = subtitle || 'Category workspace';

  return (
    <View style={styles.cardContainer}>
      <LivePress
        style={styles.pressableArea}
        activeOpacity={0.94}
        onPress={onPress}
        onLongPress={onMenuPress}
      >
        {/* ─── Top Stepped Row ─────────────────────────────────────── */}
        <View style={[styles.topRow, isArabic && { flexDirection: 'row-reverse' }]}>
          {/* Elevated Top Notch Tab */}
          <View style={[styles.notchTab, { backgroundColor: theme.bg }]}>
            <Text style={[styles.notchTabText, { color: theme.ink }]}>
              {displayStatus}
            </Text>
          </View>

          {/* Top Right Stepped Info (Progress Bar & Percentage) */}
          <View style={[styles.stepRightInfo, isArabic && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, Math.max(0, progressPct))}%`, backgroundColor: theme.bg },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.text }]}>
              {progressPct < 10 && progressPct > 0 ? `0${progressPct}%` : `${progressPct}%`}
            </Text>
          </View>
        </View>

        {/* ─── Main Card Body ──────────────────────────────────────── */}
        <View
          style={[
            styles.mainBody,
            { backgroundColor: theme.bg },
            colors.shadows.sm,
            isArabic && { flexDirection: 'row-reverse' },
          ]}
        >
          {/* Left Rotated Diamond Badge */}
          <View
            style={[
              styles.diamondBadge,
              { backgroundColor: theme.diamond },
              isArabic ? { marginLeft: 16 } : { marginRight: 16 },
            ]}
          >
            <View style={styles.diamondInner}>
              <Ionicons name={icon as any} size={22} color={theme.icon} />
            </View>
          </View>

          {/* Center Category Title & Subtitle */}
          <View style={[styles.contentBox, isArabic ? { paddingLeft: 8 } : { paddingRight: 8 }]}>
            <Text
              style={[styles.titleText, { color: theme.ink }, isArabic && { textAlign: 'right' }]}
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text
              style={[styles.subtitleText, { color: theme.subInk }, isArabic && { textAlign: 'right' }]}
              numberOfLines={1}
            >
              {displaySubtitle}
            </Text>
          </View>

          {/* Right 3-Dots Action Menu */}
          <TouchableOpacity
            style={styles.menuBtn}
            activeOpacity={0.7}
            onPress={onMenuPress}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={theme.ink} />
          </TouchableOpacity>
        </View>
      </LivePress>

      {/* ─── Subtle Dashed Divider ─────────────────────────────────── */}
      <View style={[styles.dashedDivider, { borderColor: colors.border }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    marginBottom: 4,
  },
  pressableArea: {
    width: '100%',
  },

  // Top Stepped Row
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  notchTab: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 7,
    minWidth: 105,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notchTabText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  stepRightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 6,
    paddingRight: 6,
    paddingLeft: 6,
  },
  progressTrack: {
    width: 48,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  // Main Card Body
  mainBody: {
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    borderTopRightRadius: 22,
    paddingVertical: 27,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  diamondBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    transform: [{ rotate: '45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  diamondInner: {
    transform: [{ rotate: '-45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentBox: {
    flex: 1,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  subtitleText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
    opacity: 0.85,
  },
  menuBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Dashed Divider
  dashedDivider: {
    width: '100%',
    height: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 18,
    marginBottom: 4,
  },
});

export default CategoryCard;
