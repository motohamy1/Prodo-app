import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '@/hooks/useTheme';
import { useTranslation } from '@/utils/i18n';
import { useAuth } from '@/hooks/useAuth';
import { createScrollStackStyles, CARD_ACCENTS, createCardFrame, CardAccent } from '@/assets/styles/scrollStack.styles';
import { Id } from '@/convex/_generated/dataModel';

export interface UpcomingEventDisplay {
  _id: Id<"todos">;
  title: string;
  date: number;
  startTime?: number;
  endTime?: number;
  location?: string;
  meetingLink?: string;
  priority?: string;
  type?: string;
  description?: string;
}

interface UpcomingEventsCardProps {
  events: UpcomingEventDisplay[];
  onOpenEventModal: (eventToEdit?: UpcomingEventDisplay) => void;
}

export const UpcomingEventsCard: React.FC<UpcomingEventsCardProps> = ({
  events,
  onOpenEventModal,
}) => {
  const { colors, isDarkMode } = useTheme();
  const { language } = useAuth();
  const { t, isArabic } = useTranslation(language);
  const styles = createScrollStackStyles(colors, isArabic, isDarkMode);

  const frame = createCardFrame(CARD_ACCENTS.lime, isDarkMode, colors.secondaryText);

  // Per-type chip accent: light mode always uses the deep ink so nothing sits
  // as a pale wash-on-wash; dark mode uses the pastel. Reminder uses the card's lime.
  const typeAccent = (kind: 'meeting' | 'appointment' | 'reminder' | 'event'): CardAccent => {
    if (kind === 'meeting') return CARD_ACCENTS.sky;
    if (kind === 'appointment') return CARD_ACCENTS.amber;
    if (kind === 'reminder') return { pastel: colors.secondary, ink: CARD_ACCENTS.lime.ink };
    return CARD_ACCENTS.mint;
  };

  const formatTime = (ts?: number) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString(
      isArabic ? 'ar-SA' : 'en-US',
      { hour: '2-digit', minute: '2-digit' }
    );
  };

  return (
    <View style={[styles.card, { borderColor: frame.edge }]}>
      {/* Header */}
      <TouchableOpacity 
        style={styles.cardHeader} 
        onPress={() => onOpenEventModal()}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.iconBadge, { backgroundColor: frame.badgeBg }]}>
            <Ionicons name="calendar" size={20} color={frame.badgeFg} />
          </View>
          <View style={isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }}>
            <Text style={styles.cardTitle}>{t.remindersAndEvents}</Text>
            <Text style={styles.cardSubtitle}>
              {events.length} {t.remindersAndEventsSubtitle}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.headerPill, { backgroundColor: frame.pillBg }]}
          onPress={() => onOpenEventModal()}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle" size={15} color={frame.pillFg} />
          <Text style={[styles.headerPillText, { color: frame.pillFg }]}>{isArabic ? 'إضافة' : 'Add'}</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Body: Events list with Nested Scroll or Empty State */}
      {events.length === 0 ? (
        <View style={styles.emptyCardContent}>
          <Ionicons name="notifications-outline" size={28} color={frame.fg} />
          <Text style={styles.emptyCardTitle}>{t.noUpcomingRemindersEvents}</Text>
          <TouchableOpacity 
            style={[styles.emptyCardBtn, { borderColor: frame.border }]} 
            onPress={() => onOpenEventModal()}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color={frame.fg} />
            <Text style={[styles.emptyCardBtnText, { color: frame.fg }]}>{t.addReminder}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.eventScrollView}
          contentContainerStyle={styles.eventScrollContent}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          overScrollMode="never"
          decelerationRate="fast"
          scrollEventThrottle={16}
        >
          {events.map((evt) => {
            const isMeeting = evt.type === 'meeting' || Boolean(evt.meetingLink);
            const isAppointment = evt.type === 'appointment';
            const isReminder = evt.type === 'reminder';

            let chipIcon = "time-outline";
            let typeBadgeText = "";
            let accent: CardAccent = typeAccent('event');

            if (isMeeting) {
              chipIcon = "videocam-outline";
              accent = typeAccent('meeting');
              typeBadgeText = t.typeMeeting;
            } else if (isAppointment) {
              chipIcon = "calendar-outline";
              accent = typeAccent('appointment');
              typeBadgeText = t.typeAppointment;
            } else if (isReminder) {
              chipIcon = "alarm-outline";
              accent = typeAccent('reminder');
              typeBadgeText = t.typeReminder;
            } else {
              typeBadgeText = t.typeEvent;
            }

            const chipFg = isDarkMode ? accent.pastel : accent.ink;
            const chipWash = isDarkMode ? `${accent.pastel}33` : `${accent.pastel}8C`;
            const badgeWash = isDarkMode ? `${accent.pastel}26` : `${accent.pastel}66`;

            return (
              <TouchableOpacity
                key={evt._id}
                style={styles.eventRow}
                onPress={() => onOpenEventModal(evt)}
                activeOpacity={0.7}
              >
                {/* Time Badge with dynamic type-aware icon */}
                <View style={[styles.eventTimeChip, { backgroundColor: chipWash }]}>
                  <Ionicons name={chipIcon as any} size={13} color={chipFg} />
                  <Text style={[styles.eventTimeText, { color: chipFg }]}>
                    {formatTime(evt.startTime || evt.date)}
                  </Text>
                </View>

                {/* Event Info */}
                <View style={[styles.eventInfo, { flex: 1, minWidth: 0 }]}>
                  <View style={[{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, width: '100%' }]}>
                    <Text style={[styles.eventTitle, { flex: 1, flexShrink: 1 }]} numberOfLines={1} ellipsizeMode="tail">
                      {evt.title}
                    </Text>
                    {typeBadgeText ? (
                      <View style={{ backgroundColor: badgeWash, paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 4, flexShrink: 0 }}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: chipFg }}>{typeBadgeText}</Text>
                      </View>
                    ) : null}
                  </View>
                  
                  {evt.description ? (
                    <View style={[styles.eventMeta, { width: '100%' }]}>
                      <Ionicons name="document-text-outline" size={12} color={colors.textMuted} style={{ flexShrink: 0 }} />
                      <Text style={[styles.eventMetaText, { flex: 1, flexShrink: 1 }]} numberOfLines={1} ellipsizeMode="tail">{evt.description}</Text>
                    </View>
                  ) : null}

                  {(evt.location || evt.meetingLink) && (
                    <View style={[styles.eventMeta, { width: '100%' }]}>
                      {evt.location ? (
                        <>
                          <Ionicons name="location-outline" size={12} color={colors.textMuted} style={{ flexShrink: 0 }} />
                          <Text style={[styles.eventMetaText, { flex: 1, flexShrink: 1 }]} numberOfLines={1} ellipsizeMode="tail">{evt.location}</Text>
                        </>
                      ) : null}
                      {evt.meetingLink ? (
                        <>
                          <Ionicons name="videocam-outline" size={12} color={isDarkMode ? CARD_ACCENTS.sky.pastel : CARD_ACCENTS.sky.ink} style={{ flexShrink: 0 }} />
                          <Text style={[styles.eventMetaText, { color: isDarkMode ? CARD_ACCENTS.sky.pastel : CARD_ACCENTS.sky.ink, flex: 1, flexShrink: 1 }]} numberOfLines={1} ellipsizeMode="tail">
                            {isArabic ? 'رابط الاجتماع' : 'Meeting Link'}
                          </Text>
                        </>
                      ) : null}
                    </View>
                  )}
                </View>

                {/* Edit Icon */}
                <Ionicons name={isArabic ? "chevron-back" : "chevron-forward"} size={16} color={colors.textMuted} style={{ flexShrink: 0 }} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <TouchableOpacity 
          style={styles.footerActionBtn}
          onPress={() => onOpenEventModal()}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={16} color={colors.textMuted} />
          <Text style={styles.footerActionText}>{t.quickEdit}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onOpenEventModal()}>
          <Text style={[styles.footerHintText, { color: frame.fg }]}>{t.addReminder} +</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default UpcomingEventsCard;
