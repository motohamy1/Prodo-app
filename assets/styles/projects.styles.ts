import { ColorScheme } from "@/hooks/useTheme";
import { StyleSheet, Platform } from "react-native";

// Preset palettes using the 4 core colors (#f6e5c9, #e5f19d, #defef9, #dbd4fd) and their combinations
export const CATEGORY_THEMES = [
  {
    bg: '#e5f19d', // Pastel Lime
    ink: '#16270E',
    subInk: '#334A23',
    diamond: '#1E2E14',
    icon: '#e5f19d',
    status: 'Completed',
  },
  {
    bg: '#defef9', // Ice Mint
    ink: '#0A2B3A',
    subInk: '#1D4D63',
    diamond: '#0F3547',
    icon: '#defef9',
    status: 'Running',
  },
  {
    bg: '#dbd4fd', // Soft Lavender
    ink: '#23173D',
    subInk: '#4C3463',
    diamond: '#2A1D44',
    icon: '#dbd4fd',
    status: 'In Progress',
  },
  {
    bg: '#f6e5c9', // Warm Cream
    ink: '#302010',
    subInk: '#5C3E25',
    diamond: '#3B2716',
    icon: '#f6e5c9',
    status: 'Active',
  },
  {
    bg: '#dbd4fd', // Lavender + Lime Combination
    ink: '#1F1436',
    subInk: '#43315B',
    diamond: '#1A290E',
    icon: '#e5f19d',
    status: 'Planning',
  },
  {
    bg: '#defef9', // Mint + Cream Combination
    ink: '#082522',
    subInk: '#1C4944',
    diamond: '#3A2818',
    icon: '#f6e5c9',
    status: 'Review',
  },
];

export const getCategoryTheme = (index: number) => {
  return CATEGORY_THEMES[index % CATEGORY_THEMES.length];
};

export const createProjectsStyles = (colors: ColorScheme, isArabic: boolean = false) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },

    // ─── Top Header ─────────────────────────────────────────────
    header: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'android' ? 10 : 4,
      paddingBottom: 16,
    },
    headerLeft: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.4,
    },
    headerSubtitle: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    headerActions: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      gap: 10,
    },
    headerActionBtn: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      ...colors.shadows.sm,
    },
    headerBtn: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      ...colors.shadows.sm,
    },

    // ─── Categories List ─────────────────────────────────────────
    categoriesGrid: {
      paddingHorizontal: 20,
      paddingBottom: 110,
      paddingTop: 8,
    },
    categoryItemContainer: {
      marginBottom: 20,
    },
    dashedDivider: {
      width: '100%',
      height: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      marginTop: 20,
      marginBottom: 4,
    },

    // Notched Stepped Card Geometry
    cardTopRow: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    },
    cardTabNotch: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 7,
      minWidth: 110,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTabNotchText: {
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: -0.1,
    },
    cardStepInfo: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 10,
      paddingBottom: 6,
      paddingRight: 6,
      paddingLeft: 6,
    },
    cardProgressTrack: {
      width: 48,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    cardProgressFill: {
      height: '100%',
      borderRadius: 2,
    },
    cardProgressText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.2,
    },

    cardMainBody: {
      borderBottomLeftRadius: 22,
      borderBottomRightRadius: 22,
      borderTopRightRadius: 22,
      paddingVertical: 18,
      paddingHorizontal: 18,
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardDiamondBadge: {
      width: 46,
      height: 46,
      borderRadius: 14,
      transform: [{ rotate: '45deg' }],
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isArabic ? 0 : 16,
      marginLeft: isArabic ? 16 : 0,
    },
    cardDiamondInner: {
      transform: [{ rotate: '-45deg' }],
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardContentBox: {
      flex: 1,
      paddingRight: isArabic ? 0 : 10,
      paddingLeft: isArabic ? 10 : 0,
    },
    cardTitleText: {
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: -0.3,
      marginBottom: 3,
    },
    cardSubtitleText: {
      fontSize: 13,
      fontWeight: '500',
      letterSpacing: -0.1,
    },
    cardMenuBtn: {
      padding: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Add Category Button
    addCategoryCardWrapper: {
      marginTop: 4,
      marginBottom: 20,
    },
    addCategoryBtn: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      flexDirection: isArabic ? 'row-reverse' : 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
      ...colors.shadows.sm,
    },
    addCategoryBtnText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },

    // Empty state
    emptyContainer: {
      paddingVertical: 48,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginTop: 14,
      textAlign: 'center',
    },
    emptySubText: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 6,
      textAlign: 'center',
      lineHeight: 20,
    },

    // ─── Sub-Categories & Projects Grid (Level 2 & 3) ────────────
    sectionLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.2,
      marginBottom: 14,
    },
    subCategoriesList: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    subCategoryCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      ...colors.shadows.sm,
    },
    subCategoryIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isArabic ? 0 : 12,
      marginLeft: isArabic ? 12 : 0,
    },
    subCategoryName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
    },

    // ─── Category Detail Space Hero ──────────────────────────────
    categoryHero: {
      marginHorizontal: 20,
      marginTop: 4,
      marginBottom: 18,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      ...colors.shadows.sm,
    },
    categoryHeroTop: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    categoryHeroLeft: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    categoryHeroIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryHeroTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.3,
    },
    categoryHeroSubtitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
      marginTop: 2,
    },
    categoryHeroActions: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
    },

    // ─── 3D Folder Pockets Grid ──────────────────────────────────
    projectsGrid: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 20,
      justifyContent: 'space-between',
    },
    projectGridCard: {
      width: '48%',
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      ...colors.shadows.sm,
    },
    projectGridIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    projectGridName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 10,
    },
    projectGridFooter: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    gridProgressBarTrack: {
      flex: 1,
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      overflow: 'hidden',
      marginRight: isArabic ? 0 : 8,
      marginLeft: isArabic ? 8 : 0,
    },
    gridProgressBarFill: {
      height: '100%',
      borderRadius: 2,
    },
    gridProgressText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
    },

    // ─── Category Lists Section ──────────────────────────────────
    categoryListsSection: {
      marginTop: 24,
      marginBottom: 20,
      paddingHorizontal: 20,
    },
    categoryListsGrid: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    categoryListCard: {
      width: '48%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      ...colors.shadows.sm,
    },
    categoryListCardInner: {
      width: '100%',
    },
    categoryListCardIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    categoryListCardTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    categoryListCardCount: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 3,
    },

    // ─── Project Detail Hero & Tabs ─────────────────────────────
    projectDetailCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
      marginHorizontal: 20,
      ...colors.shadows.sm,
    },
    detailHeroCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
      marginHorizontal: 20,
      ...colors.shadows.sm,
    },
    detailHeroHeader: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    projectIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    projectDescription: {
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 20,
      marginBottom: 16,
    },
    projectStatusPill: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 10,
      marginBottom: 12,
    },
    projectProgressSection: {
      marginBottom: 16,
    },
    progressInfo: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    progressPercent: {
      fontSize: 13,
      fontWeight: '700',
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
      flexDirection: isArabic ? 'row-reverse' : 'row',
      marginBottom: 16,
      backgroundColor: colors.bg,
      borderRadius: 14,
      padding: 4,
    },
    detailTab: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 10,
    },
    detailTabActive: {
      backgroundColor: colors.surface,
      ...colors.shadows.sm,
    },
    detailTabText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
    },
    detailTabTextActive: {
      color: colors.text,
      fontWeight: '700',
    },

    // Resources Section
    resourcesSection: {
      marginBottom: 16,
    },
    resourcesHeader: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    addResourceBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      ...colors.shadows.sm,
    },
    resourcesList: {
      gap: 8,
    },
    resourceItem: {
      backgroundColor: colors.bg,
      borderRadius: 12,
      padding: 12,
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
    },
    resourceItemText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },

    // Modals
    modalSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
      borderWidth: 1,
      borderColor: colors.border,
      ...colors.shadows.lg,
    },
    modalHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: 18,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.3,
      marginBottom: 16,
    },
    modalLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textMuted,
      marginBottom: 6,
      marginTop: 12,
    },
    modalInput: {
      backgroundColor: colors.bg,
      borderRadius: 14,
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
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '20',
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
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      marginTop: 20,
      ...colors.shadows.md,
    },
    modalPrimaryBtnText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primaryText || '#FFFFFF',
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

    // Back button
    backButton: {
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
      marginBottom: 16,
    },
    backButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
  });
};
