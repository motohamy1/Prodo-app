import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Id } from '@/convex/_generated/dataModel';
import useTheme from '@/hooks/useTheme';
import LivePress from '@/components/LivePress';
import Reanimated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const START_HOUR = 5; // 05:00 AM
const END_HOUR = 24; // 12:00 AM midnight (19 hours total)
const TOTAL_HOURS = END_HOUR - START_HOUR;

export interface DayTimelineItem {
  id: string;
  source: 'todo' | 'plannerItem' | 'prayer';
  rawItem?: any;
  title: string;
  subtitle?: string;
  kind: 'meeting' | 'appointment' | 'checklist' | 'bullet' | 'prayer' | 'task';
  timeHour: number; // 0..23
  timeMinute: number; // 0..59
  durationMinutes: number;
  isCompleted: boolean;
  color?: string;
  icon?: string;
  location?: string;
  meetingLink?: string;
}

interface DayTimelineScheduleProps {
  year: number;
  month: number;
  day: number;
  selectedDateTs: number;
  tasks: any[];
  checklistItems: any[];
  bulletItems: any[];
  toggleItems: any[];
  isArabic: boolean;
  t: any;
  onToggleTodo: (todoId: Id<'todos'>, currentStatus?: string) => void;
  onTogglePlannerItem: (itemId: Id<'categoryItems'>, isCompleted?: boolean) => void;
  onDeleteTodo: (todoId: Id<'todos'>) => void;
  onDeletePlannerItem: (itemId: Id<'categoryItems'>) => void;
  onAddTodo: (payload: any) => Promise<any>;
  onAddPlannerItem: (payload: any) => Promise<any>;
  onOpenTaskDetails?: (todoId: Id<'todos'>) => void;
}

// Fixed calculated prayer times for daily structure
const DAILY_PRAYERS = [
  { key: 'fajr', en: 'Fajr', ar: 'الفجر', hour: 5, minute: 0, duration: 25, icon: 'weather-sunset-up', color: '#818CF8' },
  { key: 'dhuhr', en: 'Dhuhr', ar: 'الظهر', hour: 12, minute: 15, duration: 30, icon: 'weather-sunny', color: '#F59E0B' },
  { key: 'asr', en: 'Asr', ar: 'العصر', hour: 15, minute: 45, duration: 30, icon: 'weather-partly-cloudy', color: '#10B981' },
  { key: 'maghrib', en: 'Maghrib', ar: 'المغرب', hour: 18, minute: 30, duration: 25, icon: 'weather-sunset-down', color: '#EC4899' },
  { key: 'isha', en: 'Isha', ar: 'العشاء', hour: 20, minute: 0, duration: 30, icon: 'weather-night', color: '#8B5CF6' },
];

const KIND_CONFIG: Record<string, { labelEn: string; labelAr: string; icon: string; defaultColor: string }> = {
  meeting: { labelEn: 'Meeting', labelAr: 'اجتماع', icon: 'videocam', defaultColor: '#38BDF8' },
  appointment: { labelEn: 'Appointment', labelAr: 'موعد', icon: 'calendar', defaultColor: '#F59E0B' },
  task: { labelEn: 'Task', labelAr: 'مهمة', icon: 'checkbox-outline', defaultColor: '#10B981' },
  checklist: { labelEn: 'Checklist', labelAr: 'قائمة', icon: 'list', defaultColor: '#06B6D4' },
  bullet: { labelEn: 'Bullet Note', labelAr: 'ملاحظة', icon: 'document-text', defaultColor: '#8B5CF6' },
  prayer: { labelEn: 'Prayer', labelAr: 'صلاة', icon: 'sparkles', defaultColor: '#A78BFA' },
};

type ZoomLevel = 'compact' | 'standard' | 'detailed';

const ZOOM_CONFIG: Record<ZoomLevel, { hourHeight: number; labelEn: string; labelAr: string }> = {
  compact: { hourHeight: 52, labelEn: 'Compact', labelAr: 'مضغوط' },
  standard: { hourHeight: 80, labelEn: 'Standard', labelAr: 'قياسي' },
  detailed: { hourHeight: 120, labelEn: 'Detailed', labelAr: 'تفصيلي' },
};

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

export const DayTimelineSchedule: React.FC<DayTimelineScheduleProps> = ({
  year,
  month,
  day,
  selectedDateTs,
  tasks,
  checklistItems,
  bulletItems,
  toggleItems,
  isArabic,
  t,
  onToggleTodo,
  onTogglePlannerItem,
  onDeleteTodo,
  onDeletePlannerItem,
  onAddTodo,
  onAddPlannerItem,
  onOpenTaskDetails,
}) => {
  const { colors, isDarkMode } = useTheme();
  const timelineScrollRef = useRef<ScrollView>(null);

  // Zoom state
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('standard');
  const hourHeight = ZOOM_CONFIG[zoomLevel].hourHeight;
  const minuteHeight = hourHeight / 60;
  const totalTimelineHeight = TOTAL_HOURS * hourHeight;

  // Modal State for Adding Schedule Item
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number>(9);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [isPM, setIsPM] = useState<boolean>(false);
  const [selectedKind, setSelectedKind] = useState<'meeting' | 'appointment' | 'task' | 'checklist' | 'bullet'>('meeting');
  const [itemTitle, setItemTitle] = useState('');
  const [itemContextText, setItemContextText] = useState('');
  const [itemDuration, setItemDuration] = useState(30);

  // Prayer completion local state
  const [completedPrayers, setCompletedPrayers] = useState<Record<string, boolean>>({});

  const togglePrayer = (prayerKey: string) => {
    setCompletedPrayers((prev) => ({
      ...prev,
      [prayerKey]: !prev[prayerKey],
    }));
  };

  // Is today indicator
  const isToday = useMemo(() => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  }, [year, month, day]);

  const [currentMinutesFromStart, setCurrentMinutesFromStart] = useState<number | null>(null);

  useEffect(() => {
    if (!isToday) {
      setCurrentMinutesFromStart(null);
      return;
    }
    const updateNow = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      if (h >= START_HOUR && h <= END_HOUR) {
        setCurrentMinutesFromStart((h - START_HOUR) * 60 + m);
      } else {
        setCurrentMinutesFromStart(null);
      }
    };
    updateNow();
    const timer = setInterval(updateNow, 60000);
    return () => clearInterval(timer);
  }, [isToday]);

  // Build unified chronological timeline items (tasks, meetings, checklists, bullets)
  const scheduleItems = useMemo<DayTimelineItem[]>(() => {
    const items: DayTimelineItem[] = [];

    // 1. Todos & Tasks for this day
    tasks.forEach((todo) => {
      let timeH = 9;
      let timeM = 0;
      let duration = todo.timerDuration ? Math.round(todo.timerDuration / 60000) : 30;
      if (duration < 15) duration = 15;

      if (todo.dueDate) {
        const d = new Date(todo.dueDate);
        timeH = d.getHours();
        timeM = d.getMinutes();
      }

      let kind: DayTimelineItem['kind'] = 'task';
      if (todo.meetingLink || todo.type === 'meeting') kind = 'meeting';
      else if (todo.location || todo.type === 'appointment') kind = 'appointment';
      else if (todo.type === 'reminder') kind = 'appointment';

      items.push({
        id: todo._id,
        source: 'todo',
        rawItem: todo,
        title: todo.text || 'Untitled Task',
        subtitle: todo.description || (todo.location ? `📍 ${todo.location}` : undefined),
        kind,
        timeHour: timeH,
        timeMinute: timeM,
        durationMinutes: duration,
        isCompleted: todo.status === 'done',
        color: todo.status === 'done' ? '#10B981' : KIND_CONFIG[kind]?.defaultColor || colors.primary,
        location: todo.location,
        meetingLink: todo.meetingLink,
      });
    });

    // 2. Planner items (Checklists & Bullet points with default spread)
    checklistItems.forEach((cItem, idx) => {
      const timeH = Math.min(22, 10 + (idx % 8));
      items.push({
        id: cItem._id,
        source: 'plannerItem',
        rawItem: cItem,
        title: cItem.text,
        subtitle: isArabic ? 'عنصر قائمة تحقق' : 'Checklist item',
        kind: 'checklist',
        timeHour: timeH,
        timeMinute: 0,
        durationMinutes: 25,
        isCompleted: !!cItem.isCompleted,
        color: '#06B6D4',
      });
    });

    bulletItems.forEach((bItem, idx) => {
      const timeH = Math.min(22, 14 + (idx % 6));
      items.push({
        id: bItem._id,
        source: 'plannerItem',
        rawItem: bItem,
        title: bItem.text,
        subtitle: bItem.content || (isArabic ? 'نقطة مرجعية' : 'Bullet point note'),
        kind: 'bullet',
        timeHour: timeH,
        timeMinute: 15,
        durationMinutes: 20,
        isCompleted: !!bItem.isCompleted,
        color: '#8B5CF6',
      });
    });

    return items;
  }, [tasks, checklistItems, bulletItems, isArabic, colors.primary]);

  const TOP_OFFSET = 12;

  // Compute collision positions & heights for timeline items
  const laidOutItems = useMemo(() => {
    const sorted = [...scheduleItems].sort((a, b) => {
      const aStart = (a.timeHour - START_HOUR) * 60 + a.timeMinute;
      const bStart = (b.timeHour - START_HOUR) * 60 + b.timeMinute;
      return aStart - bStart;
    });

    return sorted.map((item) => {
      const startMin = Math.max(0, (item.timeHour - START_HOUR) * 60 + item.timeMinute);
      const top = startMin * minuteHeight + TOP_OFFSET;
      const height = Math.max(34, item.durationMinutes * minuteHeight - 3);

      return {
        ...item,
        top,
        height,
      };
    });
  }, [scheduleItems, minuteHeight]);

  const openAddAtTime = (hour: number, minute: number = 0) => {
    const clampedHour = Math.max(0, Math.min(23, hour));
    const h12 = clampedHour % 12 === 0 ? 12 : clampedHour % 12;
    setSelectedHour(h12);
    setSelectedMinute(minute);
    setIsPM(clampedHour >= 12);
    setItemTitle('');
    setItemContextText('');
    setModalVisible(true);
  };

  const handleSaveItem = async () => {
    if (!itemTitle.trim()) return;

    let h24 = selectedHour;
    if (isPM && h24 < 12) h24 += 12;
    if (!isPM && h24 === 12) h24 = 0;

    const targetDate = new Date(year, month, day, h24, selectedMinute).getTime();

    if (selectedKind === 'bullet' || selectedKind === 'checklist') {
      await onAddPlannerItem({
        text: itemTitle.trim(),
        content: itemContextText.trim() || undefined,
        listType: selectedKind,
        date: selectedDateTs,
      });
    } else {
      await onAddTodo({
        text: itemTitle.trim(),
        dueDate: targetDate,
        date: selectedDateTs,
        type: selectedKind,
        location: selectedKind === 'appointment' ? itemContextText.trim() || undefined : undefined,
        meetingLink: selectedKind === 'meeting' ? itemContextText.trim() || undefined : undefined,
        description: selectedKind === 'task' ? itemContextText.trim() || undefined : undefined,
        timerDuration: itemDuration * 60 * 1000,
        status: 'not_started',
      });
    }

    setItemTitle('');
    setItemContextText('');
    setModalVisible(false);
  };

  const formatTime12 = (hour: number, minute: number) => {
    const h = hour % 12 === 0 ? 12 : hour % 12;
    const m = minute < 10 ? `0${minute}` : minute;
    const ampm = hour >= 12 ? (isArabic ? 'م' : 'PM') : (isArabic ? 'ص' : 'AM');
    return `${h}:${m} ${ampm}`;
  };

  const getEndTimeStr = (hour12: number, minute: number, isPmVal: boolean, durationMin: number) => {
    let h24 = hour12;
    if (isPmVal && h24 < 12) h24 += 12;
    if (!isPmVal && h24 === 12) h24 = 0;

    const endTotalMin = h24 * 60 + minute + durationMin;
    const endH = Math.floor((endTotalMin / 60) % 24);
    const endM = endTotalMin % 60;
    return formatTime12(endH, endM);
  };

  // Generate continuous hours array (05:00 to 23:00)
  const hoursArray = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);

  return (
    <View style={styles.container}>
      {/* ─── Timeline Header (Row 1: Title & + Add Button) ─── */}
      <View style={[styles.headerTopRow, isArabic && { flexDirection: 'row-reverse' }]}>
        <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <View style={[styles.headerIconBadge, { backgroundColor: colors.primary + '18' }]}>
            <Ionicons name="time" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {t.daySchedule || (isArabic ? 'جدول اليوم الزمني' : 'Day Schedule')}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              {scheduleItems.length} {isArabic ? 'أحداث مجدولة' : 'scheduled events'}
            </Text>
          </View>
        </View>

        {/* Quick Add Button */}
        <LivePress
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => openAddAtTime(new Date().getHours())}
          pressScale={0.94}
        >
          <Ionicons name="add" size={18} color={colors.primaryText} />
          <Text style={[styles.addBtnText, { color: colors.primaryText }]}>
            {isArabic ? 'إضافة' : 'Add'}
          </Text>
        </LivePress>
      </View>

      {/* ─── Timeline Controls Bar (Row 2: Zoom Switcher & Hint) ─── */}
      <View style={[styles.headerControlsRow, isArabic && { flexDirection: 'row-reverse' }]}>
        {/* Zoom Level Switcher */}
        <View style={[styles.zoomControlBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {(['compact', 'standard', 'detailed'] as const).map((lvl) => {
            const active = zoomLevel === lvl;
            return (
              <TouchableOpacity
                key={lvl}
                style={[
                  styles.zoomTab,
                  active && { backgroundColor: colors.primary + '20', borderColor: colors.primary },
                ]}
                onPress={() => setZoomLevel(lvl)}
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              >
                <Text
                  style={[
                    styles.zoomTabText,
                    { color: active ? colors.primary : colors.textMuted },
                  ]}
                >
                  {isArabic ? ZOOM_CONFIG[lvl].labelAr : ZOOM_CONFIG[lvl].labelEn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tap Hint */}
        <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 4, flexShrink: 1 }}>
          <Ionicons name="finger-print-outline" size={12} color={colors.primary} />
          <Text style={[styles.hintText, { color: colors.textMuted }]} numberOfLines={1}>
            {isArabic ? 'المس لتحديد الوقت' : 'Tap slot to schedule'}
          </Text>
        </View>
      </View>

      {/* ─── Dynamic Zoomable Timeline Canvas ─── */}
      <ScrollView
        ref={timelineScrollRef}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        style={[styles.canvasScroll, { maxHeight: 460, borderColor: colors.border, backgroundColor: isDarkMode ? '#12141A' : '#FAFAFC' }]}
        contentContainerStyle={{ height: totalTimelineHeight + TOP_OFFSET + 30 }}
      >
        <View style={[styles.canvasInner, { height: totalTimelineHeight + TOP_OFFSET + 20 }]}>
          {/* 1. Hour Lines & Touchable Slots */}
          {hoursArray.map((h, idx) => {
            const topPos = idx * hourHeight + TOP_OFFSET;
            const isNoon = h === 12;
            const h12 = h % 12 === 0 ? 12 : h % 12;
            const ampm = h >= 12 ? (isArabic ? 'م' : 'PM') : (isArabic ? 'ص' : 'AM');

            return (
              <View key={`hour-${h}`} style={[styles.hourRowWrapper, { top: topPos, height: hourHeight }]}>
                {/* Left Time Label */}
                <View style={[styles.hourLabelCol, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.hourLabelText, { color: isNoon ? colors.primary : colors.textMuted }]}>
                    {`${h12} ${ampm}`}
                  </Text>
                </View>

                {/* Right Interactive Hour Grid Track */}
                <View style={styles.hourTrackCol}>
                  {/* Solid Hour Divider Line */}
                  <View style={[styles.hourDividerLine, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />

                  {/* Half Hour Divider Line */}
                  <View style={[styles.halfHourDividerLine, { top: hourHeight / 2, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]} />

                  {/* Top Half Slot Touch Target (:00) */}
                  <TouchableOpacity
                    style={[styles.slotTouchTarget, { top: 0, height: hourHeight / 2 }]}
                    onPress={() => openAddAtTime(h, 0)}
                    activeOpacity={0.4}
                  />

                  {/* Bottom Half Slot Touch Target (:30) */}
                  <TouchableOpacity
                    style={[styles.slotTouchTarget, { top: hourHeight / 2, height: hourHeight / 2 }]}
                    onPress={() => openAddAtTime(h, 30)}
                    activeOpacity={0.4}
                  />
                </View>
              </View>
            );
          })}

          {/* 2. Slim Non-Intrusive Floating Prayer Ribbons */}
          {DAILY_PRAYERS.map((prayer) => {
            const pStartMin = (prayer.hour - START_HOUR) * 60 + prayer.minute;
            if (pStartMin < 0 || pStartMin > TOTAL_HOURS * 60) return null;
            const topPos = pStartMin * minuteHeight + TOP_OFFSET;
            const isDone = !!completedPrayers[prayer.key];

            return (
              <View
                key={`prayer-ribbon-${prayer.key}`}
                style={[
                  styles.prayerRibbonContainer,
                  { top: Math.max(TOP_OFFSET - 8, topPos - 10) },
                  isArabic && { flexDirection: 'row-reverse', right: 54, left: 6 },
                ]}
                pointerEvents="box-none"
              >
                <View style={[styles.prayerLineAccent, { backgroundColor: prayer.color + '60' }]} />
                <View
                  style={[
                    styles.prayerRibbonPill,
                    {
                      backgroundColor: isDone ? (isDarkMode ? '#1E293B' : '#E2E8F0') : (isDarkMode ? '#1E1B4B' : '#EEF2FF'),
                      borderColor: isDone ? colors.border : prayer.color + '80',
                    },
                    isArabic && { flexDirection: 'row-reverse' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={prayer.icon as any}
                    size={12}
                    color={isDone ? colors.textMuted : prayer.color}
                  />
                  <Text
                    style={[
                      styles.prayerRibbonText,
                      { color: isDone ? colors.textMuted : (isDarkMode ? '#E0E7FF' : '#3730A3') },
                      isDone && styles.strikeText,
                    ]}
                  >
                    {isArabic ? prayer.ar : prayer.en} • {formatTime12(prayer.hour, prayer.minute)}
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.prayerCheckCircle,
                      {
                        backgroundColor: isDone ? '#10B981' : 'transparent',
                        borderColor: isDone ? '#10B981' : (isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
                      },
                    ]}
                    onPress={() => togglePrayer(prayer.key)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {isDone && <Ionicons name="checkmark" size={10} color="#FFFFFF" />}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {/* 3. Live "NOW" Current Time Indicator */}
          {currentMinutesFromStart !== null && (
            <View
              style={[
                styles.nowIndicatorContainer,
                { top: currentMinutesFromStart * minuteHeight + TOP_OFFSET },
                isArabic && { flexDirection: 'row-reverse', right: 54, left: 6 },
              ]}
              pointerEvents="none"
            >
              <View style={[styles.nowDot, { backgroundColor: '#EF4444' }]} />
              <View style={[styles.nowLine, { backgroundColor: '#EF4444' }]} />
              <View style={[styles.nowBadge, { backgroundColor: '#EF4444' }]}>
                <Text style={styles.nowBadgeText}>{t.now || 'NOW'}</Text>
              </View>
            </View>
          )}

          {/* 4. Proportional Duration Event Cards */}
          {laidOutItems.map((item, idx) => {
            const kindConf = KIND_CONFIG[item.kind] || KIND_CONFIG.task;
            const nodeColor = item.color || kindConf.defaultColor;
            const isDone = item.isCompleted;

            return (
              <Reanimated.View
                key={item.id}
                entering={FadeInDown.duration(280).delay(Math.min(idx * 25, 250))}
                style={[
                  styles.eventCardAbsolute,
                  {
                    top: item.top,
                    height: item.height,
                    backgroundColor: isDone ? (isDarkMode ? 'rgba(30,41,59,0.7)' : 'rgba(241,245,249,0.9)') : (isDarkMode ? '#1E222D' : '#FFFFFF'),
                    borderColor: isDone ? colors.border : nodeColor + '50',
                    borderLeftColor: nodeColor,
                  },
                  isArabic ? { right: 56, left: 6, borderRightWidth: 3.5, borderLeftWidth: 1, borderRightColor: nodeColor } : { left: 56, right: 6 },
                ]}
              >
                <LivePress
                  style={styles.eventCardContent}
                  onPress={() => {
                    if (item.source === 'todo' && item.rawItem && onOpenTaskDetails) {
                      onOpenTaskDetails(item.rawItem._id);
                    }
                  }}
                  onLongPress={() => {
                    if (item.source === 'todo') {
                      Alert.alert(
                        isArabic ? 'خيارات' : 'Options',
                        item.title,
                        [
                          { text: isArabic ? 'إلغاء' : 'Cancel', style: 'cancel' },
                          { text: isArabic ? 'حذف' : 'Delete', style: 'destructive', onPress: () => onDeleteTodo(item.rawItem._id) },
                        ]
                      );
                    } else if (item.source === 'plannerItem') {
                      Alert.alert(
                        isArabic ? 'خيارات' : 'Options',
                        item.title,
                        [
                          { text: isArabic ? 'إلغاء' : 'Cancel', style: 'cancel' },
                          { text: isArabic ? 'حذف' : 'Delete', style: 'destructive', onPress: () => onDeletePlannerItem(item.rawItem._id) },
                        ]
                      );
                    }
                  }}
                  pressScale={0.98}
                >
                  <View style={[styles.eventHeaderRow, isArabic && { flexDirection: 'row-reverse' }]}>
                    <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 5, flex: 1 }}>
                      <View style={[styles.kindDot, { backgroundColor: nodeColor }]} />
                      <Text
                        style={[
                          styles.eventTitleText,
                          { color: isDone ? colors.textMuted : colors.text },
                          isDone && styles.strikeText,
                          isArabic && { textAlign: 'right' },
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                    </View>

                    {/* Time & Check Circle */}
                    <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.eventTimeBadgeText, { color: colors.textMuted }]}>
                        {formatTime12(item.timeHour, item.timeMinute)} ({item.durationMinutes}m)
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.eventCheckCircle,
                          {
                            borderColor: isDone ? '#10B981' : colors.border,
                            backgroundColor: isDone ? '#10B981' : 'transparent',
                          },
                        ]}
                        onPress={() => {
                          if (item.source === 'todo' && item.rawItem) {
                            onToggleTodo(item.rawItem._id, item.rawItem.status);
                          } else if (item.source === 'plannerItem' && item.rawItem) {
                            onTogglePlannerItem(item.rawItem._id, item.rawItem.isCompleted);
                          }
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        {isDone && <Ionicons name="checkmark" size={10} color="#FFFFFF" />}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Subtitle / Links if height allows */}
                  {item.height >= 48 && (item.subtitle || item.location || item.meetingLink) ? (
                    <View style={[styles.eventMetaRow, isArabic && { flexDirection: 'row-reverse' }]}>
                      {item.meetingLink ? (
                        <View style={[styles.miniBadge, { backgroundColor: '#38BDF820' }]}>
                          <Ionicons name="videocam-outline" size={10} color="#38BDF8" />
                          <Text style={{ fontSize: 9, fontWeight: '700', color: '#38BDF8' }} numberOfLines={1}>
                            {isArabic ? 'رابط' : 'Link'}
                          </Text>
                        </View>
                      ) : null}
                      {item.location ? (
                        <View style={[styles.miniBadge, { backgroundColor: '#F59E0B20' }]}>
                          <Ionicons name="location-outline" size={10} color="#F59E0B" />
                          <Text style={{ fontSize: 9, fontWeight: '700', color: '#F59E0B' }} numberOfLines={1}>
                            {item.location}
                          </Text>
                        </View>
                      ) : null}
                      {item.subtitle && !item.location && !item.meetingLink ? (
                        <Text style={[styles.eventSubtitleText, { color: colors.textMuted }]} numberOfLines={1}>
                          {item.subtitle}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </LivePress>
              </Reanimated.View>
            );
          })}
        </View>
      </ScrollView>

      {/* ─── Polished Add to Schedule Modal ─── */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, { backgroundColor: isDarkMode ? '#1B1E28' : '#FFFFFF', borderColor: colors.border }]}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Header */}
              <View style={[styles.modalHeader, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.modalIconWrap, { backgroundColor: colors.primary + '18' }]}>
                    <Ionicons name="calendar" size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {t.addScheduleItem || (isArabic ? 'إضافة إلى الجدول' : 'Add to Schedule')}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Polished Horizontal Type Pills Selector */}
              <Text style={[styles.fieldLabel, { color: colors.textMuted }, isArabic && { textAlign: 'right' }]}>
                {isArabic ? 'نوع الحدث:' : 'Event Type:'}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.typePillScroll, isArabic && { flexDirection: 'row-reverse' }]}
              >
                {(['meeting', 'appointment', 'task', 'checklist', 'bullet'] as const).map((kind) => {
                  const conf = KIND_CONFIG[kind];
                  const isSel = selectedKind === kind;
                  return (
                    <TouchableOpacity
                      key={kind}
                      style={[
                        styles.typePill,
                        {
                          backgroundColor: isSel ? conf.defaultColor + '22' : (isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                          borderColor: isSel ? conf.defaultColor : 'transparent',
                        },
                      ]}
                      onPress={() => setSelectedKind(kind)}
                    >
                      <Ionicons name={conf.icon as any} size={14} color={isSel ? conf.defaultColor : colors.textMuted} />
                      <Text
                        style={[
                          styles.typePillText,
                          { color: isSel ? conf.defaultColor : colors.text },
                        ]}
                      >
                        {isArabic ? conf.labelAr : conf.labelEn}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Title Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: isDarkMode ? '#13151D' : '#F4F5F7', color: colors.text, borderColor: colors.border },
                    isArabic && { textAlign: 'right' },
                  ]}
                  placeholder={isArabic ? 'ماذا تخطط لهذا الوقت؟' : 'Title / Event name...'}
                  placeholderTextColor={colors.textMuted}
                  value={itemTitle}
                  onChangeText={setItemTitle}
                  autoFocus
                />
              </View>

              {/* Contextual Input (Link / Location / Description) */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: isDarkMode ? '#13151D' : '#F4F5F7', color: colors.text, borderColor: colors.border },
                    isArabic && { textAlign: 'right' },
                  ]}
                  placeholder={
                    selectedKind === 'meeting'
                      ? (isArabic ? 'رابط الاجتماع (Zoom / Meet...)' : 'Meeting link (Zoom/Meet)...')
                      : selectedKind === 'appointment'
                      ? (isArabic ? 'الموقع أو العنوان...' : 'Location / Room / Address...')
                      : (isArabic ? 'ملاحظات أو تفاصيل...' : 'Notes or details...')
                  }
                  placeholderTextColor={colors.textMuted}
                  value={itemContextText}
                  onChangeText={setItemContextText}
                />
              </View>

              {/* Time Selector Controls */}
              <View style={[styles.timeControlBox, { backgroundColor: isDarkMode ? '#13151D' : '#F4F5F7', borderColor: colors.border }]}>
                {/* Start Time Row */}
                <View style={[styles.timeRow, isArabic && { flexDirection: 'row-reverse' }]}>
                  <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="time-outline" size={16} color={colors.primary} />
                    <Text style={[styles.timeSectionTitle, { color: colors.text }]}>
                      {isArabic ? 'وقت البدء:' : 'Start Time:'}
                    </Text>
                  </View>

                  <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                    {/* Hour Stepper */}
                    <View style={styles.stepperGroup}>
                      <TouchableOpacity
                        style={[styles.miniStepBtn, { borderColor: colors.border }]}
                        onPress={() => setSelectedHour((h) => (h > 1 ? h - 1 : 12))}
                      >
                        <Ionicons name="remove" size={14} color={colors.text} />
                      </TouchableOpacity>
                      <Text style={[styles.timeValueText, { color: colors.text }]}>{selectedHour}</Text>
                      <TouchableOpacity
                        style={[styles.miniStepBtn, { borderColor: colors.border }]}
                        onPress={() => setSelectedHour((h) => (h < 12 ? h + 1 : 1))}
                      >
                        <Ionicons name="add" size={14} color={colors.text} />
                      </TouchableOpacity>
                    </View>

                    <Text style={{ fontWeight: '800', color: colors.text }}>:</Text>

                    {/* Minute Selector */}
                    <TouchableOpacity
                      style={[styles.minuteToggleBtn, { borderColor: colors.border }]}
                      onPress={() => setSelectedMinute((m) => (m === 0 ? 15 : m === 15 ? 30 : m === 30 ? 45 : 0))}
                    >
                      <Text style={[styles.timeValueText, { color: colors.text }]}>
                        {selectedMinute < 10 ? `0${selectedMinute}` : selectedMinute}
                      </Text>
                    </TouchableOpacity>

                    {/* AM / PM Toggle */}
                    <TouchableOpacity
                      style={[styles.amPmPill, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() => setIsPM((p) => !p)}
                    >
                      <Text style={styles.amPmText}>{isPM ? (isArabic ? 'م' : 'PM') : (isArabic ? 'ص' : 'AM')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Duration Pills Row */}
                <View style={[styles.durationSection, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.durationLabel, { color: colors.textMuted }]}>
                    {isArabic ? 'المدة:' : 'Duration:'}
                  </Text>
                  <View style={[styles.durationPillsRow, isArabic && { flexDirection: 'row-reverse' }]}>
                    {DURATION_PRESETS.map((dur) => {
                      const isSel = itemDuration === dur;
                      const label = dur >= 60 ? `${dur / 60}h` : `${dur}m`;
                      return (
                        <TouchableOpacity
                          key={dur}
                          style={[
                            styles.durationPill,
                            {
                              backgroundColor: isSel ? colors.primary : 'transparent',
                              borderColor: isSel ? colors.primary : colors.border,
                            },
                          ]}
                          onPress={() => setItemDuration(dur)}
                        >
                          <Text
                            style={[
                              styles.durationPillText,
                              { color: isSel ? colors.primaryText : colors.text },
                            ]}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={[styles.timeRangePreview, { color: colors.primary }]}>
                    {selectedHour}:{selectedMinute < 10 ? `0${selectedMinute}` : selectedMinute} {isPM ? 'PM' : 'AM'} ➔ {getEndTimeStr(selectedHour, selectedMinute, isPM, itemDuration)} ({itemDuration}m)
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={[styles.modalActions, isArabic && { flexDirection: 'row-reverse' }]}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: colors.border }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>
                    {isArabic ? 'إلغاء' : 'Cancel'}
                  </Text>
                </TouchableOpacity>

                <LivePress
                  style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSaveItem}
                  pressScale={0.96}
                >
                  <Text style={[styles.saveBtnText, { color: colors.primaryText }]}>
                    {isArabic ? 'حفظ في الجدول' : 'Add to Schedule'}
                  </Text>
                </LivePress>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  zoomControlBar: {
    flexDirection: 'row',
    borderRadius: 9,
    borderWidth: 1,
    padding: 2,
  },
  zoomTab: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  zoomTabText: {
    fontSize: 10,
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6.5,
    borderRadius: 10,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  hintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  hintText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  canvasScroll: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  canvasInner: {
    position: 'relative',
    width: '100%',
  },
  hourRowWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
  },
  hourLabelCol: {
    width: 50,
    alignItems: 'center',
    paddingTop: 2,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.06)',
  },
  hourLabelText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  hourTrackCol: {
    flex: 1,
    position: 'relative',
  },
  hourDividerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 1,
  },
  halfHourDividerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  slotTouchTarget: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
  },
  prayerRibbonContainer: {
    position: 'absolute',
    left: 52,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 3,
  },
  prayerLineAccent: {
    flex: 1,
    height: 1,
  },
  prayerRibbonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 6,
  },
  prayerRibbonText: {
    fontSize: 10,
    fontWeight: '800',
  },
  prayerCheckCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  strikeText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  nowIndicatorContainer: {
    position: 'absolute',
    left: 52,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 4,
  },
  nowDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  nowLine: {
    flex: 1,
    height: 1.5,
  },
  nowBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginRight: 8,
  },
  nowBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  eventCardAbsolute: {
    position: 'absolute',
    borderRadius: 10,
    borderWidth: 1,
    borderLeftWidth: 3.5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 2,
    overflow: 'hidden',
  },
  eventCardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  eventHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kindDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eventTitleText: {
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
  eventTimeBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  eventCheckCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  miniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  eventSubtitleText: {
    fontSize: 10,
    fontWeight: '500',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  typePillScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 10,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  inputContainer: {
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    fontWeight: '600',
    borderWidth: 1,
  },
  timeControlBox: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginVertical: 4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  stepperGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniStepBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeValueText: {
    fontSize: 13,
    fontWeight: '800',
    minWidth: 18,
    textAlign: 'center',
  },
  minuteToggleBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  amPmPill: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  amPmText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  durationSection: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  durationLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  durationPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  durationPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
  },
  durationPillText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  timeRangePreview: {
    fontSize: 10.5,
    fontWeight: '800',
    marginTop: 6,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
});

export default DayTimelineSchedule;
