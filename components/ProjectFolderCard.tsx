import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LivePress from '@/components/LivePress';
import useTheme from '@/hooks/useTheme';

export interface ProjectPreviewItem {
  text: string;
  isCompleted?: boolean;
}

export interface ProjectFolderCardProps {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  itemCount: number;
  progressPct?: number;
  previewItems?: ProjectPreviewItem[];
  index: number;
  isArabic?: boolean;
  onPress: () => void;
  onMenuPress: () => void;
}

// Preset vibrant folder colors inspired by the reference design and Prodo palette
export const FOLDER_PALETTES = [
  { bg: '#F59E0B', darkBg: '#D97706', tabBg: '#FBBF24', ink: '#1F1400', subInk: '#452A02', badgeBg: '#FEF3C7', iconColor: '#B45309' }, // Warm Amber Gold
  { bg: '#3B82F6', darkBg: '#2563EB', tabBg: '#60A5FA', ink: '#FFFFFF', subInk: '#DBEAFE', badgeBg: '#EFF6FF', iconColor: '#1D4ED8' }, // Cobalt Blue
  { bg: '#F97316', darkBg: '#EA580C', tabBg: '#FB923C', ink: '#1A0B00', subInk: '#431407', badgeBg: '#FFEDD5', iconColor: '#C2410C' }, // Tangy Orange
  { bg: '#A855F7', darkBg: '#9333EA', tabBg: '#C084FC', ink: '#FFFFFF', subInk: '#F3E8FF', badgeBg: '#FAF5FF', iconColor: '#7E22CE' }, // Royal Lilac
  { bg: '#F43F5E', darkBg: '#E11D48', tabBg: '#FB7185', ink: '#FFFFFF', subInk: '#FFE4E6', badgeBg: '#FFF1F2', iconColor: '#BE123C' }, // Coral Rose
  { bg: '#10B981', darkBg: '#059669', tabBg: '#34D399', ink: '#022C22', subInk: '#064E3B', badgeBg: '#ECFDF5', iconColor: '#047857' }, // Emerald Jade
  { bg: '#06B6D4', darkBg: '#0891B2', tabBg: '#22D3EE', ink: '#083344', subInk: '#164E63', badgeBg: '#ECFEFF', iconColor: '#0E7490' }, // Glacial Cyan
  { bg: '#dbd4fd', darkBg: '#c4b6f7', tabBg: '#e4deff', ink: '#1E143C', subInk: '#3E2F6B', badgeBg: '#FFFFFF', iconColor: '#5B41A8' }, // Soft Lavender
  { bg: '#e5f19d', darkBg: '#cbe068', tabBg: '#eff7b8', ink: '#1A290E', subInk: '#364B1D', badgeBg: '#FFFFFF', iconColor: '#476318' }, // Pastel Lime
  { bg: '#f6e5c9', darkBg: '#edd5af', tabBg: '#faeedb', ink: '#2B1C0B', subInk: '#4D361E', badgeBg: '#FFFFFF', iconColor: '#6B4A23' }, // Warm Cream
];

export const getFolderPalette = (index: number, customColor?: string) => {
  if (customColor) {
    const matched = FOLDER_PALETTES.find(p => p.bg.toLowerCase() === customColor.toLowerCase());
    if (matched) return matched;
  }
  return FOLDER_PALETTES[index % FOLDER_PALETTES.length];
};

export const ProjectFolderCard: React.FC<ProjectFolderCardProps> = ({
  name,
  color,
  icon = 'folder-outline',
  itemCount = 0,
  progressPct = 0,
  previewItems = [],
  index,
  isArabic = false,
  onPress,
  onMenuPress,
}) => {
  const palette = getFolderPalette(index, color);
  const itemsLabel = isArabic
    ? `${itemCount} ${itemCount === 1 ? 'عنصر' : 'عناصر'}`
    : `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`;

  // Dynamic preview snippets
  const taskSnippet1 = previewItems[0]?.text || name;
  const taskSnippet2 = previewItems[1]?.text || 'Active task';

  return (
    <View style={styles.cardWrapper}>
      <LivePress
        style={styles.pressableArea}
        activeOpacity={0.93}
        onPress={onPress}
        onLongPress={onMenuPress}
      >
        {/* ─── Layer 1: Back Folder Tab & Wall ─────────────────────────── */}
        <View style={styles.folderBackContainer}>
          {/* Top Notch Tab */}
          <View
            style={[
              styles.folderTab,
              { backgroundColor: palette.tabBg },
              isArabic ? styles.folderTabRTL : styles.folderTabLTR,
            ]}
          />
          {/* Folder Back Body */}
          <View style={[styles.folderBackWall, { backgroundColor: palette.darkBg }]} />
        </View>

        {/* ─── Layer 2: Stacked Preview Cards (Peeking Out) ───────────── */}
        <View style={[styles.peekingCardsLayer, isArabic && { flexDirection: 'row-reverse' }]} pointerEvents="none">
          {/* Card 1: Left Tilted Document Card */}
          <View
            style={[
              styles.previewCard,
              styles.previewCardLeft,
              { backgroundColor: '#FFFFFF' },
            ]}
          >
            <View style={styles.previewCardHeader}>
              <View style={[styles.miniDot, { backgroundColor: palette.bg }]} />
              <View style={[styles.miniLine, { width: 26, backgroundColor: '#CBD5E1' }]} />
            </View>
            <Text style={styles.miniText} numberOfLines={2}>
              {taskSnippet1}
            </Text>
            <View style={styles.previewCardFooter}>
              <View style={[styles.miniBar, { width: '70%', backgroundColor: '#E2E8F0' }]} />
            </View>
          </View>

          {/* Card 2: Center/Back Card */}
          <View
            style={[
              styles.previewCard,
              styles.previewCardCenter,
              { backgroundColor: '#F8FAFC' },
            ]}
          >
            <View style={styles.previewCenterArtwork}>
              <Ionicons name={icon as any} size={18} color={palette.iconColor} />
            </View>
            <Text style={[styles.miniText, { fontSize: 8, color: '#64748B', marginTop: 2 }]} numberOfLines={1}>
              {taskSnippet2}
            </Text>
          </View>

          {/* Card 3: Right Tilted Graphic/Sticker Card */}
          <View
            style={[
              styles.previewCard,
              styles.previewCardRight,
              { backgroundColor: '#FFFFFF' },
            ]}
          >
            <View style={[styles.cornerFold, { borderTopColor: palette.tabBg, borderRightColor: palette.darkBg }]} />
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <View style={[styles.iconChip, { backgroundColor: palette.badgeBg }]}>
                <Ionicons name={icon as any} size={16} color={palette.iconColor} />
              </View>
            </View>
          </View>
        </View>

        {/* ─── Layer 3: Front Folder Flap (The Front Pouch) ───────────── */}
        <View style={styles.frontPouchContainer}>
          {/* Asymmetrical Curved Top Flap Lip (Lower scoop on right to reveal cards) */}
          <View
            style={[
              styles.frontFlapLip,
              { backgroundColor: palette.bg },
              isArabic && styles.frontFlapLipRTL,
            ]}
          />

          {/* Front Pouch Body */}
          <View
            style={[
              styles.frontPouchBody,
              { backgroundColor: palette.bg },
              isArabic && { flexDirection: 'row-reverse' },
            ]}
          >
            {/* Folder Information */}
            <View style={[styles.infoColumn, isArabic && { alignItems: 'flex-end' }]}>
              <Text
                style={[
                  styles.folderTitle,
                  { color: palette.ink },
                  isArabic && { textAlign: 'right' },
                ]}
                numberOfLines={1}
              >
                {name}
              </Text>
              
              <Text
                style={[
                  styles.itemCountText,
                  { color: palette.subInk },
                  isArabic && { textAlign: 'right' },
                ]}
              >
                {itemsLabel}
              </Text>
            </View>

            {/* Bottom Right Project Badge / Sticker */}
            <View
              style={[
                styles.projectBadge,
                { backgroundColor: palette.badgeBg },
                isArabic ? { marginLeft: 0, marginRight: 6 } : { marginRight: 0, marginLeft: 6 },
              ]}
            >
              <Ionicons name={icon as any} size={16} color={palette.iconColor} />
            </View>
          </View>
        </View>
      </LivePress>
    </View>
  );
};

// ─── Add Project Folder Card (Dashed Ghost Folder) ─────────────────────────────

export const AddProjectFolderCard: React.FC<{
  onPress: () => void;
  isArabic?: boolean;
}> = ({ onPress, isArabic = false }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.cardWrapper}>
      <LivePress
        style={styles.pressableArea}
        activeOpacity={0.88}
        onPress={onPress}
      >
        <View style={[styles.addCardContainer, { borderColor: colors.border, backgroundColor: colors.surface + '60' }]}>
          {/* Top Ghost Tab */}
          <View style={[styles.addCardTab, { borderColor: colors.border }, isArabic ? styles.folderTabRTL : styles.folderTabLTR]} />

          {/* Body Content */}
          <View style={styles.addCardBody}>
            <View style={[styles.addIconCircle, { backgroundColor: colors.surface }]}>
              <Ionicons name="add" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.addCardTitle, { color: colors.text }]}>
              {isArabic ? 'مشروع جديد' : 'New Project'}
            </Text>
            <Text style={[styles.addCardSubtitle, { color: colors.textMuted }]}>
              {isArabic ? 'اضغط للإنشاء' : 'Tap to create'}
            </Text>
          </View>
        </View>
      </LivePress>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  pressableArea: {
    width: '100%',
    height: 172,
    borderRadius: 20,
  },

  // ─── Layer 1: Back Wall ───────────────────────────────────────────
  folderBackContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    overflow: 'hidden',
  },
  folderTab: {
    position: 'absolute',
    top: 0,
    width: '58%',
    height: 28,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  folderTabLTR: {
    left: 0,
  },
  folderTabRTL: {
    right: 0,
  },
  folderBackWall: {
    position: 'absolute',
    top: 14,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
  },

  // ─── Layer 2: Peeking Cards ────────────────────────────────────────
  peekingCardsLayer: {
    position: 'absolute',
    top: 8,
    left: 6,
    right: 6,
    height: 96,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 2,
  },
  previewCard: {
    position: 'absolute',
    width: 68,
    height: 72,
    borderRadius: 10,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.16,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  previewCardLeft: {
    left: 2,
    top: 6,
    transform: [{ rotate: '-8deg' }],
    zIndex: 1,
  },
  previewCardCenter: {
    alignSelf: 'center',
    top: 0,
    width: 62,
    height: 70,
    transform: [{ rotate: '1deg' }],
    zIndex: 2,
  },
  previewCardRight: {
    right: 4,
    top: 4,
    width: 64,
    height: 74,
    transform: [{ rotate: '9deg' }],
    zIndex: 3,
  },
  previewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  miniDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  miniLine: {
    height: 3,
    borderRadius: 1.5,
  },
  miniText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#334155',
    lineHeight: 11,
  },
  previewCardFooter: {
    marginTop: 'auto',
  },
  miniBar: {
    height: 3,
    borderRadius: 1.5,
  },
  previewCenterArtwork: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerFold: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderTopWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    borderTopLeftRadius: 3,
  },
  iconChip: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Layer 3: Front Folder Pouch ───────────────────────────────────
  frontPouchContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 104,
    zIndex: 5,
  },
  frontFlapLip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 24,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 28,
    transform: [{ skewY: '-2deg' }],
  },
  frontFlapLipRTL: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 18,
    transform: [{ skewY: '2deg' }],
  },
  frontPouchBody: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    bottom: 0,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  infoColumn: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  folderTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
    opacity: 0.9,
  },
  projectBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  // ─── Add Ghost Card ────────────────────────────────────────────────
  addCardContainer: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCardTab: {
    position: 'absolute',
    top: -2,
    width: '50%',
    height: 18,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderStyle: 'dashed',
  },
  addCardBody: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  addIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  addCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  addCardSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export default ProjectFolderCard;
