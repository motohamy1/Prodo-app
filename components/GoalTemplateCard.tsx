import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Svg, { Circle, Path, Rect, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import LivePress from '@/components/LivePress';

export interface GoalTemplateCategory {
  id: string;
  title: string;
  titleAr?: string;
  icon: string;
  color: string;
  description?: string;
  descriptionAr?: string;
}

export interface GoalTemplateItem {
  _id?: string;
  templateId: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: string;
  badge: string;
  badgeAr: string;
  bg?: string;
  ink?: string;
  accent?: string;
  accentSecondary?: string;
  color: string;
  gradientColors?: string[];
  artType: string;
  categories: GoalTemplateCategory[];
  isDefault?: boolean;
}

interface GoalTemplateCardProps {
  template: GoalTemplateItem;
  isSelected: boolean;
  onSelect: () => void;
  isArabic?: boolean;
  cardWidth?: number;
}

export const GoalTemplateCard: React.FC<GoalTemplateCardProps> = ({
  template,
  isSelected,
  onSelect,
  isArabic = false,
  cardWidth = 290,
}) => {
  const title = isArabic ? template.nameAr || template.name : template.name;
  const description = isArabic ? template.descriptionAr || template.description : template.description;
  const badge = isArabic ? template.badgeAr || template.badge : template.badge;

  // Authentic palette from template or fallback
  const bg = template.bg || '#EDE8DB';
  const ink = template.ink || '#1E1B18';
  const accent = template.accent || template.color || '#EA580C';
  const secColor = template.accentSecondary || template.gradientColors?.[1] || accent;

  const renderCardArtwork = () => {
    switch (template.artType) {
      case 'halfCircles':
        return (
          <Svg width={230} height={140} viewBox="0 0 230 140" fill="none">
            <Path d="M 45 15 A 55 55 0 0 0 45 125 Z" fill={accent} opacity={0.88} />
            <Path d="M 110 15 A 55 55 0 0 0 110 125 Z" fill={accent} opacity={0.88} />
            <Circle cx={170} cy={70} r={50} fill={secColor} opacity={0.92} />
            <Circle cx={170} cy={70} r={18} fill={bg} opacity={0.95} />
          </Svg>
        );

      case 'sunRays':
        return (
          <Svg width={220} height={130} viewBox="0 0 220 130" fill="none">
            <Circle cx={110} cy={65} r={46} fill={accent} opacity={0.3} />
            <Circle cx={110} cy={65} r={28} fill={accent} opacity={0.85} />
            <Path
              d="M 110 5 L 110 20 M 110 110 L 110 125 M 50 65 L 65 65 M 155 65 L 170 65 M 68 23 L 78 33 M 142 97 L 152 107 M 68 107 L 78 97 M 142 33 L 152 23"
              stroke={ink}
              strokeWidth={3.5}
              strokeLinecap="round"
              opacity={0.4}
            />
          </Svg>
        );

      case 'stripes':
        return (
          <Svg width={220} height={130} viewBox="0 0 220 130" fill="none">
            <G opacity={0.45}>
              <Path d="M 30 20 Q 80 5 130 20 T 210 20" stroke={accent} strokeWidth={5} strokeLinecap="round" />
              <Path d="M 30 40 Q 80 25 130 40 T 210 40" stroke={accent} strokeWidth={5} strokeLinecap="round" />
              <Path d="M 30 60 Q 80 45 130 60 T 210 60" stroke={accent} strokeWidth={5} strokeLinecap="round" />
              <Path d="M 30 80 Q 80 65 130 80 T 210 80" stroke={accent} strokeWidth={5} strokeLinecap="round" />
              <Path d="M 30 100 Q 80 85 130 100 T 210 100" stroke={accent} strokeWidth={5} strokeLinecap="round" />
            </G>
            <Circle cx={175} cy={65} r={32} fill={secColor} opacity={0.75} />
          </Svg>
        );

      case 'rings':
        return (
          <Svg width={220} height={130} viewBox="0 0 220 130" fill="none">
            <Circle cx={110} cy={65} r={58} stroke={accent} strokeWidth={3} opacity={0.25} />
            <Circle cx={110} cy={65} r={42} stroke={accent} strokeWidth={5} opacity={0.45} />
            <Circle cx={110} cy={65} r={24} fill={accent} opacity={0.88} />
            <Circle cx={110} cy={65} r={10} fill={bg} />
          </Svg>
        );

      case 'dualDiscs':
        return (
          <Svg width={220} height={130} viewBox="0 0 220 130" fill="none">
            <Circle cx={85} cy={65} r={48} fill={accent} opacity={0.85} />
            <Circle cx={135} cy={65} r={48} fill={secColor} opacity={0.75} />
          </Svg>
        );

      case 'curves':
        return (
          <Svg width={220} height={130} viewBox="0 0 220 130" fill="none">
            <Path
              d="M 10 95 Q 60 20 110 65 T 210 35"
              stroke={accent}
              strokeWidth={18}
              strokeLinecap="round"
              opacity={0.85}
            />
            <Circle cx={165} cy={85} r={24} fill={secColor} opacity={0.65} />
          </Svg>
        );

      case 'waves':
        return (
          <Svg width={220} height={130} viewBox="0 0 220 130" fill="none">
            <Path
              d="M 20 60 C 60 20 100 100 140 50 C 180 0 200 80 220 60"
              stroke={accent}
              strokeWidth={12}
              strokeLinecap="round"
              opacity={0.85}
            />
            <Circle cx={70} cy={85} r={28} fill={secColor} opacity={0.55} />
          </Svg>
        );

      case 'bauhaus':
      default:
        return (
          <Svg width={220} height={130} viewBox="0 0 220 130" fill="none">
            <Rect x={40} y={25} width={65} height={65} rx={14} fill={accent} opacity={0.85} />
            <Circle cx={150} cy={60} r={34} fill={secColor} opacity={0.75} />
            <Path d="M 95 70 L 165 70" stroke={ink} strokeWidth={4} strokeLinecap="round" opacity={0.5} />
          </Svg>
        );
    }
  };

  return (
    <View style={[styles.cardOuter, { width: cardWidth }]}>
      <LivePress
        style={[
          styles.cardBody,
          {
            backgroundColor: bg,
            borderColor: isSelected ? accent : 'transparent',
            borderWidth: isSelected ? 2.5 : 0,
          },
          isSelected ? styles.cardFocusedShadow : styles.cardStackedShadow,
        ]}
        activeOpacity={0.92}
        onPress={onSelect}
        pressScale={0.96}
      >
        {/* ─── Abstract Center Geometric Artwork ─────────────────────── */}
        <View style={styles.artworkContainer} pointerEvents="none">
          {renderCardArtwork()}
        </View>

        {/* ─── Top Header Row: Badge & Select Indicator ──────────────── */}
        <View style={[styles.topHeaderRow, isArabic && styles.rowReverse]}>
          <View style={[styles.badgePill, { backgroundColor: ink + '18' }, isArabic && styles.rowReverse]}>
            <Ionicons name={template.icon as any || 'layers'} size={13} color={ink} />
            <Text style={[styles.badgePillText, { color: ink }]}>{badge || 'Framework'}</Text>
          </View>

          <View
            style={[
              styles.checkCircle,
              {
                backgroundColor: isSelected ? ink : ink + '15',
                borderColor: isSelected ? ink : 'transparent',
              },
            ]}
          >
            {isSelected && <Ionicons name="checkmark" size={13} color={bg} />}
          </View>
        </View>

        {/* ─── Bottom Content: Large Bold Title & Categories ─────────── */}
        <View style={styles.bottomSection}>
          <Text
            style={[styles.templateTitle, { color: ink, textAlign: isArabic ? 'right' : 'left' }]}
            numberOfLines={1}
          >
            {title}
          </Text>

          <Text
            style={[styles.templateDesc, { color: ink, textAlign: isArabic ? 'right' : 'left' }]}
            numberOfLines={1}
          >
            {description}
          </Text>

          {/* Category Pills */}
          <View style={[styles.categoryRow, isArabic && styles.rowReverse]}>
            {template.categories?.slice(0, 3).map((cat) => (
              <View
                key={cat.id}
                style={[
                  styles.catMiniPill,
                  { backgroundColor: ink + '15' },
                ]}
              >
                <View style={[styles.catMiniDot, { backgroundColor: cat.color || accent }]} />
                <Text style={[styles.catMiniText, { color: ink }]} numberOfLines={1}>
                  {isArabic ? cat.titleAr || cat.title : cat.title}
                </Text>
              </View>
            ))}
            {template.categories?.length > 3 && (
              <View style={[styles.catMiniPill, { backgroundColor: ink + '15', paddingHorizontal: 6 }]}>
                <Text style={[styles.catMiniText, { color: ink, fontWeight: '800' }]}>
                  +{template.categories.length - 3}
                </Text>
              </View>
            )}
          </View>
        </View>
      </LivePress>
    </View>
  );
};

const styles = StyleSheet.create({
  cardOuter: {
    marginRight: 14,
    marginVertical: 4,
  },
  cardBody: {
    height: 195,
    borderRadius: 22,
    padding: 16,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  cardFocusedShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  cardStackedShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  artworkContainer: {
    position: 'absolute',
    top: 15,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    zIndex: 2,
  },
  templateTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginBottom: 2,
  },
  templateDesc: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.8,
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  catMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    maxWidth: 110,
  },
  catMiniDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  catMiniText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
