import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Share,
  Platform,
  Modal,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';

import { createAddScreenStyles } from '@/assets/styles/addScreen.styles';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import useTheme from '@/hooks/useTheme';
import { useTranslation } from '@/utils/i18n';
import ActionModal from '@/components/ActionModal';
import { useScreenGuide } from '@/hooks/useScreenGuide';
import ScreenGuide from '@/components/ScreenGuide';
import type { GuideTip } from '@/components/ScreenGuide';
import LivePress from '@/components/LivePress';
import VoiceWaveform from '@/components/VoiceWaveform';

// Helper to format relative time
const formatRelativeTime = (timestamp?: number): string => {
  if (!timestamp) return 'Just now';
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHours < 24) return `${diffHours < 10 ? '0' : ''}${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// High-fidelity sample notes & reminders (strictly Notes and Reminders only)
const DEFAULT_NOTES_AND_REMINDERS = [
  {
    _id: 'sample-1',
    text: 'Weekly Brainstorming & Ideas',
    description: 'Summary of creative ideas, feature enhancements, and notes on improving daily focus.',
    type: 'note',
    createdAt: Date.now() - 23 * 60 * 1000,
    isSample: true,
  },
  {
    _id: 'sample-2',
    text: 'Doctor Appointment & Prescription',
    description: 'Scheduled reminder for health clinic visit and follow-up consultation.',
    type: 'reminder',
    dueDate: Date.now() + 3 * 3600 * 1000,
    createdAt: Date.now() - 7 * 3600 * 1000,
    isSample: true,
  },
  {
    _id: 'sample-3',
    text: 'Reading Notes: Behavioral Design',
    description: 'Key insights from chapter 4 regarding habit loops, trigger cues, and minimal friction interfaces.',
    type: 'note',
    createdAt: Date.now() - 26 * 3600 * 1000,
    isSample: true,
  },
];

export default function AddScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const { userId, language } = useAuth();
  const { t, isArabic } = useTranslation(language);
  const styles = useMemo(() => createAddScreenStyles(colors, isArabic), [colors, isArabic]);
  const insets = useSafeAreaInsets();
  const { showGuide, dismissGuide } = useScreenGuide('addScreen');

  // Input Mode: Voice vs Typing
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [isListening, setIsListening] = useState(false);

  // Quick Typing State
  const [typingText, setTypingText] = useState('');
  const [typingType, setTypingType] = useState<'note' | 'reminder'>('note');
  const [typingDueDate, setTypingDueDate] = useState<number | undefined>(undefined);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'note' | 'reminder'>('all');
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);

  // Calendar / Time Reminder State
  const [isCalendarModalVisible, setCalendarModalVisible] = useState(false);
  const [reminderDate, setReminderDate] = useState(new Date());
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Card Action State
  const [actionVisible, setActionVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  // Convex Data & Mutations
  const todos = useOfflineQuery<any[]>('todos', api.todos.get, userId ? { userId } : 'skip');
  const addTodo = useOfflineMutation(api.todos.addTodo, 'todos:addTodo');
  const deleteTodo = useOfflineMutation(api.todos.deleteTodo, 'todos:deleteTodo');

  // Pulsing recording dot animation when speaking
  const pulseOpacity = useSharedValue(1);
  useEffect(() => {
    if (isListening) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.25, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      pulseOpacity.value = 1;
    }
  }, [isListening, pulseOpacity]);

  const animatedDotStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // Guide tips
  const tips: GuideTip[] = isArabic
    ? [
        { icon: 'mic-outline', title: 'المساعد الصوتي للملاحظات', description: 'اضغط على زر التحدث للبدء في إملاء الملاحظات والتذكيرات.', accentColor: '#dbd4fd' },
        { icon: 'create-outline', title: 'الكتابة المباشرة', description: 'يمكنك التبديل إلى وضع الكتابة لإدخال ملاحظاتك وتذكيراتك نصياً.', accentColor: '#defef9' },
        { icon: 'calendar-outline', title: 'تذكير بوقت محدد', description: 'اضغط على أيقونة التقويم لتحديد موعد ووقت دقيق للتذكير.', accentColor: '#f6e5c9' },
      ]
    : [
        { icon: 'mic-outline', title: 'Voice Input', description: 'Tap the speak button to dictate notes and reminders with AI.', accentColor: '#dbd4fd' },
        { icon: 'create-outline', title: 'Direct Typing', description: 'Switch to Type mode to quickly create notes and reminders via keyboard.', accentColor: '#defef9' },
        { icon: 'calendar-outline', title: 'Scheduled Reminders', description: 'Tap the calendar icon to assign a date and time to any note.', accentColor: '#f6e5c9' },
      ];

  // STRICT Filter: ONLY Notes and Reminders
  // Explicitly excludes Tasks (board tasks, subtasks, priority tasks, timer tasks) and Events (meetings, locations)
  const notesAndRemindersList = useMemo(() => {
    let list: any[] = [];

    if (todos && todos.length > 0) {
      list = todos
        .filter((t: any) => {
          // Exclude Events (items with location or meetingLink)
          if (t.location || t.meetingLink) return false;

          // Exclude Tasks (items with parentId, categoryId, subCategoryId, projectId, priority, or timerDuration)
          if (t.parentId || t.categoryId || t.subCategoryId || t.projectId || t.timerDuration) return false;

          // Must be explicitly a note or reminder, or a standalone item with description
          if (t.type === 'note' || t.type === 'reminder') return true;

          // If no type specified, only include if it has no task status or completion flags
          if (!t.type && (t.description || t.dueDate) && !t.priority && !t.isCompleted && (!t.status || t.status === 'not_started')) {
            return true;
          }

          return false;
        })
        .map((item: any) => ({
          ...item,
          type: item.type || (item.dueDate && item.dueDate > 0 ? 'reminder' : 'note'),
          createdAt: item.date || item._creationTime || Date.now(),
        }));
    }

    // If user has no saved notes/reminders yet, show sample notes/reminders
    if (list.length === 0) {
      list = [...DEFAULT_NOTES_AND_REMINDERS];
    }

    // Filter by type (Notes vs Reminders)
    if (activeFilter === 'note') {
      list = list.filter((item) => item.type === 'note' && (!item.dueDate || item.dueDate === 0));
    } else if (activeFilter === 'reminder') {
      list = list.filter((item) => item.type === 'reminder' || (item.dueDate && item.dueDate > 0));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          (item.text && item.text.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q))
      );
    }

    return list;
  }, [todos, activeFilter, searchQuery]);

  // Handler for creating a note from typing
  const handleSaveTypedNote = async () => {
    if (!typingText.trim()) return;

    if (userId) {
      try {
        await addTodo({
          userId,
          text: typingText.trim(),
          type: typingType, // 'note' | 'reminder'
          dueDate: typingType === 'reminder' ? (typingDueDate || Date.now() + 3600 * 1000) : undefined,
          date: Date.now(),
          status: 'not_started',
        });
      } catch (err) {
        console.warn('Failed to add note', err);
      }
    }

    setTypingText('');
    setTypingDueDate(undefined);
    Keyboard.dismiss();
  };

  // Handler for creating a scheduled reminder from the calendar icon
  const handleCreateReminderFromCalendar = () => {
    setCalendarModalVisible(false);
    const combinedDate = new Date(reminderDate);
    combinedDate.setHours(reminderTime.getHours(), reminderTime.getMinutes(), 0, 0);

    router.push({
      pathname: '/note-detail',
      params: {
        isReminder: 'true',
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* ─── Top Status Bar ────────────────────────────────────────── */}
      <View style={styles.topStatusBar}>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>
            {isArabic ? 'الملاحظات والتذكيرات' : 'Notes & Reminders'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.topMenuBtn}
          activeOpacity={0.8}
          onPress={() => setMenuVisible(true)}
        >
          <Ionicons name="ellipsis-vertical" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* ─── Mode Switcher: Voice vs Type ─────────────────────────── */}
      <View style={styles.modeSelectorRow}>
        <TouchableOpacity
          style={[styles.modePill, inputMode === 'voice' && styles.modePillActive]}
          onPress={() => {
            setInputMode('voice');
            Keyboard.dismiss();
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name="mic-outline"
            size={16}
            color={inputMode === 'voice' ? '#FFFFFF' : '#9CA3AF'}
          />
          <Text style={[styles.modePillText, inputMode === 'voice' && styles.modePillTextActive]}>
            {isArabic ? 'إملاء صوتي' : 'Voice Input'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modePill, inputMode === 'text' && styles.modePillActive]}
          onPress={() => {
            setInputMode('text');
            setIsListening(false);
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name="create-outline"
            size={16}
            color={inputMode === 'text' ? '#FFFFFF' : '#9CA3AF'}
          />
          <Text style={[styles.modePillText, inputMode === 'text' && styles.modePillTextActive]}>
            {isArabic ? 'كتابة نصية' : 'Type Note'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── Hero Input Section: Voice OR Typing ─────────────────── */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.heroSection}>
          {inputMode === 'voice' ? (
            <>
              <View style={styles.heroStatusRow}>
                {/* Left Sound Equalizer Icon */}
                <TouchableOpacity
                  style={styles.waveformIconBtn}
                  activeOpacity={0.7}
                  onPress={() => setIsListening(!isListening)}
                >
                  <Ionicons
                    name="stats-chart"
                    size={20}
                    color={isListening ? '#dbd4fd' : '#FFFFFF'}
                  />
                </TouchableOpacity>

                {/* Listening / Idle Status Indicator */}
                <TouchableOpacity
                  style={isListening ? styles.listeningPill : styles.idlePill}
                  activeOpacity={0.8}
                  onPress={() => setIsListening(!isListening)}
                >
                  <Text style={isListening ? styles.listeningText : styles.idleText}>
                    {isListening
                      ? (isArabic ? 'جارِ الاستماع' : 'Listening')
                      : (isArabic ? 'جاهز للاستماع' : 'Tap to Speak')}
                  </Text>
                  <Animated.View
                    style={isListening ? [styles.recordingDot, animatedDotStyle] : styles.idleDot}
                  />
                </TouchableOpacity>
              </View>

              {/* Siri Fluid Waveform (Animates only when speaking/listening) */}
              <TouchableOpacity
                style={styles.waveformBox}
                activeOpacity={0.9}
                onPress={() => setIsListening(!isListening)}
              >
                {isListening && <View style={styles.waveformAmbientGlow} />}
                <VoiceWaveform isListening={isListening} />
              </TouchableOpacity>

              {/* Dynamic Transcript Preview */}
              <View style={styles.transcriptContainer}>
                <Text style={styles.transcriptPreviousText}>
                  {isListening
                    ? (isArabic ? 'نعم، نريد أن' : 'Yes, we want to')
                    : (isArabic ? 'ملاحظة صوتية ذكية' : 'Smart Voice Note')}
                </Text>
                <Text style={styles.transcriptFocusText}>
                  {isListening
                    ? (isArabic ? 'نحدد أولويات هذا الشهر،' : 'prioritise this month,')
                    : (isArabic ? 'اضغط للتحدث أو تسجيل فكرة' : 'Tap below to capture your idea')}
                </Text>
                <Text style={styles.transcriptNextText}>
                  {isListening
                    ? (isArabic ? 'أتمنى أن نتفق على...' : 'I hope we can agree on...')
                    : (isArabic ? 'سيتم تحويل حديثك وفهمه بذكاء' : 'AI will transcribe & organize it')}
                </Text>
              </View>

              {/* Interactive Speak Toggle Button */}
              <TouchableOpacity
                style={[styles.tapToSpeakBtn, isListening && styles.tapToSpeakBtnActive]}
                activeOpacity={0.85}
                onPress={() => setIsListening(!isListening)}
              >
                <Ionicons
                  name={isListening ? 'stop-circle-outline' : 'mic'}
                  size={18}
                  color={isListening ? '#F87171' : '#dbd4fd'}
                />
                <Text style={[styles.tapToSpeakText, isListening && styles.tapToSpeakTextActive]}>
                  {isListening
                    ? (isArabic ? 'إيقاف التسجيل' : 'Stop Listening')
                    : (isArabic ? 'بدء الإملاء الصوتي' : 'Start Voice Input')}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            /* ─── Direct Keyboard Input Card ─────────────────────── */
            <View style={styles.typingCard}>
              {/* Type Switcher */}
              <View style={styles.typingTypeToggles}>
                <TouchableOpacity
                  style={[styles.typeToggleBtn, typingType === 'note' && styles.typeToggleBtnActive]}
                  onPress={() => setTypingType('note')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.typeToggleText, typingType === 'note' && styles.typeToggleTextActive]}>
                    {isArabic ? '📝 ملاحظة' : '📝 Note'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeToggleBtn, typingType === 'reminder' && styles.typeToggleBtnActive]}
                  onPress={() => {
                    setTypingType('reminder');
                    if (!typingDueDate) setTypingDueDate(Date.now() + 3600 * 1000);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.typeToggleText, typingType === 'reminder' && styles.typeToggleTextActive]}>
                    {isArabic ? '⏰ تذكير' : '⏰ Reminder'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Text Input */}
              <TextInput
                style={[styles.typingInput, isArabic && { textAlign: 'right' }]}
                placeholder={
                  typingType === 'reminder'
                    ? (isArabic ? 'اكتب عنوان التذكير هنا...' : 'Type reminder title & details...')
                    : (isArabic ? 'اكتب ملاحظتك السريعة هنا...' : 'Type your quick note here...')
                }
                placeholderTextColor="#6B7280"
                value={typingText}
                onChangeText={setTypingText}
                multiline={true}
                blurOnSubmit={false}
              />

              {/* Footer */}
              <View style={styles.typingFooterRow}>
                {typingType === 'reminder' ? (
                  <TouchableOpacity
                    style={styles.typingReminderBtn}
                    onPress={() => setCalendarModalVisible(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="time-outline" size={15} color="#FBBF24" />
                    <Text style={styles.typingReminderText}>
                      {typingDueDate
                        ? new Date(typingDueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : (isArabic ? 'تحديد الوقت' : 'Set Time')}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View />
                )}

                <TouchableOpacity
                  style={[
                    styles.typingSaveBtn,
                    !typingText.trim() && styles.typingSaveBtnDisabled,
                  ]}
                  onPress={handleSaveTypedNote}
                  disabled={!typingText.trim()}
                  activeOpacity={0.85}
                >
                  <Text style={styles.typingSaveText}>
                    {isArabic ? 'حفظ' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>

        {/* ─── Search & Controls Row ─────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.controlsRow}>
          {/* Search Bar */}
          <View style={styles.searchBarContainer}>
            <Ionicons name="search-outline" size={19} color="#8E92A0" />
            <TextInput
              style={[styles.searchInput, isArabic && { textAlign: 'right' }]}
              placeholder={isArabic ? 'البحث في الملاحظات والتذكيرات' : 'Search Notes & Reminders'}
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#8E92A0" />
              </TouchableOpacity>
            )}
          </View>

          {/* Calendar / Reminder Time Button */}
          <TouchableOpacity
            style={[
              styles.controlIconButton,
              activeFilter === 'reminder' && styles.controlIconButtonActive,
            ]}
            activeOpacity={0.8}
            onPress={() => setCalendarModalVisible(true)}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={activeFilter === 'reminder' ? '#dbd4fd' : '#FFFFFF'}
            />
          </TouchableOpacity>

          {/* Filter Funnel Button */}
          <TouchableOpacity
            style={[
              styles.controlIconButton,
              activeFilter !== 'all' && styles.controlIconButtonActive,
            ]}
            activeOpacity={0.8}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={activeFilter !== 'all' ? '#dbd4fd' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* ─── Recent Notes & Reminders Feed ────────────────────────── */}
        <Animated.View entering={FadeInUp.duration(500).delay(200)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {isArabic ? 'الملاحظات والتذكيرات الأخيرة' : 'Recent'}
            </Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{notesAndRemindersList.length}</Text>
            </View>
          </View>

          {/* Recent Cards List */}
          <View style={styles.cardsList}>
            {notesAndRemindersList.map((item, index) => {
              const formattedTime = formatRelativeTime(item.createdAt);
              const isReminderItem = item.type === 'reminder' || (item.dueDate && item.dueDate > 0);

              return (
                <Animated.View
                  key={item._id}
                  entering={FadeInDown.duration(400).delay(index * 50)}
                >
                  <LivePress
                    style={styles.cardOuter}
                    activeOpacity={0.92}
                    onPress={() => {
                      if (item.isSample) {
                        router.push({ pathname: '/note-detail', params: { isReminder: isReminderItem ? 'true' : 'false' } });
                      } else {
                        router.push({ pathname: '/note-detail', params: { id: item._id } });
                      }
                    }}
                    onLongPress={() => {
                      setSelectedItem(item);
                      setActionVisible(true);
                    }}
                  >
                    {/* Header Row: Category Badge + Timestamp */}
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.categoryPill}>
                        <Text style={styles.categoryPillText}>
                          {isReminderItem
                            ? (isArabic ? 'تذكير' : 'Reminder')
                            : (isArabic ? 'ملاحظة' : 'Note')}
                        </Text>
                      </View>

                      <Text style={styles.cardTimestamp}>{formattedTime}</Text>
                    </View>

                    {/* Title */}
                    <Text style={[styles.cardTitle, isArabic && { textAlign: 'right' }]} numberOfLines={1}>
                      {item.text || (isArabic ? 'ملاحظة بدون عنوان' : 'Untitled Note')}
                    </Text>

                    {/* Snippet */}
                    <Text
                      style={[styles.cardSnippet, isArabic && { textAlign: 'right' }]}
                      numberOfLines={2}
                    >
                      {item.description || (isArabic ? 'لا يوجد تفاصيل مسجلة.' : 'No description provided.')}
                    </Text>

                    {/* Optional Reminder Time Pill */}
                    {item.dueDate ? (
                      <View style={styles.reminderBadge}>
                        <Ionicons name="alarm-outline" size={13} color="#FBBF24" />
                        <Text style={styles.reminderBadgeText}>
                          {new Date(item.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    ) : null}
                  </LivePress>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {/* ─── Calendar & Time Reminder Modal ───────────────────────── */}
      <Modal
        visible={isCalendarModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCalendarModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCalendarModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isArabic ? 'جدولة تذكير بوقت' : 'Schedule Reminder with Time'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setCalendarModalVisible(false)}
              >
                <Ionicons name="close" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Time Selector */}
            <View style={{ gap: 14 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#9CA3AF' }}>
                {isArabic ? 'اختر وقت التذكير:' : 'Select Reminder Time:'}
              </Text>

              <View
                style={{
                  flexDirection: isArabic ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#1E2028',
                  padding: 14,
                  borderRadius: 16,
                }}
              >
                <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="time-outline" size={22} color="#dbd4fd" />
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                    {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                {Platform.OS === 'ios' ? (
                  <DateTimePicker
                    value={reminderTime}
                    mode="time"
                    display="compact"
                    themeVariant="dark"
                    onChange={(e, d) => d && setReminderTime(d)}
                  />
                ) : (
                  <TouchableOpacity
                    onPress={() => setShowTimePicker(true)}
                    style={{
                      backgroundColor: '#2A2C38',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 10,
                    }}
                  >
                    <Text style={{ color: '#dbd4fd', fontWeight: '700' }}>
                      {isArabic ? 'تغيير الوقت' : 'Set Time'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {showTimePicker && Platform.OS !== 'ios' && (
                <DateTimePicker
                  value={reminderTime}
                  mode="time"
                  display="default"
                  themeVariant="dark"
                  onChange={(e, d) => {
                    setShowTimePicker(false);
                    if (d) setReminderTime(d);
                  }}
                />
              )}

              {/* Action Button: Create Reminder */}
              <TouchableOpacity
                style={styles.modalActionBtn}
                activeOpacity={0.88}
                onPress={handleCreateReminderFromCalendar}
              >
                <Text style={styles.modalActionBtnText}>
                  {isArabic ? 'إنشاء تذكير جديد بهذا الموعد' : 'Create Scheduled Reminder'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ─── Filter Options Modal ─────────────────────────────────── */}
      <Modal
        visible={isFilterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isArabic ? 'تصفية العرض' : 'Filter Display'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setFilterModalVisible(false)}
              >
                <Ionicons name="close" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Options */}
            {[
              { id: 'all', label: isArabic ? 'الكل (ملاحظات وتذكيرات)' : 'All (Notes & Reminders)', icon: 'layers-outline' },
              { id: 'note', label: isArabic ? 'الملاحظات فقط' : 'Notes Only', icon: 'document-text-outline' },
              { id: 'reminder', label: isArabic ? 'التذكيرات فقط' : 'Reminders Only', icon: 'alarm-outline' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={styles.filterOption}
                activeOpacity={0.7}
                onPress={() => {
                  setActiveFilter(opt.id as any);
                  setFilterModalVisible(false);
                }}
              >
                <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 12 }}>
                  <Ionicons name={opt.icon as any} size={20} color="#dbd4fd" />
                  <Text style={styles.filterOptionText}>{opt.label}</Text>
                </View>
                {activeFilter === opt.id && (
                  <Ionicons name="checkmark" size={20} color="#dbd4fd" />
                )}
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ─── Top 3-Dots Quick Action Modal ───────────────────────── */}
      <ActionModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        title={isArabic ? 'خيارات الملاحظات' : 'Notes Options'}
        isArabic={isArabic}
        options={[
          {
            label: isArabic ? 'ملاحظة جديدة' : 'New Note',
            icon: 'create-outline',
            onPress: () => router.push({ pathname: '/note-detail', params: { isReminder: 'false' } }),
          },
          {
            label: isArabic ? 'تذكير جديد بوقت' : 'New Reminder with Time',
            icon: 'alarm-outline',
            onPress: () => router.push({ pathname: '/note-detail', params: { isReminder: 'true' } }),
          },
          {
            label: isArabic ? 'دليل الاستخدام' : 'Screen Guide',
            icon: 'help-circle-outline',
            onPress: () => dismissGuide && dismissGuide(),
          },
          {
            label: isArabic ? 'إعادة ضبط الفلاتر' : 'Reset Filters',
            icon: 'refresh-outline',
            onPress: () => {
              setActiveFilter('all');
              setSearchQuery('');
            },
          },
        ]}
      />

      {/* ─── Card Long-Press Action Modal ─────────────────────────── */}
      <ActionModal
        visible={actionVisible}
        onClose={() => {
          setActionVisible(false);
          setSelectedItem(null);
        }}
        title={selectedItem?.text || (isArabic ? 'ملاحظة' : 'Note')}
        isArabic={isArabic}
        options={[
          {
            label: isArabic ? 'فتح وتعديل' : 'Open & Edit',
            icon: 'create-outline',
            onPress: () => {
              if (selectedItem && !selectedItem.isSample) {
                router.push({ pathname: '/note-detail', params: { id: selectedItem._id } });
              } else {
                router.push({ pathname: '/note-detail', params: { isReminder: selectedItem?.type === 'reminder' ? 'true' : 'false' } });
              }
            },
          },
          {
            label: isArabic ? 'مشاركة' : 'Share',
            icon: 'share-social-outline',
            onPress: () => {
              if (selectedItem) {
                Share.share({
                  message: `${selectedItem.text || 'Note'}\n\n${selectedItem.description || ''}`,
                });
              }
            },
          },
          {
            label: isArabic ? 'حذف' : 'Delete',
            icon: 'trash-outline',
            variant: 'destructive',
            onPress: () => {
              if (selectedItem && !selectedItem.isSample) {
                deleteTodo({ id: selectedItem._id });
              }
            },
          },
        ]}
      />

      {/* ─── Screen Guide Tips ────────────────────────────────────── */}
      <ScreenGuide
        visible={showGuide}
        tips={tips}
        onDismiss={dismissGuide}
        isArabic={isArabic}
      />
    </SafeAreaView>
  );
}
