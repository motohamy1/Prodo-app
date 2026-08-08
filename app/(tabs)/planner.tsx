import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Animated, StyleSheet, BackHandler, KeyboardAvoidingView, Platform, FlatList, Share, TextInput, Dimensions, LayoutAnimation } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { createPlannerStyles } from '@/assets/styles/planner.styles';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { api } from '@/convex/_generated/api';
import TodoInput from '@/components/TodoInput';
import TodoCard from '@/components/TodoCard';
import TimerModal from '@/components/TimerModal';
import ProjectPickerModal from '@/components/ProjectPickerModal';
import ActionModal from '@/components/ActionModal';
import PlannerListModal from '@/components/PlannerListModal';
import { createHomeStyles } from '@/assets/styles/home.styles';
import { Id } from '@/convex/_generated/dataModel';

import { useTranslation } from '@/utils/i18n';
import { useScreenGuide } from '@/hooks/useScreenGuide';
import ScreenGuide from '@/components/ScreenGuide';
import type { GuideTip } from '@/components/ScreenGuide';
import { LIST_TYPE_COLORS } from '@/utils/magicColors';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

const months_en = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'
];

const months_ar = [
  'يناير', 'فبراير', 'مارس', 'أبريل',
  'مايو', 'يونيو', 'يوليو', 'أغسطس',
  'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const LIST_TYPE_CARDS = [
  { key: 'checklist', label: 'Checklists', icon: 'checkbox-outline', color: LIST_TYPE_COLORS.checklist },
  { key: 'bullet', label: 'Bullet Points', icon: 'ellipse', color: LIST_TYPE_COLORS.bullet },
  { key: 'toggle', label: 'Toggle Lists', icon: 'albums-outline', color: LIST_TYPE_COLORS.toggle },
];

const Planner = () => {
  const { colors, isDarkMode } = useTheme();
  const { userId, language } = useAuth();
  const { t, isArabic } = useTranslation(language);
  const styles = createPlannerStyles(colors, isArabic);
  const homeStyles = createHomeStyles(colors, isArabic);
  const cardBg = colors.surface;
  const router = useRouter();
  const months = isArabic ? months_ar : months_en;
  const { showGuide, dismissGuide } = useScreenGuide('planner');

  const plannerTips: GuideTip[] = isArabic ? [
    { icon: 'calendar-outline', title: 'اختر شهراً', description: 'اضغط على أي شهر لعرض أيامه ومهامه.', accentColor: '#F2B544' },
    { icon: 'eye-outline', title: 'عرض اليوم', description: 'اضغط على يوم لرؤية المهام والملاحظات والتذكيرات.', accentColor: '#4EE6C1' },
    { icon: 'arrow-back-outline', title: 'الرجوع', description: 'اضغط X للعودة إلى عرض الشهور في أي وقت.', accentColor: '#A89CFF' },
  ] : [
    { icon: 'calendar-outline', title: 'Pick a Month', description: 'Tap any month to view its days and your scheduled tasks.', accentColor: '#F2B544' },
    { icon: 'eye-outline', title: 'Day View', description: 'Tap a day to see tasks, notes, and reminders for that date.', accentColor: '#4EE6C1' },
    { icon: 'arrow-back-outline', title: 'Go Back', description: 'Tap the X button to return to the month grid anytime.', accentColor: '#A89CFF' },
  ];
  
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  
  const [expandedTodoId, setExpandedTodoId] = useState<Id<"todos"> | null>(null);
  const [isTimerModalVisible, setTimerModalVisible] = useState(false);
  const [isProjectModalVisible, setProjectModalVisible] = useState(false);
  const [selectedTodoId, setSelectedTodoId] = useState<Id<"todos"> | null>(null);
  
  const [isActionModalVisible, setActionModalVisible] = useState(false);
  const [selectedItemForAction, setSelectedItemForAction] = useState<any>(null);

  const [plannerListModalVisible, setPlannerListModalVisible] = useState(false);
  const [activePlannerListType, setActivePlannerListType] = useState<string>('checklist');

  // Collapsible section state for day view
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    lists: false,
    reminders: false,
    notes: false,
    tasks: false,
    completed: false,
  });

  const toggleSection = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateTodoStatus = useOfflineMutation(api.todos.updateStatus, "todos:updateStatus");
  const deleteTodoMutation = useOfflineMutation(api.todos.deleteTodo, "todos:deleteTodo");
  const setTimerMutation = useOfflineMutation(api.todos.setTimer, "todos:setTimer");
  const linkProjectMutation = useOfflineMutation(api.todos.linkProject, "todos:linkProject");
  const linkTaskMutation = useOfflineMutation(api.todos.linkTask, "todos:linkTask");
  const scrollViewRef = useRef<ScrollView>(null);
  const yearScrollRef = useRef<ScrollView>(null);

  // Scroll year carousel to current year on mount
  useEffect(() => {
    const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
    const currentIndex = years.indexOf(currentYear);
    if (currentIndex !== -1 && yearScrollRef.current) {
      setTimeout(() => {
        yearScrollRef.current?.scrollTo({ x: currentIndex * screenWidth, animated: false });
      }, 100);
    }
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 200);
  };




  // Handle system back button
  useEffect(() => {
    const backAction = () => {
      if (selectedDay !== null) {
        setSelectedDay(null);
        return true;
      }
      if (selectedMonth !== null) {
        setSelectedMonth(null);
        return true;
      }
      return false; // let default behavior happen
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [selectedMonth, selectedDay]);

  
  const todos = useOfflineQuery<any[]>('todos', api.todos.get, userId ? { userId } : "skip") || [];

  const { width: screenWidth } = Dimensions.get('window');
  const currentYear = new Date().getFullYear();
  const [activeYear, setActiveYear] = useState(currentYear);

  const selectedDateTs = selectedDay !== null && selectedMonth !== null
    ? new Date(currentYear, selectedMonth, selectedDay).getTime()
    : null;

  const plannerChecklistItems = useOfflineQuery<any[]>('plannerItems_checklist', api.projects.getPlannerItems, selectedDateTs && userId ? { userId, date: selectedDateTs, listType: 'checklist' } : "skip");
  const plannerBulletItems = useOfflineQuery<any[]>('plannerItems_bullet', api.projects.getPlannerItems, selectedDateTs && userId ? { userId, date: selectedDateTs, listType: 'bullet' } : "skip");
  const plannerToggleItems = useOfflineQuery<any[]>('plannerItems_toggle', api.projects.getPlannerItems, selectedDateTs && userId ? { userId, date: selectedDateTs, listType: 'toggle' } : "skip");

  const allGoals = useOfflineQuery<any[]>('yearlyGoals', api.yearlyGoals.getAllGoals, userId ? { userId } : "skip") || [];
  const allAchievements = useOfflineQuery<any[]>('yearlyAchievements', api.yearlyGoals.getAllAchievements, userId ? { userId } : "skip") || [];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getTasksForDay = (day: number, month: number, year: number) => {
    return todos.filter(todo => {
      const targetDate = (todo.status === 'done' && todo.completedAt) ? todo.completedAt : (todo.dueDate || todo.date);
      if (!targetDate) return false;
      const todoDate = new Date(targetDate);
      return todoDate.getDate() === day && 
             todoDate.getMonth() === month && 
             todoDate.getFullYear() === year;
    });
  };

  const resetAll = () => {
    setSelectedMonth(null);
    setSelectedDay(null);
  };

  const getTasksForMonth = (monthIndex: number) => {
    return todos.filter(todo => {
      const targetDate = (todo.status === 'done' && todo.completedAt) ? todo.completedAt : (todo.dueDate || todo.date);
      if (!targetDate) return false;
      const todoDate = new Date(targetDate);
      return todoDate.getMonth() === monthIndex && todoDate.getFullYear() === currentYear;
    });
  };

  // Helper: parse checklist stats from description
  const getChecklistStats = (description?: string) => {
    if (!description) return { total: 0, completed: 0 };
    const lines = description.split('\n');
    const todos = lines.filter(l => l.startsWith('☐ ') || l.startsWith('☑ '));
    const completed = lines.filter(l => l.startsWith('☑ ')).length;
    return { total: todos.length, completed };
  };

  const renderMonthGrid = () => {
    const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
      >
        {/* ─── Goals of the Year ─── */}
        <View style={styles.yearSectionHeader}>
          <Text style={styles.yearSectionTitle}>{t.goalsOfTheYear}</Text>
          <Text style={styles.yearSectionSubtitle}>{t.year} {activeYear}</Text>
        </View>

        <ScrollView
          ref={yearScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const pageIndex = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
            if (pageIndex >= 0 && pageIndex < years.length) {
              setActiveYear(years[pageIndex]);
            }
          }}
          contentContainerStyle={styles.yearScrollContainer}
          style={{ height: 220 }}
        >
          {years.map((year) => {
            const yearGoalDocs = allGoals.filter((g: any) => g.year === year);
            const yearAchievementDocs = allAchievements.filter((a: any) => a.year === year);
            const isCurrent = year === currentYear;

            // Aggregate checklist stats across all goal docs for this year
            let totalGoals = 0;
            let completedGoals = 0;
            yearGoalDocs.forEach((doc: any) => {
              const stats = getChecklistStats(doc.description);
              totalGoals += stats.total;
              completedGoals += stats.completed;
            });
            // Fallback: if no checklists parsed but docs exist, count docs as items
            if (totalGoals === 0 && yearGoalDocs.length > 0) {
              totalGoals = yearGoalDocs.length;
              completedGoals = yearGoalDocs.filter((d: any) => d.isCompleted).length;
            }

            const goalProgress = totalGoals > 0 ? completedGoals / totalGoals : 0;
            const achievementCount = yearAchievementDocs.length;

            return (
                <View key={year} style={{ width: screenWidth, paddingHorizontal: 16 }}>
                <TouchableOpacity
                  style={[styles.yearCard, isCurrent && styles.yearCardActive]}
                  onPress={() => router.push({ pathname: '/year-detail', params: { year: year.toString() } })}
                  activeOpacity={0.85}
                >
                  <View style={styles.yearCardHeader}>
                    <Text style={styles.yearCardTitle}>{year}</Text>
                  <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                    {isCurrent && (
                      <Text style={styles.yearCardBadge}>{t.current}</Text>
                    )}
                    <Ionicons name="create-outline" size={18} color={colors.textMuted} />
                  </View>
                </View>

                {/* Stats Row */}
                <View style={{
                  flexDirection: isArabic ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 12,
                  gap: 12,
                }}>
                  {/* Goals stat */}
                  <View style={{
                    flex: 1,
                    backgroundColor: colors.bg,
                    borderRadius: 16,
                    padding: 12,
                    alignItems: 'center',
                  }}>
                    <Ionicons name="flag-outline" size={20} color={colors.primary} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, marginTop: 4 }}>
                      {totalGoals > 0 ? `${completedGoals}/${totalGoals}` : '—'}
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted }}>
                      {t.goalsOfTheYear}
                    </Text>
                  </View>

                  {/* Achievements stat */}
                  <View style={{
                    flex: 1,
                    backgroundColor: colors.bg,
                    borderRadius: 16,
                    padding: 12,
                    alignItems: 'center',
                  }}>
                    <Ionicons name="trophy-outline" size={20} color={colors.success} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, marginTop: 4 }}>
                      {achievementCount}
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted }}>
                      {t.achievementsOfTheYear}
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
                {totalGoals > 0 && (
                  <View style={{ marginTop: 14 }}>
                    <View style={{
                      height: 6,
                      backgroundColor: colors.border + '40',
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}>
                      <View style={{
                        height: '100%',
                        width: `${goalProgress * 100}%`,
                        backgroundColor: colors.primary,
                        borderRadius: 3,
                      }} />
                    </View>
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: colors.primary,
                      marginTop: 6,
                      textAlign: isArabic ? 'right' : 'left',
                    }}>
                      {Math.round(goalProgress * 100)}% {t.goalCompleted}
                    </Text>
                  </View>
                )}

                {totalGoals === 0 && (
                  <Text style={{
                    textAlign: 'center',
                    color: colors.textMuted,
                    fontSize: 13,
                    fontWeight: '500',
                    marginTop: 14,
                  }}>
                    {t.tapToPlan}
                  </Text>
                )}
              </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>

        {/* ─── Month Grid ─── */}
        <View style={[styles.monthGrid, isArabic && { flexDirection: 'row-reverse' }]}>
          {months.map((month, index) => {
            const tasks = getTasksForMonth(index);
            const isSelected = selectedMonth === index;
            return (
              <Reanimated.View key={month} entering={FadeInDown.duration(420).delay(index * 50)} style={{ width: '31%' }}>
                <TouchableOpacity
                  style={[styles.monthCard, isSelected && styles.selectedMonthCard]}
                  onPress={() => setSelectedMonth(index)}
                  activeOpacity={0.7}
                >
                  {tasks.length > 0 && !isSelected && <View style={styles.monthIndicator} />}
                  <Text style={[styles.monthName, isSelected && styles.selectedMonthName]}>
                    {isArabic ? month : month.substring(0, 3)}
                  </Text>
                  <Text style={[styles.monthStats, isSelected && styles.selectedMonthStats]}>
                    {tasks.length > 0 ? `${tasks.length} ${tasks.length === 1 ? t.task : t.tasks}` : t.empty}
                  </Text>
                </TouchableOpacity>
              </Reanimated.View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  const renderDayGrid = (monthIndex: number) => {
    const daysInMonth = getDaysInMonth(monthIndex, currentYear);
    const dayElements = [];

    for (let i = 1; i <= daysInMonth; i++) {
        const tasks = getTasksForDay(i, monthIndex, currentYear);
        const isToday = i === new Date().getDate() && 
                        monthIndex === new Date().getMonth() && 
                        currentYear === new Date().getFullYear();

        dayElements.push(
            <Reanimated.View 
                key={i} 
                entering={FadeInDown.duration(380).delay((i % 14) * 40)} 
                style={{ width: '13%' }}
            >
                <TouchableOpacity 
                style={[
                    styles.dayCard, 
                    tasks.length > 0 && styles.hasTaskCard,
                    isToday && styles.todayCard
                ]}
                onPress={() => setSelectedDay(i)}
                activeOpacity={0.7}
            >
                {tasks.length > 0 && !isToday && <View style={styles.monthIndicator} />}
                <Text style={[
                    styles.dayText, 
                    isToday && styles.todayText
                ]}>{i}</Text>
                <Text style={[
                    styles.dayStats, 
                    isToday && styles.todayStats
                ]}>
                    {tasks.length > 0 ? `${tasks.length} ${tasks.length === 1 ? t.task : t.tasks}` : t.empty}
                </Text>
            </TouchableOpacity>
            </Reanimated.View>
        );
    }

    return (
        <ScrollView 
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }} 
            showsVerticalScrollIndicator={false}
        >

            <View style={{ paddingHorizontal: 24, marginBottom: 32, alignItems: 'center' }}>
                <Text style={[styles.headerTitle, { fontSize: isArabic ? 34 : 38, letterSpacing: -1 }]}>{months[monthIndex]}</Text>
                <View style={{ height: 4, width: 40, backgroundColor: colors.primary, borderRadius: 2, marginTop: 8 }} />
                <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 12, fontWeight: '700' }}>
                    {getTasksForMonth(monthIndex).length} {t.tasksThisMonth}
                </Text>
            </View>

            {/* ─── Monthly Goals Card ─── */}
            {(() => {
              const monthTasks = getTasksForMonth(monthIndex);
              const monthGoalDocs = allGoals.filter((g: any) => g.year === currentYear && g.month === monthIndex && g.day === undefined);
              const monthAchievementDocs = allAchievements.filter((a: any) => a.year === currentYear && a.month === monthIndex && a.day === undefined);

              let totalGoals = 0;
              let completedGoals = 0;
              monthGoalDocs.forEach((doc: any) => {
                const stats = getChecklistStats(doc.description);
                totalGoals += stats.total;
                completedGoals += stats.completed;
              });
              if (totalGoals === 0 && monthGoalDocs.length > 0) {
                totalGoals = monthGoalDocs.length;
                completedGoals = monthGoalDocs.filter((d: any) => d.isCompleted).length;
              }

              const goalProgress = totalGoals > 0 ? completedGoals / totalGoals : 0;
              const achievementCount = monthAchievementDocs.length;

              return (
                <TouchableOpacity
                  style={{
                    backgroundColor: cardBg,
                    marginHorizontal: 20,
                    marginBottom: 24,
                    borderRadius: 28,
                    padding: 20,
                    shadowColor: colors.shadow,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.06,
                    shadowRadius: 12,
                    elevation: 3,
                  }}
                  onPress={() => router.push({
                    pathname: '/goals-detail',
                    params: {
                      year: currentYear.toString(),
                      month: monthIndex.toString(),
                      title: isArabic ? `أهداف ${months[monthIndex]}` : `${months[monthIndex]} Goals`,
                    }
                  })}
                  activeOpacity={0.85}
                >
                  <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>
                      {isArabic ? `أهداف ${months[monthIndex]}` : `${months[monthIndex]} Goals`}
                    </Text>
                    <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="create-outline" size={18} color={colors.textMuted} />
                    </View>
                  </View>

                  <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <View style={{ flex: 1, backgroundColor: colors.bg, borderRadius: 16, padding: 12, alignItems: 'center' }}>
                      <Ionicons name="flag-outline" size={20} color={colors.primary} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, marginTop: 4 }}>
                        {totalGoals > 0 ? `${completedGoals}/${totalGoals}` : '—'}
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted }}>
                        {isArabic ? 'الأهداف' : 'Goals'}
                      </Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: colors.bg, borderRadius: 16, padding: 12, alignItems: 'center' }}>
                      <Ionicons name="trophy-outline" size={20} color={colors.success} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, marginTop: 4 }}>
                        {achievementCount}
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted }}>
                        {isArabic ? 'إنجازات' : 'Achievements'}
                      </Text>
                    </View>
                  </View>

                  {totalGoals > 0 && (
                    <View style={{ marginTop: 14 }}>
                      <View style={{ height: 6, backgroundColor: colors.border + '40', borderRadius: 3, overflow: 'hidden' }}>
                        <View style={{ height: '100%', width: `${goalProgress * 100}%`, backgroundColor: colors.primary, borderRadius: 3 }} />
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary, marginTop: 6, textAlign: isArabic ? 'right' : 'left' }}>
                        {Math.round(goalProgress * 100)}% {isArabic ? 'مكتمل' : 'complete'}
                      </Text>
                    </View>
                  )}

                  {totalGoals === 0 && (
                    <Text style={{ textAlign: 'center', color: colors.textMuted, fontSize: 13, fontWeight: '500', marginTop: 14 }}>
                      {isArabic ? 'اضغط للتخطيط' : 'Tap to plan'}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })()}

            <View style={[styles.dayGrid, isArabic && { flexDirection: 'row-reverse' }]}>
                {isArabic ? [...dayElements].reverse() : dayElements}
            </View>

            {/* ─── Month Bottom Summary ─── */}
            {(() => {
              const monthTasks = getTasksForMonth(monthIndex);
              const monthGoalDocs = allGoals.filter((g: any) => g.year === currentYear && g.month === monthIndex && g.day === undefined);
              const monthAchievementDocs = allAchievements.filter((a: any) => a.year === currentYear && a.month === monthIndex && a.day === undefined);
              
              const notDoneTasks = monthTasks.filter(t => t.status === 'not_done' || (t.status === 'not_started' && t.dueDate && new Date(t.dueDate).setHours(23,59,59,999) < Date.now()));
              const completedTasks = monthTasks.filter(t => t.status === 'done');
              const incompleteGoals = monthGoalDocs.filter((g: any) => !g.isCompleted);
              const completedGoals = monthGoalDocs.filter((g: any) => g.isCompleted);
              const completedAchievements = monthAchievementDocs.filter((a: any) => a.isCompleted);
              const incompleteAchievements = monthAchievementDocs.filter((a: any) => !a.isCompleted);
              
              const hasContent = notDoneTasks.length > 0 || completedTasks.length > 0 || incompleteGoals.length > 0 || completedGoals.length > 0 || completedAchievements.length > 0 || incompleteAchievements.length > 0;
              if (!hasContent) return null;
              
              return (
                <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
                  <View style={{
                    backgroundColor: cardBg,
                    borderRadius: 24,
                    padding: 20,
                    shadowColor: colors.shadow,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.06,
                    shadowRadius: 12,
                    elevation: 3,
                  }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 12 }}>
                      {isArabic ? 'ملخص الشهر' : 'Month Summary'}
                    </Text>
                    
                    {completedTasks.length > 0 && (
                      <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.success, flex: 1 }}>
                          {completedTasks.length} {isArabic ? 'مهام مكتملة' : 'tasks completed'}
                        </Text>
                      </View>
                    )}
                    
                    {completedGoals.length > 0 && (
                      <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Ionicons name="flag" size={16} color={colors.success} />
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.success, flex: 1 }}>
                          {completedGoals.length} {isArabic ? 'أهداف محققة' : 'goals achieved'}
                        </Text>
                      </View>
                    )}

                    {completedAchievements.length > 0 && (
                      <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Ionicons name="trophy" size={16} color={colors.success} />
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.success, flex: 1 }}>
                          {completedAchievements.length} {isArabic ? 'إنجازات محققة' : 'achievements reached'}
                        </Text>
                      </View>
                    )}
                    
                    {notDoneTasks.length > 0 && (
                      <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Ionicons name="alert-circle" size={16} color={colors.danger} />
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.danger, flex: 1 }}>
                          {notDoneTasks.length} {isArabic ? 'مهام لم تنجز' : 'tasks not done'}
                        </Text>
                      </View>
                    )}

                    {incompleteGoals.length > 0 && (
                      <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Ionicons name="flag-outline" size={16} color={colors.danger} />
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.danger, flex: 1 }}>
                          {incompleteGoals.length} {isArabic ? 'أهداف لم تتحقق' : 'goals not met'}
                        </Text>
                      </View>
                    )}

                    {incompleteAchievements.length > 0 && (
                      <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Ionicons name="trophy-outline" size={16} color={colors.danger} />
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.danger, flex: 1 }}>
                          {incompleteAchievements.length} {isArabic ? 'إنجازات لم تتحقق' : 'achievements not reached'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })()}
        </ScrollView>
    );
  };

  const getPlannerListCount = (key: string) => {
    if (key === 'checklist') return plannerChecklistItems?.length || 0;
    if (key === 'bullet') return plannerBulletItems?.length || 0;
    if (key === 'toggle') return plannerToggleItems?.length || 0;
    return 0;
  };

  const openPlannerListModal = (listType: string) => {
    setActivePlannerListType(listType);
    setPlannerListModalVisible(true);
  };

  const renderSpecificDayView = (day: number, month: number, year: number) => {
    const tasks = getTasksForDay(day, month, year);
    const selectedDateTs = new Date(year, month, day).getTime();

    return (
        <ScrollView 
            ref={scrollViewRef} 
            contentContainerStyle={{ paddingBottom: 100 }} 
            showsVerticalScrollIndicator={false} 
            keyboardShouldPersistTaps="handled"
        >


            <View style={[styles.specificDayHeader, isArabic && { alignItems: 'flex-end' }]}>
                <Text style={styles.specificDayTitle}>{isArabic ? `${day} ${months[month]}` : `${day} ${months[month]}`}</Text>
                <Text style={[styles.specificDaySubtitle, isArabic && { textAlign: 'right' }]}>
                    {tasks.length === 0 ? t.startPlanning : `${tasks.length} ${t.tasksScheduled}`}
                </Text>
            </View>

            {/* ─── Daily Goals Card ─── */}
            {(() => {
              const dayGoalDocs = allGoals.filter((g: any) => g.year === year && g.month === month && g.day === day);
              const dayAchievementDocs = allAchievements.filter((a: any) => a.year === year && a.month === month && a.day === day);

              let totalGoals = 0;
              let completedGoals = 0;
              dayGoalDocs.forEach((doc: any) => {
                const stats = getChecklistStats(doc.description);
                totalGoals += stats.total;
                completedGoals += stats.completed;
              });
              if (totalGoals === 0 && dayGoalDocs.length > 0) {
                totalGoals = dayGoalDocs.length;
                completedGoals = dayGoalDocs.filter((d: any) => d.isCompleted).length;
              }

              const goalProgress = totalGoals > 0 ? completedGoals / totalGoals : 0;
              const achievementCount = dayAchievementDocs.length;

              return (
                <TouchableOpacity
                  style={{
                    backgroundColor: cardBg,
                    marginHorizontal: 20,
                    marginBottom: 20,
                    borderRadius: 28,
                    padding: 18,
                    shadowColor: colors.shadow,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.06,
                    shadowRadius: 12,
                    elevation: 3,
                  }}
                  onPress={() => router.push({
                    pathname: '/goals-detail',
                    params: {
                      year: year.toString(),
                      month: month.toString(),
                      day: day.toString(),
                      title: isArabic ? `أهداف ${day} ${months[month]}` : `${months[month]} ${day} Goals`,
                    }
                  })}
                  activeOpacity={0.85}
                >
                  <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                      {isArabic ? 'أهداف اليوم' : "Today's Goals"}
                    </Text>
                    <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="create-outline" size={18} color={colors.textMuted} />
                    </View>
                  </View>

                  <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <View style={{ flex: 1, backgroundColor: colors.bg, borderRadius: 16, padding: 12, alignItems: 'center' }}>
                      <Ionicons name="flag-outline" size={20} color={colors.primary} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, marginTop: 4 }}>
                        {totalGoals > 0 ? `${completedGoals}/${totalGoals}` : '—'}
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted }}>
                        {isArabic ? 'أهداف' : 'Goals'}
                      </Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: colors.bg, borderRadius: 16, padding: 12, alignItems: 'center' }}>
                      <Ionicons name="trophy-outline" size={20} color={colors.success} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, marginTop: 4 }}>
                        {achievementCount}
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted }}>
                        {isArabic ? 'إنجازات' : 'Achievements'}
                      </Text>
                    </View>
                  </View>

                  {totalGoals > 0 && (
                    <View style={{ marginTop: 14 }}>
                      <View style={{ height: 6, backgroundColor: colors.border + '40', borderRadius: 3, overflow: 'hidden' }}>
                        <View style={{ height: '100%', width: `${goalProgress * 100}%`, backgroundColor: colors.primary, borderRadius: 3 }} />
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary, marginTop: 6, textAlign: isArabic ? 'right' : 'left' }}>
                        {Math.round(goalProgress * 100)}% {isArabic ? 'مكتمل' : 'complete'}
                      </Text>
                    </View>
                  )}

                  {totalGoals === 0 && (
                    <Text style={{ textAlign: 'center', color: colors.textMuted, fontSize: 13, fontWeight: '500', marginTop: 14 }}>
                      {isArabic ? 'اضغط للتخطيط' : 'Tap to plan'}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })()}

            {/* Day Lists Section */}
            <View style={styles.dayListsSection}>
              <TouchableOpacity 
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}
                onPress={() => toggleSection('lists')}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[{ fontSize: 20, fontWeight: '800', color: colors.text }, isArabic && { textAlign: 'right' }]}>{t.lists || 'Lists'}</Text>
                </View>
                <Ionicons name={collapsedSections.lists ? 'chevron-forward' : 'chevron-down'} size={22} color={colors.textMuted} />
              </TouchableOpacity>
              {!collapsedSections.lists && (
              <View style={styles.dayListsGrid}>
                {LIST_TYPE_CARDS.map(card => {
                  const count = getPlannerListCount(card.key);
                  const label = isArabic
                    ? (card.key === 'checklist' ? t.checklists : card.key === 'bullet' ? t.bulletPoints : t.toggleLists)
                    : card.label;
                  return (
                    <TouchableOpacity
                      key={card.key}
                      style={styles.dayListCard}
                      onPress={() => openPlannerListModal(card.key)}
                      activeOpacity={0.82}
                    >
                      <View style={[styles.dayListCardIconWrap, { backgroundColor: card.color + '20' }]}>
                        <Ionicons name={card.icon as any} size={24} color={card.color} />
                      </View>
                      <Text style={styles.dayListCardTitle}>{label}</Text>
                      <Text style={styles.dayListCardCount}>{count} {count === 1 ? (isArabic ? 'عنصر' : 'item') : (isArabic ? 'عناصر' : 'items')}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              )}
            </View>

            {tasks.filter(t => t.type === 'reminder').length > 0 && (
                <View style={{ marginBottom: 32 }}>
                    <TouchableOpacity 
                      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 }}
                      onPress={() => toggleSection('reminders')}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[{ fontSize: 20, fontWeight: '800', color: colors.text }, isArabic && { textAlign: 'right' }]}>{isArabic ? 'التذكيرات' : 'Reminders'}</Text>
                        <View style={{ backgroundColor: colors.primary + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>{tasks.filter(t => t.type === 'reminder').length}</Text>
                        </View>
                      </View>
                      <Ionicons name={collapsedSections.reminders ? 'chevron-forward' : 'chevron-down'} size={22} color={colors.textMuted} />
                    </TouchableOpacity>
                    {!collapsedSections.reminders && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={[styles.horizontalGridContainer]}>
                            {tasks.filter(t => t.type === 'reminder').map((task) => (
                                <TouchableOpacity 
                                    key={task._id}
                                    style={[styles.gridTaskItem, { backgroundColor: cardBg, borderColor: colors.border }]}
                                    onPress={() => router.push({ pathname: '/note-detail', params: { id: task._id, isReminder: 'true' } })}
                                    onLongPress={() => {
                                        setSelectedItemForAction(task);
                                        setActionModalVisible(true);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <View style={[{ backgroundColor: '#FF6B6B15', width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' }]}>
                                        <Ionicons name="alarm-outline" size={22} color={colors.danger} />
                                    </View>
                                    <View style={{ flex: 1, width: '100%', marginTop: 12 }}>
                                        <Text style={[styles.taskItemText, { fontSize: 15, fontWeight: '700' }, isArabic && { textAlign: 'right' }]} numberOfLines={2}>
                                            {task.text}
                                        </Text>
                                        <Text style={[{ fontSize: 12, color: colors.textMuted, marginTop: 4, fontWeight: '500' }, isArabic && { textAlign: 'right' }]}>...</Text>
                                        {task.dueDate && (
                                           <Text style={[{ fontSize: 12, color: colors.textMuted, marginTop: 4, fontWeight: '600' }, isArabic && { textAlign: 'right' }]}>
                                               {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                           </Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                    )}
                </View>
            )}

            {tasks.filter(t => t.type === 'note').length > 0 && (
                <View style={{ marginBottom: 32 }}>
                    <TouchableOpacity 
                      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 }}
                      onPress={() => toggleSection('notes')}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[{ fontSize: 20, fontWeight: '800', color: colors.text }, isArabic && { textAlign: 'right' }]}>{isArabic ? 'الملاحظات' : 'Notes'}</Text>
                        <View style={{ backgroundColor: colors.primary + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>{tasks.filter(t => t.type === 'note').length}</Text>
                        </View>
                      </View>
                      <Ionicons name={collapsedSections.notes ? 'chevron-forward' : 'chevron-down'} size={22} color={colors.textMuted} />
                    </TouchableOpacity>
                    {!collapsedSections.notes && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={[styles.horizontalGridContainer]}>
                            {tasks.filter(t => t.type === 'note').map((task) => (
                                <TouchableOpacity 
                                    key={task._id}
                                    style={[styles.gridTaskItem, { backgroundColor: cardBg, borderColor: colors.border }]}
                                    onPress={() => router.push({ pathname: '/note-detail', params: { id: task._id, isReminder: 'false' } })}
                                    onLongPress={() => {
                                        setSelectedItemForAction(task);
                                        setActionModalVisible(true);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <View style={[{ backgroundColor: colors.primary + '15', width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' }]}>
                                        <Ionicons name="document-text-outline" size={22} color={colors.primary} />
                                    </View>
                                    <View style={{ flex: 1, width: '100%', marginTop: 12 }}>
                                        <Text style={[styles.taskItemText, { fontSize: 15, fontWeight: '700' }, isArabic && { textAlign: 'right' }]} numberOfLines={2}>
                                            {task.text}
                                        </Text>
                                        <Text style={[{ fontSize: 12, color: colors.textMuted, marginTop: 4, fontWeight: '500' }, isArabic && { textAlign: 'right' }]}>...</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                    )}
                </View>
            )}

            <View style={{ marginBottom: 40 }}>
                {/* ─── Active Tasks Section ─── */}
                <TouchableOpacity 
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 }}
                  onPress={() => toggleSection('tasks')}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[{ fontSize: 20, fontWeight: '800', color: colors.text }, isArabic && { textAlign: 'right' }]}>{t.tasks}</Text>
                    <View style={{ backgroundColor: colors.primary + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>{tasks.filter(t => t.type !== 'note' && t.type !== 'reminder' && t.status !== 'done').length}</Text>
                    </View>
                  </View>
                  <Ionicons name={collapsedSections.tasks ? 'chevron-forward' : 'chevron-down'} size={22} color={colors.textMuted} />
                </TouchableOpacity>
                {!collapsedSections.tasks && tasks.filter(t => t.type !== 'note' && t.type !== 'reminder' && t.status !== 'done').length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={[styles.horizontalGridContainer, isArabic && { flexDirection: 'column-reverse' }]}>
                                {tasks.filter(t => t.type !== 'note' && t.type !== 'reminder' && t.status !== 'done').map((task) => {
                                    const isExpanded = expandedTodoId === task._id;
                                    return (
                                        <TouchableOpacity 
                                            key={task._id}
                                            style={[styles.gridTaskItem, { backgroundColor: isExpanded ? colors.primary + '10' : cardBg, borderColor: isExpanded ? colors.primary : colors.border }]}
                                            onPress={() => setExpandedTodoId(isExpanded ? null : task._id)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <TouchableOpacity 
                                                    onPress={() => updateTodoStatus({ id: task._id, status: task.status === 'done' ? 'not_started' : 'done' })}
                                                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                                                >
                                                    <Ionicons 
                                                        name={task.status === 'done' ? "checkmark-circle" : "ellipse-outline"} 
                                                        size={26} 
                                                        color={task.status === 'done' ? colors.success : colors.border} 
                                                    />
                                                </TouchableOpacity>
                                            </View>
                                            <View style={{ flex: 1, width: '100%', marginTop: 8 }}>
                                                <Text style={[
                                                    styles.taskItemText, 
                                                    task.status === 'done' && { textDecorationLine: 'line-through', color: colors.textMuted, opacity: 0.6 },
                                                    isArabic && { textAlign: 'right' },
                                                    { fontSize: 15, fontWeight: '700' }
                                                ]} numberOfLines={2}>
                                                    {task.text}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>
                        {expandedTodoId && tasks.find(t => t._id === expandedTodoId && t.type !== 'note' && t.type !== 'reminder' && t.status !== 'done') && (
                            <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
                                <TodoCard 
                                  todo={{ ...tasks.find(t => t._id === expandedTodoId), status: tasks.find(t => t._id === expandedTodoId)?.status || 'not_started' } as any} 
                                  homeStyles={homeStyles}
                                  onSetTimer={(id) => { setSelectedTodoId(id as Id<"todos">); setTimerModalVisible(true); }} 
                                  onLinkProject={(id) => { setSelectedTodoId(id as Id<"todos">); setProjectModalVisible(true); }}
                                />
                                <TouchableOpacity 
                                  style={{ alignSelf: 'center', marginTop: -16, backgroundColor: cardBg, borderRadius: 20, padding: 6, borderWidth: 1, borderColor: colors.border, zIndex: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
                                  onPress={() => setExpandedTodoId(null)}
                                >
                                  <Ionicons name="chevron-up" size={20} color={colors.primary} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {/* ─── Add Task (between Tasks and Completed) ─── */}
                <View style={[styles.addDayTaskContainer, tasks.filter(t => t.type !== 'note' && t.type !== 'reminder' && !t.dueDate).length === 0 && { marginTop: 0 }]}>
                    <TodoInput initialDate={selectedDateTs} onFocus={scrollToBottom} />
                </View>

                {/* ─── Completed Tasks Section ─── */}
                <TouchableOpacity 
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 }}
                  onPress={() => toggleSection('completed')}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[{ fontSize: 20, fontWeight: '800', color: colors.text }, isArabic && { textAlign: 'right' }]}>{isArabic ? 'المكتملة' : 'Completed'}</Text>
                    <View style={{ backgroundColor: colors.success + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.success }}>{tasks.filter(t => t.type !== 'note' && t.type !== 'reminder' && t.status === 'done').length}</Text>
                    </View>
                  </View>
                  <Ionicons name={collapsedSections.completed ? 'chevron-forward' : 'chevron-down'} size={22} color={colors.textMuted} />
                </TouchableOpacity>
                {!collapsedSections.completed && tasks.filter(t => t.type !== 'note' && t.type !== 'reminder' && t.status === 'done').length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={[styles.horizontalGridContainer, isArabic && { flexDirection: 'column-reverse' }]}>
                                {tasks.filter(t => t.type !== 'note' && t.type !== 'reminder' && t.status === 'done').map((task) => {
                                    const isExpanded = expandedTodoId === task._id;
                                    return (
                                        <TouchableOpacity 
                                            key={task._id}
                                            style={[styles.gridTaskItem, { backgroundColor: isExpanded ? colors.primary + '10' : cardBg, borderColor: isExpanded ? colors.primary : colors.border }]}
                                            onPress={() => setExpandedTodoId(isExpanded ? null : task._id)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <TouchableOpacity 
                                                    onPress={() => updateTodoStatus({ id: task._id, status: task.status === 'done' ? 'not_started' : 'done' })}
                                                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                                                >
                                                    <Ionicons 
                                                        name={task.status === 'done' ? "checkmark-circle" : "ellipse-outline"} 
                                                        size={26} 
                                                        color={task.status === 'done' ? colors.success : colors.border} 
                                                    />
                                                </TouchableOpacity>
                                            </View>
                                            <View style={{ flex: 1, width: '100%', marginTop: 8 }}>
                                                <Text style={[
                                                    styles.taskItemText, 
                                                    task.status === 'done' && { textDecorationLine: 'line-through', color: colors.textMuted, opacity: 0.6 },
                                                    isArabic && { textAlign: 'right' },
                                                    { fontSize: 15, fontWeight: '700' }
                                                ]} numberOfLines={2}>
                                                    {task.text}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>
                        {expandedTodoId && tasks.find(t => t._id === expandedTodoId && t.type !== 'note' && t.type !== 'reminder' && t.status === 'done') && (
                            <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
                                <TodoCard 
                                  todo={{ ...tasks.find(t => t._id === expandedTodoId), status: tasks.find(t => t._id === expandedTodoId)?.status || 'not_started' } as any} 
                                  homeStyles={homeStyles}
                                  onSetTimer={(id) => { setSelectedTodoId(id as Id<"todos">); setTimerModalVisible(true); }} 
                                  onLinkProject={(id) => { setSelectedTodoId(id as Id<"todos">); setProjectModalVisible(true); }}
                                />
                                <TouchableOpacity 
                                  style={{ alignSelf: 'center', marginTop: -16, backgroundColor: cardBg, borderRadius: 20, padding: 6, borderWidth: 1, borderColor: colors.border, zIndex: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
                                  onPress={() => setExpandedTodoId(null)}
                                >
                                  <Ionicons name="chevron-up" size={20} color={colors.primary} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {/* ─── Day Bottom Summary (at very bottom) ─── */}
                {(() => {
                  const dayGoalDocs = allGoals.filter((g: any) => g.year === year && g.month === month && g.day === day);
                  const dayAchievementDocs = allAchievements.filter((a: any) => a.year === year && a.month === month && a.day === day);
                  const notDoneDayTasks = tasks.filter(t => t.status === 'not_done' || (t.status === 'not_started' && t.dueDate && new Date(t.dueDate).setHours(23,59,59,999) < Date.now()));
                  const completedDayTasks = tasks.filter(t => t.status === 'done');
                  const incompleteDayGoals = dayGoalDocs.filter((g: any) => !g.isCompleted);
                  const completedDayGoals = dayGoalDocs.filter((g: any) => g.isCompleted);
                  const completedDayAchievements = dayAchievementDocs.filter((a: any) => a.isCompleted);
                  const incompleteDayAchievements = dayAchievementDocs.filter((a: any) => !a.isCompleted);

                  const hasContent = notDoneDayTasks.length > 0 || completedDayTasks.length > 0 || incompleteDayGoals.length > 0 || completedDayGoals.length > 0 || completedDayAchievements.length > 0 || incompleteDayAchievements.length > 0;
                  if (!hasContent) return null;

                  return (
                    <View style={{ paddingHorizontal: 20, marginTop: 20, marginBottom: 20 }}>
                      <View style={{
                        backgroundColor: cardBg,
                        borderRadius: 24,
                        padding: 18,
                        shadowColor: colors.shadow,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.06,
                        shadowRadius: 12,
                        elevation: 3,
                      }}>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 10 }}>
                          {isArabic ? 'ملخص اليوم' : "Day Summary"}
                        </Text>

                        {completedDayTasks.length > 0 && (
                          <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.success, flex: 1 }}>
                              {completedDayTasks.length} {isArabic ? 'مهام مكتملة' : 'tasks completed'}
                            </Text>
                          </View>
                        )}

                        {completedDayGoals.length > 0 && (
                          <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <Ionicons name="flag" size={14} color={colors.success} />
                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.success, flex: 1 }}>
                              {completedDayGoals.length} {isArabic ? 'أهداف محققة' : 'goals achieved'}
                            </Text>
                          </View>
                        )}

                        {completedDayAchievements.length > 0 && (
                          <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <Ionicons name="trophy" size={14} color={colors.success} />
                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.success, flex: 1 }}>
                              {completedDayAchievements.length} {isArabic ? 'إنجازات محققة' : 'achievements reached'}
                            </Text>
                          </View>
                        )}

                        {notDoneDayTasks.length > 0 && (
                          <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <Ionicons name="alert-circle" size={14} color={colors.danger} />
                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.danger, flex: 1 }}>
                              {notDoneDayTasks.length} {isArabic ? 'مهام لم تنجز' : 'tasks not done'}
                            </Text>
                          </View>
                        )}

                        {incompleteDayGoals.length > 0 && (
                          <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <Ionicons name="flag-outline" size={14} color={colors.danger} />
                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.danger, flex: 1 }}>
                              {incompleteDayGoals.length} {isArabic ? 'أهداف لم تتحقق' : 'goals not met'}
                            </Text>
                          </View>
                        )}

                        {incompleteDayAchievements.length > 0 && (
                          <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <Ionicons name="trophy-outline" size={14} color={colors.danger} />
                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.danger, flex: 1 }}>
                              {incompleteDayAchievements.length} {isArabic ? 'إنجازات لم تتحقق' : 'achievements not reached'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })()}
            </View>


            <TimerModal 
                visible={isTimerModalVisible}
                onClose={() => { setTimerModalVisible(false); setSelectedTodoId(null); }}
                onSave={(ms, due, dt) => { if (selectedTodoId) setTimerMutation({ id: selectedTodoId, duration: ms, dueDate: due, date: dt }); }}
                initialDate={tasks.find(t => t._id === selectedTodoId)?.date}
            />

            <ProjectPickerModal
                visible={isProjectModalVisible}
                onClose={() => { setProjectModalVisible(false); setSelectedTodoId(null); }}
                onSelect={(selection) => { 
                  if (!selectedTodoId) return;
                  if (selection.type === 'none') {
                    linkTaskMutation({ id: selectedTodoId, categoryId: undefined, subCategoryId: undefined, projectId: undefined });
                  } else if (selection.type === 'category') {
                    linkTaskMutation({ id: selectedTodoId, categoryId: selection.categoryId, subCategoryId: undefined, projectId: undefined });
                  } else if (selection.type === 'subCategory') {
                    linkTaskMutation({ id: selectedTodoId, categoryId: selection.categoryId, subCategoryId: selection.subCategoryId, projectId: undefined });
                  } else if (selection.type === 'project') {
                    linkTaskMutation({ id: selectedTodoId, categoryId: undefined, subCategoryId: undefined, projectId: selection.projectId });
                  }
                }}
            />

            <PlannerListModal
                visible={plannerListModalVisible}
                onClose={() => setPlannerListModalVisible(false)}
                date={selectedDateTs || 0}
                listType={activePlannerListType}
                colors={colors}
                styles={styles}
                userId={userId}
                isArabic={isArabic}
                t={t}
            />

            <ActionModal 
                visible={isActionModalVisible}
                onClose={() => { setActionModalVisible(false); setSelectedItemForAction(null); }}
                title={selectedItemForAction?.text || (selectedItemForAction?.type === 'reminder' ? (isArabic ? 'تذكير' : 'Reminder') : (isArabic ? 'ملاحظة' : 'Note'))}
                isArabic={isArabic}
                options={[
                    { 
                        label: isArabic ? 'تعديل' : 'Edit', 
                        icon: 'create-outline', 
                        onPress: () => router.push({ pathname: '/note-detail', params: { id: selectedItemForAction?._id, isReminder: selectedItemForAction?.type === 'reminder' ? 'true' : 'false' } }) 
                    },
                    { 
                        label: isArabic ? 'مشاركة' : 'Share', 
                        icon: 'share-social-outline', 
                        onPress: () => Share.share({ message: `${selectedItemForAction?.text || 'Untitled'}\n\n${selectedItemForAction?.description || ''}` }) 
                    },
                    { 
                        label: isArabic ? 'حذف' : 'Delete', 
                        icon: 'trash-outline', 
                        variant: 'destructive',
                        onPress: () => {
                            if (selectedItemForAction) {
                                deleteTodoMutation({ id: selectedItemForAction._id });
                            }
                        }
                    }
                ]}
            />
        </ScrollView>
    );
  };


  return (
    <KeyboardAvoidingView
      style={[styles.container]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >

      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.bg} />
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, isArabic && { flexDirection: 'row-reverse' }]}>
            <Text style={styles.headerTitle}>{t.planner}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {(selectedMonth !== null || selectedDay !== null) && (
                <TouchableOpacity onPress={resetAll}>
                  <Ionicons name="close" size={28} color={colors.text} />
                </TouchableOpacity>
              )}
            </View>
        </View>
        
        {selectedMonth === null ? (
            renderMonthGrid()
        ) : selectedDay === null ? (
            renderDayGrid(selectedMonth)
        ) : (
            renderSpecificDayView(selectedDay, selectedMonth, currentYear)
        )}
      </SafeAreaView>

      <ScreenGuide visible={showGuide} tips={plannerTips} onDismiss={dismissGuide} isArabic={isArabic} />

    </KeyboardAvoidingView>
  );
};

export default Planner;

