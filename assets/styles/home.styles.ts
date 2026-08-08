import { ColorScheme } from "@/hooks/useTheme";
import { Platform, StyleSheet } from "react-native";

export const createHomeStyles = (colors: ColorScheme, isArabic: boolean = false) => {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    headerLeft: {
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 4,
    },
    headerDate: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
      letterSpacing: 0.3,
    },
    headerGreeting: {
      fontSize: 32,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: -0.5,
    },
    headerRight: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      ...colors.shadows.sm,
    },
    scrollContent: {
      paddingVertical: 8,
      paddingBottom: 110,
    },

    // Today's Plan Banner
    todaysPlanCard: {
      backgroundColor: colors.primary,
      borderRadius: 24,
      ...colors.shadows.md,
      padding: 24,
      marginHorizontal: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    todaysPlanTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 4,
    },
    todaysPlanSubtitle: {
      fontSize: 13,
      color: colors.primaryText + 'CC',
      fontWeight: '600',
    },

    // Filter Pills
    pillsContainer: {
      flexDirection: 'row',
      marginHorizontal: 16,
      backgroundColor: colors.bg,
      borderRadius: colors.radii.lg,
      padding: 4,
      gap: 4,
      marginBottom: 24,
    },
    pill: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: colors.radii.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pillActive: {
      backgroundColor: colors.surface,
      ...colors.shadows.sm,
    },
    pillInactive: {
      backgroundColor: 'transparent',
    },
    pillText: {
      fontSize: 13,
      fontWeight: '600',
    },
    pillSubText: {
      fontSize: 11,
      fontWeight: '600',
      marginTop: 1,
      letterSpacing: 0.2,
    },

    // Section
    sectionTitleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    sectionTitleText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },

    // Card container
    cardContainer: {
      marginStart: 16,
      marginEnd: 16,
      marginBottom: 12,
      flexDirection: 'row',
    },
    timelineColumn: {
      width: 52,
      alignItems: 'center',
      paddingEnd: 4,
    },
    timelineTimeTop: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      textAlign: 'center',
      flexWrap: 'wrap',
    },
    timelineTimeBottom: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      textAlign: 'center',
      flexWrap: 'wrap',
    },
    timelineTime: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textMuted,
    },
    card: {
      flex: 1,
      borderRadius: colors.radii.lg,
      padding: 16,
      backgroundColor: colors.taskInProgressBg,
      borderWidth: 1,
      borderColor: colors.border,
      ...colors.shadows.sm,
    },
    cardNotDone: {
      borderLeftWidth: 3,
      borderLeftColor: colors.danger,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 10,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      flex: 1,
      writingDirection: 'auto',
    },

    statusAndActionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    badge: {
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: colors.radii.sm,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "600",
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: colors.radii.md,
      gap: 4,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionBtnText: {
      fontSize: 13,
      fontWeight: '600',
    },
    iconBtn: {
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: colors.radii.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dividerDashed: {
      height: 1,
      borderStyle: "dashed",
      borderWidth: 1,
      borderColor: colors.border,
      marginVertical: 8,
    },
    projectRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
      gap: 8,
    },
    projectText: {
      fontSize: 13,
      fontStyle: "italic",
      color: colors.textMuted,
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    footerStats: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statText: {
      fontSize: 12,
      color: colors.text + '99',
      fontWeight: '500',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyContainer: {
      paddingVertical: 48,
      paddingHorizontal: 24,
      alignItems: "center",
    },
    emptyTitle: {
      marginTop: 14,
      fontSize: 16,
      color: colors.text,
      fontWeight: "700",
      textAlign: "center",
    },
    emptyText: {
      marginTop: 6,
      fontSize: 14,
      color: colors.textMuted,
      fontWeight: "500",
      textAlign: "center",
      lineHeight: 20,
    },
    emptyAction: {
      marginTop: 16,
      backgroundColor: colors.primary,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: colors.radii.md,
      ...colors.shadows.sm,
    },
    emptyActionText: {
      color: colors.primaryText,
      fontSize: 14,
      fontWeight: "700",
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      padding: 16,
      borderRadius: colors.radii.lg,
      gap: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
      ...colors.shadows.sm,
    },
    addButtonText: {
      fontSize: 15,
      color: colors.text,
      fontWeight: '600',
    },

    addInputContainer: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      padding: 16,
      borderRadius: colors.radii.lg,
      marginBottom: 0,
      borderWidth: 1,
      borderColor: colors.border,
      ...colors.shadows.sm,
    },
    addInput: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    fab: {
      height: 44,
      paddingHorizontal: 10,
      borderRadius: colors.radii.lg,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      ...colors.shadows.md,
    },
  });

  return styles;
};
