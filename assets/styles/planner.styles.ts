import { ColorScheme } from "@/hooks/useTheme";
import { StyleSheet } from "react-native";

export const createPlannerStyles = (colors: ColorScheme, isArabic: boolean = false) => {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 16,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    headerActionBtn: {
      width: 44,
      height: 44,
      borderRadius: colors.radii.md,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    sectionHeaderText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },

    // Year section
    yearSectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    yearSectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    yearSectionSubtitle: {
      fontSize: 13,
      color: colors.textMuted,
    },
    yearScrollContainer: {
      marginBottom: 24,
    },
    yearCarousel: {
      marginBottom: 24,
    },
    yearPage: {
      width: '100%',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    yearCard: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: colors.radii.lg,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      ...colors.shadows.sm,
    },
    yearCardActive: {
      borderColor: colors.primary,
    },
    yearCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    yearCardTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    yearCardBadge: {
      backgroundColor: colors.primary + '18',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: colors.radii.sm,
    },
    yearTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    yearTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    yearBadge: {
      backgroundColor: colors.primary + '18',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: colors.radii.sm,
    },
    yearBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.primary,
    },
    yearProgressRow: {
      flexDirection: 'row',
      gap: 16,
    },
    yearProgressCard: {
      flex: 1,
      backgroundColor: colors.bg,
      borderRadius: colors.radii.md,
      padding: 16,
    },
    yearProgressLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
      marginBottom: 8,
    },
    yearProgressValue: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    yearProgressSub: {
      fontSize: 11,
      color: colors.textMuted,
    },

    // Month grid
    monthGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 12,
      gap: 8,
      marginBottom: 24,
    },
    monthCard: {
      width: '100%',
      aspectRatio: 1.2,
      backgroundColor: colors.surface,
      borderRadius: colors.radii.md,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      ...colors.shadows.sm,
    },
    monthCardActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    selectedMonthCard: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    monthIndicator: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
      marginBottom: 4,
    },
    monthName: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
    },
    monthNameActive: {
      color: colors.primary,
    },
    selectedMonthName: {
      color: colors.primary,
      fontWeight: '600',
    },
    monthDayCount: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    monthStats: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
    },
    selectedMonthStats: {
      fontSize: 12,
      color: colors.primary,
      marginTop: 4,
    },

    // Day grid
    dayGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 12,
      gap: 6,
      marginBottom: 24,
    },
    dayCard: {
      width: '100%',
      aspectRatio: 1,
      backgroundColor: colors.surface,
      borderRadius: colors.radii.sm,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    dayCardActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    dayCardToday: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    todayCard: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    hasTaskCard: {},
    dayNumber: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    dayNumberActive: {
      color: colors.primary,
    },
    dayNumberToday: {
      color: colors.primaryText,
    },
    dayText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    todayText: {
      color: colors.primaryText,
      fontWeight: '600',
    },
    dayStats: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 1,
    },
    todayStats: {
      fontSize: 11,
      color: colors.primaryText + '99',
      marginTop: 1,
    },
    dayIndicator: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.primary,
      marginTop: 2,
    },

    // Day detail
    specificDayHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    specificDayTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    specificDaySubtitle: {
      fontSize: 13,
      color: colors.textMuted,
    },
    dayDetailContainer: {
      paddingHorizontal: 16,
      paddingBottom: 48,
    },
    dayDetailHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    dayDetailTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    dayDetailDate: {
      fontSize: 13,
      color: colors.textMuted,
    },
    dayListsSection: {
      marginBottom: 16,
    },
    dayListsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    dayListCard: {
      width: '47%',
      backgroundColor: colors.surface,
      borderRadius: colors.radii.md,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dayListCardIconWrap: {
      width: 32,
      height: 32,
      borderRadius: colors.radii.sm,
      backgroundColor: colors.primary + '12',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    dayListCardTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    dayListCardCount: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    daySectionCard: {
      backgroundColor: colors.surface,
      borderRadius: colors.radii.lg,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
      ...colors.shadows.sm,
    },
    daySectionCardTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    dayListItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dayListItemLast: {
      borderBottomWidth: 0,
    },
    dayListItemText: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    dayListItemDone: {
      textDecorationLine: 'line-through',
      color: colors.textMuted,
    },
    dayListAddBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 10,
    },
    dayListAddText: {
      fontSize: 13,
      color: colors.textMuted,
      fontWeight: '600',
    },
    horizontalGridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    gridTaskItem: {
      width: '45%',
      backgroundColor: colors.surface,
      borderRadius: colors.radii.md,
      padding: 12,
      marginRight: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    taskItemText: {
      fontSize: 13,
      color: colors.text,
    },
    dayTasksSection: {
      marginBottom: 8,
    },
    dayTasksHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    dayTasksHeaderText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    monthGoalsCard: {
      marginHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: colors.radii.lg,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      ...colors.shadows.sm,
      marginBottom: 16,
    },
    monthGoalsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    monthGoalsTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    monthGoalsStats: {
      flexDirection: 'row',
      gap: 16,
    },
    monthGoalsStat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    monthGoalsStatText: {
      fontSize: 13,
      color: colors.textMuted,
    },
    monthGoalsEmpty: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      paddingVertical: 16,
    },
    emptyState: {
      paddingVertical: 40,
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 8,
    },
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    addDayTaskContainer: {
      marginHorizontal: 16,
      marginBottom: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });

  return styles;
};
