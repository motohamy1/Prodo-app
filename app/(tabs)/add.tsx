import { createNotesStyles } from '@/assets/styles/notes.styles';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import useTheme from '@/hooks/useTheme';
import { useTranslation } from '@/utils/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Platform, Share, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import ActionModal from '@/components/ActionModal';
import { useScreenGuide } from '@/hooks/useScreenGuide';
import ScreenGuide from '@/components/ScreenGuide';
import type { GuideTip } from '@/components/ScreenGuide';

import { JEWEL_DARK, JEWEL_LIGHT } from '@/utils/magicColors';
import LivePress from '@/components/LivePress';

const getJewelColor = (i: number, isDark: boolean) =>
  (isDark ? JEWEL_DARK : JEWEL_LIGHT)[i % 6];

export default function NotesScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const { userId, language } = useAuth();
  const { t, isArabic } = useTranslation(language);
  const styles = createNotesStyles(colors, isArabic);
  const insets = useSafeAreaInsets();
  const { showGuide, dismissGuide } = useScreenGuide('notes');

  const tips: GuideTip[] = isArabic ? [
    { icon: 'document-text-outline', title: 'ملاحظة سريعة', description: 'اضغط لإنشاء ملاحظة غنية بالتنسيق والألوان.', accentColor: colors.primary },
    { icon: 'notifications-outline', title: 'تذكير جديد', description: 'اضغط لإنشاء تذكير بتاريخ ووقت محدد.', accentColor: colors.warning },
    { icon: 'hand-left-outline', title: 'اضغط مطولاً', description: 'اضغط مطولاً على بطاقة لتعديلها أو مشاركتها أو حذفها.', accentColor: colors.success },
  ] : [
    { icon: 'document-text-outline', title: 'Quick Note', description: 'Tap to create a rich note with formatting and colors.', accentColor: colors.primary },
    { icon: 'notifications-outline', title: 'New Reminder', description: 'Tap to create a reminder with a specific date and time.', accentColor: colors.warning },
    { icon: 'hand-left-outline', title: 'Long Press', description: 'Long press any card to edit, share, or delete it.', accentColor: colors.success },
  ];

  const todos = useOfflineQuery<any[]>('todos', api.todos.get, userId ? { userId } : 'skip');
  const deleteTodo = useOfflineMutation(api.todos.deleteTodo, "todos:deleteTodo");
  const [actionVisible, setActionVisible] = React.useState(false);
  const [selected, setSelected] = React.useState<any>(null);

  const reminders = todos?.filter((t: any) => t.type === 'reminder' || (!t.type && t.dueDate && t.dueDate > 0 && !t.categoryId && !t.priority && !t.timerDuration)) ?? [];
  const notes = todos?.filter((t: any) => t.type === 'note' || (!t.type && (!t.dueDate || t.dueDate === 0) && !t.categoryId && !t.priority && !t.timerDuration && !t.isCompleted)) ?? [];

  if (todos === undefined) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={styles.loadingPulse} />
        </Animated.View>
      </View>
    );
  }

  const AddCard = ({ type, index }: { type: 'reminder' | 'note'; index: number }) => {
    const isRem = type === 'reminder';
    return (
      <Animated.View entering={FadeInDown.duration(500).delay(index * 100)} style={styles.addCardOuter}>
        <LivePress
          style={styles.addCardInner}
          activeOpacity={0.97}
          onPress={() => router.push({ pathname: '/note-detail', params: { isReminder: isRem ? 'true' : 'false' } })}
        >
          <View style={styles.addCardIconWrap}>
            <Ionicons name={isRem ? 'alarm' : 'sparkles'} size={28} color={colors.primary} />
          </View>
          <Text style={[styles.addCardLabel, isArabic && { textAlign: 'right' }]}>
            {isRem ? t.newReminder : t.quickNote}
          </Text>
          <Text style={[styles.addCardHint, isArabic && { textAlign: 'right' }]}>
            {isRem ? 'Set date & time' : 'Rich text editor'}
          </Text>
        </LivePress>
      </Animated.View>
    );
  };

  const NoteCard = ({ item, index }: { item: any; index: number }) => {
    const bg = getJewelColor(index, isDarkMode);
    const textColor = isDarkMode ? '#FFFFFF' : '#1E1F23';
    const mutedColor = isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
    const accentColor = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)';

    return (
      <Animated.View entering={FadeInDown.duration(500).delay((index + 1) * 80).springify()} style={styles.cardOuter}>
        <LivePress
          style={[styles.cardInner, { backgroundColor: bg }]}
          activeOpacity={0.97}
          onPress={() => router.push({ pathname: '/note-detail', params: { id: item._id } })}
          onLongPress={() => { setSelected(item); setActionVisible(true); }}
        >
          {item.dueDate ? (
            <View style={[styles.cardReminderPill, { backgroundColor: accentColor }]}>
              <Ionicons name="alarm-outline" size={12} color={colors.primary} />
              <Text style={[styles.cardReminderPillText, { color: colors.primary }]}>
                {new Date(item.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ) : null}
          <Text style={[styles.cardTitleText, { color: textColor }]} numberOfLines={2}>
            {item.text || 'Untitled'}
          </Text>
          <View style={styles.cardTrailing}>
            <Ionicons
              name={item.type === 'reminder' ? 'notifications' : 'document-text'}
              size={16}
              color={mutedColor}
            />
          </View>
        </LivePress>
      </Animated.View>
    );
  };

  const Section = ({ title, count, items, type }: { title: string; count: number; items: any[]; type: 'reminder' | 'note' }) => (
    <Animated.View entering={FadeInUp.duration(600).delay(200)} style={styles.sectionOuter}>
      <View style={styles.sectionInner}>
        <View style={[styles.sectionHeader, isArabic && { flexDirection: 'row-reverse' }]}>
          <Text style={[styles.sectionLabel, isArabic && { textAlign: 'right' }]}>{title}</Text>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>{count}</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={[styles.cardsRow, isArabic && { flexDirection: 'row-reverse' }]}>
            <AddCard type={type} index={0} />
            {items.map((item, i) => <NoteCard key={item._id} item={item} index={i} />)}
          </View>
        </ScrollView>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { overflow: 'hidden' }]} edges={['left', 'right', 'bottom']}>
      <Animated.View entering={FadeInDown.duration(500)} style={[styles.header, isArabic && { flexDirection: 'row-reverse' }, { paddingTop: Math.max(insets.top, 20) }]}>
        <Text style={styles.headerTitle}>{t.notesAndReminders}</Text>
      </Animated.View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <Section title={t.reminders} count={reminders.length} items={reminders} type="reminder" />
        <Section title={t.notes} count={notes.length} items={notes} type="note" />
      </ScrollView>

      <ActionModal
        visible={actionVisible}
        onClose={() => { setActionVisible(false); setSelected(null); }}
        title={selected?.text || (selected?.type === 'reminder' ? t.reminders : t.notes)}
        isArabic={isArabic}
        options={[
          { label: t.edit, icon: 'create-outline', onPress: () => router.push({ pathname: '/note-detail', params: { id: selected?._id } }) },
          { label: t.share, icon: 'share-social-outline', onPress: () => Share.share({ message: `${selected?.text || 'Untitled'}\n\n${selected?.description || ''}` }) },
          { label: t.delete, icon: 'trash-outline', variant: 'destructive', onPress: () => { if (selected) deleteTodo({ id: selected._id }); } }
        ]}
      />

      <ScreenGuide visible={showGuide} tips={tips} onDismiss={dismissGuide} isArabic={isArabic} />
    </SafeAreaView>
  );
}
