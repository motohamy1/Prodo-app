import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { createHomeStyles } from "@/assets/styles/home.styles";
import { useOfflineMutation } from "@/hooks/useOfflineMutation";
import { useOfflineQuery } from "@/hooks/useOfflineQuery";
import useTheme from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/utils/i18n";
import { useDailyReminders } from "@/hooks/useDailyReminders";
import { useScreenGuide } from "@/hooks/useScreenGuide";
import { useTaskTimers } from "@/hooks/useTaskTimers";

import Header from "@/components/Header";
import DateBar from "@/components/DateBar";
import ActionModal from "@/components/ActionModal";
import ScreenGuide, { GuideTip } from "@/components/ScreenGuide";
import TaskDetailModal from "@/components/TaskDetailModal";
import TaskKanban, { KanbanColumn } from "@/components/TaskKanban";
import TimerModal from "@/components/TimerModal";
import FloatingActionButton from "@/components/FloatingActionButton";
import LivePress from "@/components/LivePress";

import {
  ScrollStack,
  ChecklistCard,
  UpcomingEventsCard,
  MonthlyOverviewCard,
  ProductivityCard,
  EventManagementModal,
  EventData,
  UpcomingEventDisplay,
} from "@/components/ScrollStack";

import { api } from "../../convex/_generated/api";
import { Id } from '../../convex/_generated/dataModel';

const startOfDay = (ts: number) => new Date(ts).setHours(0, 0, 0, 0);

const months_en = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const months_ar = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const Index = () => {
  const router = useRouter();
  const { userId, language } = useAuth();
  const { t, isArabic } = useTranslation(language);
  const { colors, isDarkMode } = useTheme();

  // Convex Queries & Mutations
  const todos = useOfflineQuery<any[]>('todos', api.todos.get, userId ? { userId } : 'skip');
  const deleteTodo = useOfflineMutation(api.todos.deleteTodo, "todos:deleteTodo");
  const updateStatus = useOfflineMutation(api.todos.updateStatus, "todos:updateStatus");
  const addTodoMutation = useOfflineMutation(api.todos.addTodo, "todos:addTodo");
  const updateTodoMutation = useOfflineMutation(api.todos.updateTodo, "todos:updateTodo");
  const setTimerMutation = useOfflineMutation(api.todos.setTimer, "todos:setTimer");

  // Yearly goals for monthly card
  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();
  const currentMonthName = isArabic ? months_ar[currentMonthIdx] : months_en[currentMonthIdx];
  const yearlyGoals = useOfflineQuery<any[]>(
    'yearlyGoals.getGoals', 
    api.yearlyGoals.getGoals, 
    userId ? { userId, year: currentYear } : 'skip'
  ) || [];

  // Local State
  const [isGlobalActionModalVisible, setGlobalActionModalVisible] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<Id<"todos"> | null>(null);
  const [editingTaskSection, setEditingTaskSection] = useState<'subtask' | undefined>(undefined);
  const [sortActive, setSortActive] = useState('');
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [isEventModalVisible, setIsEventModalVisible] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<EventData | null>(null);
  const [isFocusTimerModalVisible, setFocusTimerModalVisible] = useState(false);

  const [todayStart] = useState(() => startOfDay(Date.now()));
  const [now] = useState(() => Date.now());
  const [selectedDate, setSelectedDate] = useState(todayStart);
  const [tasksSectionY, setTasksSectionY] = useState(0);

  const scrollViewRef = useRef<ScrollView>(null);
  const homeStyles = createHomeStyles(colors, isArabic);
  const { showGuide, dismissGuide } = useScreenGuide('home');
  useTaskTimers(todos, updateStatus);
  useDailyReminders(todos, language);

  const homeTips: GuideTip[] = isArabic ? [
    { icon: 'add-circle-outline', title: 'أضف مهمة', description: 'اكتب مهمتك في الحقل بالأسفل واضغط إرسال لإضافتها.', accentColor: '#dbd4fd' },
    { icon: 'timer-outline', title: 'مؤقت ذكي', description: 'اضغط على أيقونة الساعة لتحديد مدة المهمة وموعدها.', accentColor: '#defef9' },
    { icon: 'hand-left-outline', title: 'اضغط مطولاً', description: 'اضغط مطولاً على أي مهمة لحذفها أو مشاركتها أو ربطها بمشروع.', accentColor: '#f6e5c9' },
  ] : [
    { icon: 'add-circle-outline', title: 'Add a Task', description: 'Type your task in the input field below and hit send to add it.', accentColor: '#dbd4fd' },
    { icon: 'timer-outline', title: 'Smart Timer', description: 'Tap the clock icon on any task to set a duration and due date.', accentColor: '#defef9' },
    { icon: 'hand-left-outline', title: 'Long Press', description: 'Long press any task to delete, share, or link it to a project.', accentColor: '#f6e5c9' },
  ];

  // Normalized Todos (Tasks only)
  const normalizedTodos = todos?.filter(t => t.type !== 'note' && t.type !== 'reminder').map(t => ({
    ...t,
    status: t.status || ((t as any).isCompleted ? 'done' : 'not_started')
  })) || [];

  // Upcoming Events from Todos (type === 'reminder' or timed items)
  const upcomingEvents: UpcomingEventDisplay[] = useMemo(() => {
    if (!todos) return [];
    const nowTs = Date.now();
    return todos
      .filter(t => t.type === 'reminder' || (t.dueDate && t.dueDate >= todayStart))
      .sort((a, b) => (a.date || a.dueDate || 0) - (b.date || b.dueDate || 0))
      .map(t => ({
        _id: t._id,
        title: t.text,
        date: t.date || t.dueDate || nowTs,
        startTime: t.timerStartTime || t.dueDate || t.date,
        endTime: t.dueDate,
        location: t.location,
        meetingLink: t.meetingLink,
        priority: t.priority,
      }));
  }, [todos, todayStart]);

  const isViewingToday = selectedDate === todayStart;

  // Today's Progress Stats
  const { todayDoneForProgress, todayAllForProgress } = useMemo(() => {
    const tomorrowStart = todayStart + 86400000;
    let doneCount = 0;
    let totalCount = 0;

    normalizedTodos.forEach(t => {
      const isScheduledForToday = !t.date || (t.date >= todayStart && t.date < tomorrowStart);
      if (t.status === 'done') {
        if (isScheduledForToday || (t.completedAt && t.completedAt >= todayStart && t.completedAt < tomorrowStart)) {
          doneCount++;
          totalCount++;
        }
      } else {
        totalCount++;
      }
    });

    return { todayDoneForProgress: doneCount, todayAllForProgress: totalCount };
  }, [normalizedTodos, todayStart]);

  // Monthly Overview Stats
  const { monthDoneCount, monthTotalCount, activeMonthlyGoals } = useMemo(() => {
    const monthStart = new Date(currentYear, currentMonthIdx, 1).getTime();
    const nextMonthStart = new Date(currentYear, currentMonthIdx + 1, 1).getTime();

    let done = 0;
    let total = 0;

    normalizedTodos.forEach(t => {
      const itemDate = t.completedAt || t.date || t._creationTime || 0;
      if (itemDate >= monthStart && itemDate < nextMonthStart) {
        total++;
        if (t.status === 'done') done++;
      }
    });

    const activeGoals = yearlyGoals.filter(g => !g.isCompleted).length;

    return {
      monthDoneCount: done,
      monthTotalCount: Math.max(total, done),
      activeMonthlyGoals: activeGoals,
    };
  }, [normalizedTodos, yearlyGoals, currentYear, currentMonthIdx]);

  // Productivity & Streak Stats
  const { streakCount, weeklyRatePercent } = useMemo(() => {
    // Calculate simple streak based on consecutive completed days
    const completedTimestamps = normalizedTodos
      .filter(t => t.status === 'done' && t.completedAt)
      .map(t => startOfDay(t.completedAt!));

    const uniqueDays = Array.from(new Set(completedTimestamps)).sort((a, b) => b - a);

    let streak = 0;
    let checkDay = todayStart;

    if (uniqueDays.includes(checkDay)) {
      streak++;
      checkDay -= 86400000;
    } else {
      checkDay -= 86400000;
    }

    while (uniqueDays.includes(checkDay)) {
      streak++;
      checkDay -= 86400000;
    }

    const weekStart = todayStart - 6 * 86400000;
    const weekTotal = normalizedTodos.filter(t => (t.date || t._creationTime || 0) >= weekStart).length;
    const weekDone = normalizedTodos.filter(t => t.status === 'done' && (t.completedAt || 0) >= weekStart).length;
    const rate = weekTotal === 0 ? 100 : Math.round((weekDone / weekTotal) * 100);

    return {
      streakCount: Math.max(streak, 1),
      weeklyRatePercent: Math.min(100, Math.max(0, rate)),
    };
  }, [normalizedTodos, todayStart]);

  const pScores: Record<string, number> = { 'Urgent': 3, 'High': 2, 'Medium': 1, 'Low': 0 };
  const byPriority = (a: any, b: any) => {
    if (sortActive === 'date') return (a.dueDate || 0) - (b.dueDate || 0);
    const pDiff = (pScores[b.priority || ''] ?? -1) - (pScores[a.priority || ''] ?? -1);
    if (pDiff !== 0) return pDiff;
    return (a._creationTime || 0) - (b._creationTime || 0);
  };

  // Kanban Columns & Counts
  const { kanbanColumns, dayTaskCounts, boardIsEmpty, todayChecklistTasks } = useMemo(() => {
    const dayEnd = selectedDate + 86400000;

    const anchorOf = (t: any): number => {
      if (t.status === 'done') {
        if (t.completedAt) return startOfDay(t.completedAt);
        if (t.date !== undefined) return startOfDay(t.date);
        return todayStart;
      }
      if (t.date !== undefined) return startOfDay(t.date);
      return todayStart;
    };

    const counts = new Map<number, number>();
    normalizedTodos.forEach(t => {
      const a = anchorOf(t);
      counts.set(a, (counts.get(a) || 0) + 1);
    });

    const dayTasks = normalizedTodos.filter(t => anchorOf(t) === selectedDate);
    const carryOverdue = isViewingToday
      ? normalizedTodos.filter(t => {
          const a = anchorOf(t);
          return a < todayStart && t.status !== 'done' && t.status !== 'not_done' && t.dueDate && t.dueDate < todayStart;
        })
      : [];

    const todoCol = dayTasks.filter(t => t.status === 'not_started' || t.status === 'paused').sort(byPriority);
    const inProgressCol = dayTasks.filter(t => t.status === 'in_progress').sort(byPriority);
    const doneCol = dayTasks.filter(t => t.status === 'done').sort(byPriority);
    const notDoneCol = [
      ...dayTasks.filter(t => t.status === 'not_done'),
      ...dayTasks.filter(t => (t.status === 'not_started' || t.status === 'paused') && t.dueDate && t.dueDate < dayEnd),
      ...carryOverdue,
    ].sort(byPriority);

    const columns: KanbanColumn[] = [
      { key: 'todo', title: t.toDoColumn, color: colors.primary, tasks: todoCol },
      { key: 'in_progress', title: t.inProgressColumn, color: colors.warning, tasks: inProgressCol },
      { key: 'done', title: t.doneColumn, color: colors.success, tasks: doneCol },
      { key: 'not_done', title: t.notDoneColumn, color: colors.danger, tasks: notDoneCol },
    ];

    const empty = todoCol.length + inProgressCol.length + doneCol.length + notDoneCol.length === 0;

    // Daily checklist tasks for Card 1 (prioritize active, then done)
    const checklistTasks = [...inProgressCol, ...todoCol, ...doneCol].map(task => ({
      _id: task._id,
      text: task.text,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
    }));

    return { 
      kanbanColumns: columns, 
      dayTaskCounts: counts, 
      boardIsEmpty: empty, 
      todayChecklistTasks: checklistTasks 
    };
  }, [normalizedTodos, selectedDate, sortActive, todayStart, isViewingToday, colors, t]);

  const activeBoardTasks = useMemo(
    () => kanbanColumns.filter(c => c.key !== 'done').flatMap(c => c.tasks),
    [kanbanColumns]
  );

  const handleEditTask = (id: Id<"todos">, section?: 'subtask') => {
    setEditingTaskId(id);
    setEditingTaskSection(section);
  };

  // Toggle task status from Checklist Card
  const handleToggleTaskStatus = (id: Id<"todos">, currentStatus: string) => {
    const nextStatus = currentStatus === 'done' ? 'not_started' : 'done';
    updateStatus({ id, status: nextStatus });
  };

  // Smooth scroll down to the relocated Tasks section
  const handleScrollToTasksSection = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (tasksSectionY > 0) {
      scrollViewRef.current?.scrollTo({ y: tasksSectionY - 10, animated: true });
    } else {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  };

  // Event Management Handlers
  const handleOpenEventModal = (evt?: UpcomingEventDisplay) => {
    if (evt) {
      setEventToEdit({
        _id: evt._id,
        title: evt.title,
        date: evt.date,
        startTime: evt.startTime,
        endTime: evt.endTime,
        location: evt.location,
        meetingLink: evt.meetingLink,
        priority: evt.priority,
      });
    } else {
      setEventToEdit(null);
    }
    setIsEventModalVisible(true);
  };

  const handleSaveEvent = async (evt: EventData) => {
    if (evt._id) {
      await updateTodoMutation({
        id: evt._id,
        text: evt.title,
        date: evt.date,
        dueDate: evt.startTime,
        location: evt.location,
        meetingLink: evt.meetingLink,
        priority: evt.priority,
      });
    } else {
      if (!userId) return;
      await addTodoMutation({
        userId,
        text: evt.title,
        type: 'reminder',
        date: evt.date,
        dueDate: evt.startTime,
        location: evt.location,
        meetingLink: evt.meetingLink,
        priority: evt.priority,
        status: 'not_started',
      });
    }
  };

  const handleDeleteEvent = async (id: Id<"todos">) => {
    await deleteTodo({ id });
  };

  const handleStartFocusTimer = () => {
    setFocusTimerModalVisible(true);
  };

  const handleSaveFocusTimer = (durationInMs: number, dueDate?: number, date?: number) => {
    // Find top active task or set generic focus timer
    const topTask = activeBoardTasks[0];
    if (topTask) {
      setTimerMutation({
        id: topTask._id,
        timerDuration: durationInMs,
        timerStartTime: Date.now(),
        dueDate,
        date,
      });
      updateStatus({ id: topTask._id, status: 'in_progress' });
    }
  };

  const selectedDayLabel = new Date(selectedDate).toLocaleDateString(
    isArabic ? 'ar-SA' : 'en-US',
    { weekday: 'long', month: 'short', day: 'numeric' }
  );

  return (
    <KeyboardAvoidingView 
      style={homeStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.bg} />
      <SafeAreaView style={homeStyles.safeArea} edges={['top']}>
        <Header />
        
        {todos === undefined ? (
          <View style={homeStyles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.secondary} />
          </View>
        ) : (
          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={homeStyles.scrollContent} 
            showsVerticalScrollIndicator={false} 
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            scrollEventThrottle={16}
          >
            {/* 1. Dynamic Date Bar */}
            <DateBar
              selectedDate={selectedDate}
              todayStart={todayStart}
              onSelectDate={setSelectedDate}
              homeStyles={homeStyles}
              isArabic={isArabic}
              taskCounts={dayTaskCounts}
            />

            {/* 2. Hero Section: Scroll Stack Component */}
            <ScrollStack isArabic={isArabic}>
              {/* Card 1: Today's Checklist */}
              <ChecklistCard
                tasks={todayChecklistTasks}
                doneCount={todayDoneForProgress}
                totalCount={todayAllForProgress}
                onToggleTask={handleToggleTaskStatus}
                onOpenTaskDetail={(id) => handleEditTask(id)}
                onQuickManage={() => setGlobalActionModalVisible(true)}
                onScrollToTasksSection={handleScrollToTasksSection}
                onAddNewTask={() => setIsTaskModalVisible(true)}
              />

              {/* Card 2: Upcoming Events */}
              <UpcomingEventsCard
                events={upcomingEvents}
                onOpenEventModal={handleOpenEventModal}
              />

              {/* Card 3: Monthly Overview */}
              <MonthlyOverviewCard
                monthName={currentMonthName}
                year={currentYear}
                completedTasks={monthDoneCount}
                totalTasks={monthTotalCount}
                activeGoalsCount={activeMonthlyGoals}
                onPress={() => router.push('/(tabs)/planner')}
              />

              {/* Card 4: Productivity & Focus Tracker */}
              <ProductivityCard
                streakDays={streakCount}
                weeklyRate={weeklyRatePercent}
                onStartFocus={handleStartFocusTimer}
              />
            </ScrollStack>

            {/* 3. Relocated Tasks Section (Kanban Board) */}
            <View 
              onLayout={(e) => {
                setTasksSectionY(e.nativeEvent.layout.y);
              }}
            >
              {/* Board Header */}
              <View style={[homeStyles.sectionTitleContainer, isArabic && { flexDirection: 'row-reverse' }]}>
                <Text style={homeStyles.sectionTitleText}>
                  {isViewingToday ? t.tasksForToday : selectedDayLabel}
                </Text>
                <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 25 }}>
                  <FloatingActionButton 
                    onPress={() => setIsTaskModalVisible(true)} 
                    style={homeStyles.fab}
                  />
                  <LivePress onPress={() => setGlobalActionModalVisible(true)}>
                    <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
                  </LivePress>
                </View>
              </View>

              {boardIsEmpty ? (
                <View style={homeStyles.emptyContainer}>
                  <Ionicons name="clipboard-outline" size={42} color={colors.secondary} />
                  <Text style={homeStyles.emptyTitle}>
                    {isViewingToday ? (isArabic ? 'لا توجد مهام اليوم' : 'Nothing scheduled for today') : t.noTasksDay}
                  </Text>
                  <Text style={homeStyles.emptyText}>
                    {isArabic ? 'أضف مهمتك الأولى للبدء وستظهر هنا.' : 'Add your first task to get started. Use the button below.'}
                  </Text>
                  <TouchableOpacity 
                    style={homeStyles.emptyAction} 
                    onPress={() => setIsTaskModalVisible(true)} 
                    activeOpacity={0.9}
                  >
                    <Text style={homeStyles.emptyActionText}>{isArabic ? 'إضافة مهمة' : 'Add a task'}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TaskKanban
                  columns={kanbanColumns}
                  homeStyles={homeStyles}
                  isArabic={isArabic}
                  now={now}
                  onOpenDetail={handleEditTask}
                />
              )}
            </View>

          </ScrollView>
        )}

        {/* Task Modals */}
        <TaskDetailModal 
          visible={isTaskModalVisible}
          onClose={() => setIsTaskModalVisible(false)}
          todoId={null}
          initialDate={selectedDate}
        />
        <TaskDetailModal 
          visible={editingTaskId !== null}
          onClose={() => { setEditingTaskId(null); setEditingTaskSection(undefined); }}
          todoId={editingTaskId}
          initialSection={editingTaskSection}
        />

        {/* Event Management Modal */}
        <EventManagementModal
          visible={isEventModalVisible}
          onClose={() => setIsEventModalVisible(false)}
          initialDate={selectedDate}
          eventToEdit={eventToEdit}
          onSaveEvent={handleSaveEvent}
          onDeleteEvent={handleDeleteEvent}
        />

        {/* Focus Timer Modal */}
        <TimerModal
          visible={isFocusTimerModalVisible}
          onClose={() => setFocusTimerModalVisible(false)}
          onSave={handleSaveFocusTimer}
          initialDate={selectedDate}
        />
      </SafeAreaView>

      {/* Global Action Modal */}
      <ActionModal 
        visible={isGlobalActionModalVisible}
        onClose={() => setGlobalActionModalVisible(false)}
        title={isArabic ? 'خيارات القائمة' : 'List Options'}
        isArabic={isArabic}
        options={[
          {
            label: t.sortByPriority,
            icon: 'star-outline',
            onPress: () => setSortActive('priority')
          },
          {
            label: t.sortByDueDate,
            icon: 'calendar-outline',
            onPress: () => setSortActive('date')
          },
          {
            label: t.markAllDone,
            icon: 'checkmark-done-outline',
            onPress: () => {
              activeBoardTasks.forEach(t => updateStatus({ id: t._id, status: 'done' }));
            }
          },
          {
            label: t.clearCompleted,
            icon: 'trash-outline',
            variant: 'destructive',
            onPress: () => {
              const completedTasks = kanbanColumns.find(c => c.key === 'done')?.tasks || [];
              if (completedTasks.length === 0) {
                return;
              }
              
              Alert.alert(
                isArabic ? 'مسح المهام المكتملة' : 'Clear Completed Tasks',
                isArabic 
                  ? `هل أنت متأكد من حذف ${completedTasks.length} مهمة مكتملة؟ لا يمكن التراجع عن هذا الإجراء.` 
                  : `Are you sure you want to delete ${completedTasks.length} completed task${completedTasks.length === 1 ? '' : 's'}? This action cannot be undone.`,
                [
                  {
                    text: isArabic ? 'إلغاء' : 'Cancel',
                    style: 'cancel'
                  },
                  {
                    text: isArabic ? 'حذف' : 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      completedTasks.forEach(t => deleteTodo({ id: t._id }));
                    }
                  }
                ]
              );
            }
          }
        ]}
      />

      <ScreenGuide visible={showGuide} tips={homeTips} onDismiss={dismissGuide} isArabic={isArabic} />
    </KeyboardAvoidingView>
  );
};

export default Index;
