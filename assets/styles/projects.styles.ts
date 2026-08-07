import { ColorScheme } from "@/hooks/useTheme";
import { StyleSheet } from "react-native";

export const createProjectsStyles = (colors: ColorScheme) => {
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
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionCount: {
      fontSize: 13,
      color: colors.textMuted,
    },

    // --- Categories ---
    categoriesGrid: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    categoryCard: {
      backgroundColor: colors.surface,
      borderRadius: colors.radii.lg,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      ...colors.shadows.sm,
    },
    categoryCardInner: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryAddBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryIconWrap: {
      width: 48,
      height: 48,
      borderRadius: colors.radii.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    categoryInfo: {
      flex: 1,
    },
    categoryCardName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    categoryCardCount: {
      fontSize: 12,
      color: colors.textMuted,
    },
    categoryDeleteBtn: {
      width: 36,
      height: 36,
      borderRadius: colors.radii.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 24,
    },
    categoryIconContainer: {
      width: 40,
      height: 40,
      borderRadius: colors.radii.md,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    categoryName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    categoryCount: {
      fontSize: 12,
      color: colors.textMuted,
    },
    addCategoryCard: {
      backgroundColor: 'transparent',
      borderRadius: colors.radii.lg,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 110,
    },
    addCategoryText: {
      fontSize: 13,
      color: colors.textMuted,
      fontWeight: '600',
      marginTop: 8,
    },

    // --- Sub-categories ---
    subCategoriesList: {
      marginBottom: 20,
      paddingHorizontal: 16,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textMuted,
      marginBottom: 12,
      paddingHorizontal: 16,
    },
    subCategoryCard: {
      backgroundColor: colors.surface,
      borderRadius: colors.radii.md,
      padding: 14,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      ...colors.shadows.sm,
    },
    subCategoryIconWrap: {
      width: 36,
      height: 36,
      borderRadius: colors.radii.sm,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    subCategoryName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    subCategoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 24,
    },
    subCategoryIconContainer: {
      width: 32,
      height: 32,
      borderRadius: colors.radii.sm,
      backgroundColor: colors.primary + '12',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },

    // --- Projects grid ---
    projectsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 16,
      gap: 12,
    },
    projectGridCard: {
      width: '47%',
      backgroundColor: colors.surface,
      borderRadius: colors.radii.lg,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      ...colors.shadows.sm,
    },
    projectGridIcon: {
      width: 48,
      height: 48,
      borderRadius: colors.radii.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    projectGridName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    projectGridFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    gridProgressBarTrack: {
      flex: 1,
      height: 5,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
      marginRight: 8,
    },
    gridProgressBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    gridProgressText: {
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '600',
    },
    projectCard: {
      width: '47%',
      backgroundColor: colors.surface,
      borderRadius: colors.radii.lg,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      ...colors.shadows.sm,
    },
    projectIconContainer: {
      width: 36,
      height: 36,
      borderRadius: colors.radii.sm,
      backgroundColor: colors.primary + '12',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    projectName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    projectStatusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: colors.radii.sm,
      backgroundColor: colors.primary + '15',
      marginBottom: 8,
    },
    projectStatusText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.primary,
    },
    projectProgressContainer: {
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      overflow: 'hidden',
      marginBottom: 8,
    },
    projectProgressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    projectProgressText: {
      fontSize: 11,
      color: colors.textMuted,
    },

    // --- Category lists ---
    categoryListsSection: {
      marginTop: 20,
      marginBottom: 16,
      paddingHorizontal: 16,
    },
    categoryListsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    categoryListCard: {
      width: '47%',
      backgroundColor: colors.surface,
      borderRadius: colors.radii.md,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryListCardInner: {
      width: '100%',
    },
    categoryListCardIconWrap: {
      width: 32,
      height: 32,
      borderRadius: colors.radii.sm,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    categoryListCardTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    categoryListCardCount: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },

    // --- Project detail ---
    projectDetailCard: {
      backgroundColor: colors.surface,
      borderRadius: colors.radii.lg,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
      marginHorizontal: 16,
      ...colors.shadows.sm,
    },
    detailHeroCard: {
      backgroundColor: colors.surface,
      borderRadius: colors.radii.lg,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
      marginHorizontal: 16,
      ...colors.shadows.sm,
    },
    detailHeroHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    projectIconWrap: {
      width: 48,
      height: 48,
      borderRadius: colors.radii.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    projectDescription: {
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 22,
      marginBottom: 16,
    },
    projectStatusPill: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: colors.radii.sm,
      marginBottom: 12,
    },
    projectProgressSection: {
      marginBottom: 16,
    },
    progressInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    progressPercent: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    progressBarTrack: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 16,
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    detailTabsRow: {
      flexDirection: 'row',
      marginBottom: 16,
      backgroundColor: colors.bg,
      borderRadius: colors.radii.md,
      padding: 4,
    },
    detailTab: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: colors.radii.sm,
    },
    detailTabActive: {
      backgroundColor: colors.surface,
    },
    detailTabText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
    },
    detailTabTextActive: {
      color: colors.primary,
    },

    // --- Project detail: resources ---
    resourcesSection: {
      marginBottom: 16,
    },
    resourcesHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    addResourceBtn: {
      width: 44,
      height: 44,
      borderRadius: colors.radii.md,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    resourcesList: {
      gap: 8,
    },
    resourceItem: {
      backgroundColor: colors.bg,
      borderRadius: colors.radii.md,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    resourceItemType: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 10,
    },
    resourceItemText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    resourceIconWrap: {
      width: 32,
      height: 32,
      borderRadius: colors.radii.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    resourceCard: {
      backgroundColor: colors.bg,
      borderRadius: colors.radii.md,
      padding: 12,
      marginBottom: 8,
    },
    resourceTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    resourceUrl: {
      fontSize: 12,
      color: colors.primary,
    },
    resourceNote: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
    },

    // --- Project detail: add resource modal ---
    addResourceTypeRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    resourceTypeBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: colors.radii.sm,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    resourceTypeBtnSelected: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    resourceTypeBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
    },
    resourceTypeBtnTextSelected: {
      color: colors.primary,
    },

    // --- Project detail: checklists ---
    checklistSection: {
      marginBottom: 16,
    },
    checklistHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    checklistItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 4,
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    checklistItemText: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    checklistItemTextDone: {
      textDecorationLine: 'line-through',
      color: colors.textMuted,
    },
    checklistAddRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 4,
    },
    checklistAddInput: {
      flex: 1,
      backgroundColor: colors.bg,
      borderRadius: colors.radii.sm,
      padding: 10,
      fontSize: 14,
      color: colors.text,
    },
    checklistAddBtn: {
      width: 36,
      height: 36,
      borderRadius: colors.radii.sm,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    checklistItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 4,
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    checklistItemDone: {
      textDecorationLine: 'line-through',
      color: colors.textMuted,
    },
    checklistAddText: {
      fontSize: 13,
      color: colors.textMuted,
      fontWeight: '600',
    },

    // --- Task list items (in project detail) ---
    taskListItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: colors.surface,
      borderRadius: colors.radii.md,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    taskStatusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 10,
    },
    taskItemText: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    taskStatusPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: colors.radii.sm,
    },
    taskStatusPillText: {
      fontSize: 10,
      fontWeight: '700',
    },

    // --- Delete ---
    deleteProjectBtn: {
      backgroundColor: colors.dangerBg,
      borderRadius: colors.radii.md,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.danger + '30',
      marginTop: 16,
      marginHorizontal: 16,
    },
    deleteProjectBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.danger,
    },

    // --- Modals ---
    modalSheet: {
      backgroundColor: colors.surfaceHigh,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: 40,
      maxHeight: '80%',
    },
    modalHandle: {
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    modalLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
      marginBottom: 6,
      marginTop: 12,
    },
    modalInput: {
      backgroundColor: colors.bg,
      borderRadius: colors.radii.md,
      padding: 14,
      fontSize: 15,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconPicker: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    iconOption: {
      width: 44,
      height: 44,
      borderRadius: colors.radii.sm,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '15',
    },
    colorPicker: {
      flexDirection: 'row',
      gap: 10,
      paddingVertical: 4,
    },
    colorSwatch: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    colorSwatchSelected: {
      borderColor: colors.text,
    },
    modalPrimaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: colors.radii.md,
      padding: 16,
      alignItems: 'center',
      marginTop: 20,
    },
    modalPrimaryBtnText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primaryText,
    },
    modalSecondaryBtn: {
      padding: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    modalSecondaryBtnText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textMuted,
    },

    // --- Back button ---
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
      marginBottom: 16,
    },
    backButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },

    // --- Safe / Header extras ---
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    headerLeft: {
      flex: 1,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textMuted,
    },
    headerBtn: {
      width: 44,
      height: 44,
      borderRadius: colors.radii.md,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },

    // --- Empty / loading ---
    emptyContainer: {
      paddingVertical: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptySubText: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 4,
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
    emptyText: {
      fontSize: 15,
      color: colors.textMuted,
      fontWeight: '500',
      marginTop: 10,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });

  return styles;
};
