import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
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
  tag?: string;
  itemCount: number;
  doneCount?: number;
  progressPct?: number;
  previewItems?: ProjectPreviewItem[];
  index: number;
  isArabic?: boolean;
  onPress: () => void;
  onMenuPress: () => void;
}

// Preset vibrant folder colors inspired by the reference design (Yellow, Blue, Orange, Purple, Red, Green, etc.)
export const FOLDER_PALETTES = [
  { bg: '#FBBF24', darkBg: '#D97706', tabBg: '#F59E0B', ink: '#1F1400', subInk: '#5C3804', badgeBg: '#FEF3C7', iconColor: '#B45309' }, // Golden Yellow (like "Friends" in reference)
  { bg: '#3B82F6', darkBg: '#1D4ED8', tabBg: '#2563EB', ink: '#FFFFFF', subInk: '#DBEAFE', badgeBg: '#EFF6FF', iconColor: '#1D4ED8' }, // Royal Blue (like "Astronomy")
  { bg: '#F97316', darkBg: '#C2410C', tabBg: '#EA580C', ink: '#1A0B00', subInk: '#5C1D06', badgeBg: '#FFEDD5', iconColor: '#C2410C' }, // Tangerine Orange (like "Jokes lol")
  { bg: '#A78BFA', darkBg: '#7C3AED', tabBg: '#8B5CF6', ink: '#1E143C', subInk: '#3E2F6B', badgeBg: '#EDE9FE', iconColor: '#6D28D9' }, // Lavender Purple (like "Cartoons")
  { bg: '#FB7185', darkBg: '#E11D48', tabBg: '#F43F5E', ink: '#2A040D', subInk: '#5E0D1F', badgeBg: '#FFE4E6', iconColor: '#BE123C' }, // Coral Pink/Red (like "Tasty food")
  { bg: '#34D399', darkBg: '#059669', tabBg: '#10B981', ink: '#022C22', subInk: '#064E3B', badgeBg: '#D1FAE5', iconColor: '#047857' }, // Fresh Green (like "Sport")
  { bg: '#38BDF8', darkBg: '#0284C7', tabBg: '#0EA5E9', ink: '#082F49', subInk: '#0C4A6E', badgeBg: '#E0F2FE', iconColor: '#0369A1' }, // Sky Cyan
  { bg: '#e5f19d', darkBg: '#a8be36', tabBg: '#cbe068', ink: '#1A290E', subInk: '#364B1D', badgeBg: '#FFFFFF', iconColor: '#476318' }, // Pastel Lime (Prodo theme)
  { bg: '#dbd4fd', darkBg: '#9e8ef8', tabBg: '#c4b6f7', ink: '#1E143C', subInk: '#3E2F6B', badgeBg: '#FFFFFF', iconColor: '#5B41A8' }, // Soft Lavender (Prodo theme)
  { bg: '#f6e5c9', darkBg: '#d8b982', tabBg: '#edd5af', ink: '#2B1C0B', subInk: '#4D361E', badgeBg: '#FFFFFF', iconColor: '#6B4A23' }, // Warm Cream (Prodo theme)
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
  tag,
  itemCount = 0,
  doneCount = 0,
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

  // Clean hashtag format: e.g. #Work, #Design, etc.
  const rawTag = tag || name;
  const displayTag = rawTag.startsWith('#') ? rawTag : `#${rawTag.replace(/\s+/g, '')}`;

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
          {/* Folder Back Body Wall */}
          <View style={[styles.folderBackWall, { backgroundColor: palette.darkBg }]} />
        </View>

        {/* ─── Layer 2: Stacked Preview Cards (Peeking Out of Pocket) ── */}
        <View style={[styles.peekingCardsLayer, isArabic && { flexDirection: 'row-reverse' }]} pointerEvents="none">
          {/* Card 1: Left Tilted Card (Project Hashtag preview) */}
          <View
            style={[
              styles.previewCard,
              styles.previewCardLeft,
              { backgroundColor: '#FFFFFF' },
            ]}
          >
            <View style={styles.previewCardHeader}>
              <Ionicons name="pricetag" size={8} color={palette.iconColor} />
              <View style={[styles.miniLine, { width: 16, backgroundColor: palette.bg }]} />
            </View>
            <Text style={[styles.miniHashtagText, { color: palette.darkBg }]} numberOfLines={2}>
              {displayTag}
            </Text>
            <View style={styles.previewCardFooter}>
              <View style={[styles.miniBar, { width: '80%', backgroundColor: '#E2E8F0' }]} />
            </View>
          </View>

          {/* Card 2: Center/Back Card (Item Numbers / Count inside project) */}
          <View
            style={[
              styles.previewCard,
              styles.previewCardCenter,
              { backgroundColor: '#F8FAFC' },
            ]}
          >
            <View style={[styles.centerCountContainer, { backgroundColor: palette.badgeBg }]}>
              <Text style={[styles.miniCountNumber, { color: palette.iconColor }]}>
                {itemCount}
              </Text>
            </View>
            <Text style={[styles.miniCountLabel, { color: '#64748B' }]} numberOfLines={1}>
              {isArabic ? 'عناصر' : 'items'}
            </Text>
          </View>

          {/* Card 3: Right Tilted Card (Icon/Sticker preview) */}
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
                <Ionicons name={icon as any} size={15} color={palette.iconColor} />
              </View>
            </View>
          </View>
        </View>

        {/* ─── Layer 3: Front Folder Pouch (The Front Flap) ───────────── */}
        <View style={styles.frontPouchContainer}>
          {/* Scooped Top Lip (higher on left, scooped down on right to reveal cards) */}
          <View
            style={[
              styles.frontFlapLip,
              { backgroundColor: palette.bg },
              isArabic ? styles.frontFlapLipRTL : styles.frontFlapLipLTR,
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
            {/* Folder Information (Title & Item Count) */}
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
                isArabic ? { marginLeft: 0, marginRight: 4 } : { marginRight: 0, marginLeft: 4 },
              ]}
            >
              <Ionicons name={icon as any} size={15} color={palette.iconColor} />
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
        <View style={[styles.addCardContainer, { borderColor: colors.border, backgroundColor: colors.surface + '70' }]}>
          {/* Top Ghost Tab */}
          <View style={[styles.addCardTab, { borderColor: colors.border }, isArabic ? styles.folderTabRTL : styles.folderTabLTR]} />

          {/* Body Content */}
          <View style={styles.addCardBody}>
            <View style={[styles.addIconCircle, { backgroundColor: colors.surface }]}>
              <Ionicons name="add" size={22} color={colors.primary} />
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
    width: '100%',
    marginBottom: 16,
  },
  pressableArea: {
    width: '100%',
    height: 155,
    borderRadius: 18,
  },

  // ─── Layer 1: Back Wall ───────────────────────────────────────────
  folderBackContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
    overflow: 'hidden',
  },
  folderTab: {
    position: 'absolute',
    top: 0,
    width: '52%',
    height: 24,
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
    top: 10,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },

  // ─── Layer 2: Peeking Cards ────────────────────────────────────────
  peekingCardsLayer: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    height: 75,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 2,
  },
  previewCard: {
    position: 'absolute',
    width: 54,
    height: 60,
    borderRadius: 8,
    padding: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  previewCardLeft: {
    left: 8,
    top: 4,
    transform: [{ rotate: '-7deg' }],
    zIndex: 1,
  },
  previewCardCenter: {
    alignSelf: 'center',
    top: 0,
    width: 50,
    height: 58,
    transform: [{ rotate: '1deg' }],
    zIndex: 2,
  },
  previewCardRight: {
    right: 8,
    top: 2,
    width: 52,
    height: 62,
    transform: [{ rotate: '8deg' }],
    zIndex: 3,
  },
  previewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 3,
  },
  miniDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  miniLine: {
    height: 2.5,
    borderRadius: 1.5,
  },
  miniHashtagText: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 9,
  },
  miniText: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#334155',
    lineHeight: 10,
  },
  previewCardFooter: {
    marginTop: 'auto',
  },
  miniBar: {
    height: 2.5,
    borderRadius: 1.5,
  },
  centerCountContainer: {
    flex: 1,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniCountNumber: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  miniCountLabel: {
    fontSize: 6.5,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 1,
  },
  centerArtContainer: {
    flex: 1,
    borderRadius: 6,
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
    borderTopWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    borderTopLeftRadius: 2,
  },
  iconChip: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Layer 3: Front Folder Flap (The Front Pouch) ─────────────
  frontPouchContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 94,
    zIndex: 5,
  },
  frontFlapLip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 20,
  },
  frontFlapLipLTR: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 26,
    transform: [{ skewY: '-3deg' }],
  },
  frontFlapLipRTL: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 16,
    transform: [{ skewY: '3deg' }],
  },
  frontPouchBody: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    bottom: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    marginBottom: 2,
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
    opacity: 0.88,
  },
  projectBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.12,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  // ─── Add Ghost Card ────────────────────────────────────────────────
  addCardContainer: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCardTab: {
    position: 'absolute',
    top: -2,
    width: '48%',
    height: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderStyle: 'dashed',
  },
  addCardBody: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  addIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
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
