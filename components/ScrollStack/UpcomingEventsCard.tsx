import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '@/hooks/useTheme';
import { useTranslation } from '@/utils/i18n';
import { useAuth } from '@/hooks/useAuth';
import { createScrollStackStyles } from '@/assets/styles/scrollStack.styles';
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
}

interface UpcomingEventsCardProps {
  events: UpcomingEventDisplay[];
  onOpenEventModal: (eventToEdit?: UpcomingEventDisplay) => void;
}

const VIOLET_THEME = {
  primary: '#8B5CF6',
  light: '#dbd4fd',
  badgeBgDark: 'rgba(219, 212, 253, 0.2)',
  badgeBgLight: 'rgba(219, 212, 253, 0.35)',
  pillBgDark: 'rgba(139, 92, 246, 0.18)',
  pillBgLight: 'rgba(139, 92, 246, 0.12)',
};

export const UpcomingEventsCard: React.FC<UpcomingEventsCardProps> = ({
  events,
  onOpenEventModal,
}) => {
  const { colors, isDarkMode } = useTheme();
  const { language } = useAuth();
  const { t, isArabic } = useTranslation(language);
  const styles = createScrollStackStyles(colors, isArabic, isDarkMode);

  const formatTime = (ts?: number) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString(
      isArabic ? 'ar-SA' : 'en-US',
      { hour: '2-digit', minute: '2-digit' }
    );
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <TouchableOpacity 
        style={styles.cardHeader} 
        onPress={() => onOpenEventModal()}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.iconBadge, { backgroundColor: isDarkMode ? VIOLET_THEME.badgeBgDark : VIOLET_THEME.badgeBgLight }]}>
            <Ionicons name="calendar" size={20} color={isDarkMode ? VIOLET_THEME.light : VIOLET_THEME.primary} />
          </View>
          <View style={isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }}>
            <Text style={styles.cardTitle}>{t.upcomingEvents}</Text>
            <Text style={styles.cardSubtitle}>
              {events.length} {t.tasksScheduled}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.headerPill, { backgroundColor: isDarkMode ? VIOLET_THEME.pillBgDark : VIOLET_THEME.pillBgLight }]}
          onPress={() => onOpenEventModal()}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle" size={15} color={isDarkMode ? VIOLET_THEME.light : VIOLET_THEME.primary} />
          <Text style={[styles.headerPillText, { color: isDarkMode ? VIOLET_THEME.light : VIOLET_THEME.primary }]}>{t.addEvent}</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Body: Events list with Nested Scroll or Empty State */}
      {events.length === 0 ? (
        <View style={styles.emptyCardContent}>
          <Ionicons name="calendar-outline" size={28} color={isDarkMode ? VIOLET_THEME.light : VIOLET_THEME.primary} />
          <Text style={styles.emptyCardTitle}>{t.noUpcomingEvents}</Text>
          <TouchableOpacity 
            style={[styles.emptyCardBtn, { borderColor: isDarkMode ? VIOLET_THEME.badgeBgDark : VIOLET_THEME.badgeBgLight }]} 
            onPress={() => onOpenEventModal()}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color={isDarkMode ? VIOLET_THEME.light : VIOLET_THEME.primary} />
            <Text style={[styles.emptyCardBtnText, { color: isDarkMode ? VIOLET_THEME.light : VIOLET_THEME.primary }]}>{t.addEvent}</Text>
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
            let chipColor = "#defef9";
            let typeBadgeText = "";

            if (isMeeting) {
              chipIcon = "videocam-outline";
              chipColor = "#38BDF8";
              typeBadgeText = isArabic ? "اجتماع" : "Meeting";
            } else if (isAppointment) {
              chipIcon = "calendar-outline";
              chipColor = "#F59E0B";
              typeBadgeText = isArabic ? "موعد" : "Appointment";
            } else if (isReminder) {
              chipIcon = "alarm-outline";
              chipColor = "#EC4899";
              typeBadgeText = isArabic ? "تذكير" : "Reminder";
            }

            return (
              <TouchableOpacity
                key={evt._id}
                style={styles.eventRow}
                onPress={() => onOpenEventModal(evt)}
                activeOpacity={0.7}
              >
                {/* Time Badge with dynamic type-aware icon */}
                <View style={[styles.eventTimeChip, { backgroundColor: isDarkMode ? `${chipColor}20` : `${chipColor}35` }]}>
                  <Ionicons name={chipIcon as any} size={13} color={chipColor} />
                  <Text style={[styles.eventTimeText, { color: isDarkMode ? chipColor : '#0A2B3A' }]}>
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
                      <View style={{ backgroundColor: isDarkMode ? `${chipColor}20` : `${chipColor}25`, paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 4, flexShrink: 0 }}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: chipColor }}>{typeBadgeText}</Text>
                      </View>
                    ) : null}
                  </View>
                  
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
                          <Ionicons name="videocam-outline" size={12} color="#38BDF8" style={{ flexShrink: 0 }} />
                          <Text style={[styles.eventMetaText, { color: '#38BDF8', flex: 1, flexShrink: 1 }]} numberOfLines={1} ellipsizeMode="tail">
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
          <Text style={styles.footerActionText}>{t.editEvent}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onOpenEventModal()}>
          <Text style={[styles.footerHintText, { color: isDarkMode ? VIOLET_THEME.light : VIOLET_THEME.primary }]}>{t.addReminder} +</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default UpcomingEventsCard;
