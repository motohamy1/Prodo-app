import { createHomeStyles } from "@/assets/styles/home.styles";
import { useOfflineMutation } from "@/hooks/useOfflineMutation";
import { useOfflineQuery } from "@/hooks/useOfflineQuery";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

import ActionModal from "@/components/ActionModal";
import CircularProgress from "@/components/CircularProgress";
import FloatingActionButton from "@/components/FloatingActionButton";
import Header from "@/components/Header";
import LivePress from "@/components/LivePress";
import ProjectPickerModal from "@/components/ProjectPickerModal";
import type { GuideTip } from "@/components/ScreenGuide";
import ScreenGuide from "@/components/ScreenGuide";
import TaskDetailModal from "@/components/TaskDetailModal";
import TimerModal from "@/components/TimerModal";
import TodoCard from "@/components/TodoCard";
import { useAuth } from "@/hooks/useAuth";
import { useDailyReminders } from "@/hooks/useDailyReminders";
import { useScreenGuide } from "@/hooks/useScreenGuide";
import { useTaskTimers } from "@/hooks/useTaskTimers";
import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from "../../convex/_generated/api";
import { Id } from '../../convex/_generated/dataModel';

import { useTranslation } from "@/utils/i18n";

const Index = () => {
    const { userId, language } = useAuth();
    const { t, isArabic } = useTranslation(language);
    const todos = useOfflineQuery<any[]>('todos', api.todos.get, userId ? { userId } : 'skip');
    const deleteTodo = useOfflineMutation(api.todos.deleteTodo, "todos:deleteTodo");
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();

    // Keep old mutations for backward compatibility during transition
    const setTimerMutation = useOfflineMutation(api.todos.setTimer, "todos:setTimer");
    const linkProject = useOfflineMutation(api.todos.linkProject, "todos:linkProject");
    const linkTask = useOfflineMutation(api.todos.linkTask, "todos:linkTask");
    const updateStatus = useOfflineMutation(api.todos.updateStatus, "todos:updateStatus");

    const [isTimerModalVisible, setTimerModalVisible] = useState(false);
    const [isProjectModalVisible, setProjectModalVisible] = useState(false);
    const [selectedTodoId, setSelectedTodoId] = useState<Id<"todos"> | null>(null);
    const [activeFilter, setActiveFilter] = useState<'All' | 'In Progress' | 'Done' | 'Not Done'>('All');
    
    const [isGlobalActionModalVisible, setGlobalActionModalVisible] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<Id<"todos"> | null>(null);
    const [editingTaskSection, setEditingTaskSection] = useState<'subtask' | undefined>(undefined);
    const [showOverdue, setShowOverdue] = useState(true);
    const [sortActive, setSortActive] = useState('');
    const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);

    const scrollViewRef = useRef<ScrollView>(null);
    const homeStyles = createHomeStyles(colors, isArabic);
    const { showGuide, dismissGuide } = useScreenGuide('home');
    useTaskTimers(todos, updateStatus);
    useDailyReminders(todos, language);

    const homeTips: GuideTip[] = isArabic ? [
      { icon: 'add-circle-outline', title: 'أضف مهمة', description: 'اكتب مهمتك في الحقل بالأسفل واضغط إرسال لإضافتها.', accentColor: '#F2B544' },
      { icon: 'timer-outline', title: 'مؤقت ذكي', description: 'اضغط على أيقونة الساعة لتحديد مدة المهمة وموعدها.', accentColor: '#4EE6C1' },
      { icon: 'hand-left-outline', title: 'اضغط مطولاً', description: 'اضغط مطولاً على أي مهمة لحذفها أو مشاركتها أو ربطها بمشروع.', accentColor: '#A89CFF' },
    ] : [
      { icon: 'add-circle-outline', title: 'Add a Task', description: 'Type your task in the input field below and hit send to add it.', accentColor: '#F2B544' },
      { icon: 'timer-outline', title: 'Smart Timer', description: 'Tap the clock icon on any task to set a duration and due date.', accentColor: '#4EE6C1' },
      { icon: 'hand-left-outline', title: 'Long Press', description: 'Long press any task to delete, share, or link it to a project.', accentColor: '#A89CFF' },
    ];



    const normalizedTodos = todos?.filter(t => t.type !== 'note' && t.type !== 'reminder').map(t => ({

      ...t,
      status: t.status || ((t as any).isCompleted ? 'done' : 'not_started')
    })) || [];

    const { todayTodos, todayNotDone, overdueTodos, overdueByDay, groupedDoneTodos, todayDoneForProgress, todayAllForProgress } = useMemo(() => {
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const tomorrowStart = todayStart + 86400000;
      
      const today: any[] = [];
      const todayNotDoneList: any[] = [];
      const overdue: any[] = [];

      const groupedDoneDayMap = new Map<number, any[]>();

      // Track ALL today-scoped tasks for progress (including done ones)
      let todayDoneCount = 0;
      let todayTotalCount = 0;

      normalizedTodos.forEach(t => {
        const isScheduledForToday = !t.date || (t.date >= todayStart && t.date < tomorrowStart);

        if (t.status === 'done') {
          const completionDay = t.completedAt 
            ? new Date(t.completedAt).setHours(0, 0, 0, 0)
            : (t.date ? new Date(t.date).setHours(0, 0, 0, 0) : todayStart);
          if (!groupedDoneDayMap.has(completionDay)) groupedDoneDayMap.set(completionDay, []);
          groupedDoneDayMap.get(completionDay)!.push(t);
          // Count done tasks that belong to today for progress tracking
          if (isScheduledForToday || (t.completedAt && t.completedAt >= todayStart && t.completedAt < tomorrowStart)) {
            todayDoneCount++;
            todayTotalCount++;
          }
        } else if (t.status === 'not_done') {
          // Separate not_done tasks into their own list
          todayNotDoneList.push(t);
          todayTotalCount++;
        } else {
          if (isScheduledForToday) {
            today.push(t);
            todayTotalCount++;
          } else if (t.date !== undefined && t.date < todayStart && t.dueDate) {
            overdue.push(t);
          } else {
            today.push(t);
            todayTotalCount++;
          }
        }
      });

      const groupedDoneTodos = Array.from(groupedDoneDayMap.entries())
        .sort(([a], [b]) => b - a)
        .map(([dayTimestamp, tasks]) => ({ dayTimestamp, tasks }));
      
      // Default sort: priority descending, then creation time ascending (oldest first)
      const pScores: any = { 'Urgent': 3, 'High': 2, 'Medium': 1, 'Low': 0, undefined: -1 };
      if (sortActive === 'date') {
        today.sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));
      } else {
        // Always sort by priority first, then by creation time (oldest first)
        today.sort((a, b) => {
          const pDiff = (pScores[b.priority] ?? -1) - (pScores[a.priority] ?? -1);
          if (pDiff !== 0) return pDiff;
          return (a._creationTime || 0) - (b._creationTime || 0); // oldest first
        });
      }

      // Sort not_done the same way
      todayNotDoneList.sort((a, b) => {
        const pDiff = (pScores[b.priority] ?? -1) - (pScores[a.priority] ?? -1);
        if (pDiff !== 0) return pDiff;
        return (a._creationTime || 0) - (b._creationTime || 0);
      });

      // Sort overdue by date descending (latest first)
      overdue.sort((a, b) => (b.date || 0) - (a.date || 0));

      // Group overdue tasks by day (descending from latest to oldest)
      const dayMap = new Map<number, any[]>();
      overdue.forEach(t => {
        const dayStart = new Date(t.date).setHours(0, 0, 0, 0);
        if (!dayMap.has(dayStart)) dayMap.set(dayStart, []);
        dayMap.get(dayStart)!.push(t);
      });
      const grouped = Array.from(dayMap.entries())
        .sort(([a], [b]) => b - a)
        .map(([dayTimestamp, tasks]) => ({ dayTimestamp, tasks }));

      return { 
        todayTodos: today, 
        todayNotDone: todayNotDoneList, 
        overdueTodos: overdue, 
        overdueByDay: grouped, 
        groupedDoneTodos,
        todayDoneForProgress: todayDoneCount,
        todayAllForProgress: todayTotalCount
      };
    }, [normalizedTodos, sortActive]);
    const inProgressCount = todayTodos.filter(t => t.status === 'in_progress').length;
    const totalCount = todayTodos.filter(t => t.status !== 'done' && t.status !== 'not_done').length;
    
    const totalDoneCount = groupedDoneTodos.reduce((sum, group) => sum + group.tasks.length, 0);

    // Progress uses ALL today-scoped tasks (done + active + not_done) so adding new tasks
    // doesn't reset the percentage — it properly recalculates with the full picture
    const progressPercent = todayAllForProgress === 0 ? 0 : Math.round((todayDoneForProgress / todayAllForProgress) * 100);

    const handleOpenTimerModal = (id: Id<"todos">) => {
      setSelectedTodoId(id);
      setTimerModalVisible(true);
    };

    const handleSaveTimer = (durationInMs: number, dueDate?: number, date?: number) => {
      if (selectedTodoId) {
        setTimerMutation({ id: selectedTodoId, duration: durationInMs, dueDate, date });
      }
    };

    const handleOpenProjectModal = (id: Id<"todos">) => {
      setSelectedTodoId(id);
      setProjectModalVisible(true);
    };

    const handleEditTask = (id: Id<"todos">, section?: 'subtask') => {
      setEditingTaskId(id);
      setEditingTaskSection(section);
    };

    const handleSelectProject = (selection: { type: string; categoryId?: string; subCategoryId?: string; projectId?: string }) => {
      if (!selectedTodoId) return;
      if (selection.type === 'none') {
        linkTask({ id: selectedTodoId, categoryId: undefined, subCategoryId: undefined, projectId: undefined });
      } else if (selection.type === 'category') {
        linkTask({ id: selectedTodoId, categoryId: selection.categoryId as any, subCategoryId: undefined, projectId: undefined });
      } else if (selection.type === 'subCategory') {
        linkTask({ id: selectedTodoId, categoryId: selection.categoryId as any, subCategoryId: selection.subCategoryId as any, projectId: undefined });
      } else if (selection.type === 'project') {
        linkTask({ id: selectedTodoId, categoryId: undefined, subCategoryId: undefined, projectId: selection.projectId });
      }
    };

    const displayedTodos = useMemo(() => {
        if (activeFilter === 'All') return todayTodos.filter(t => t.status !== 'done' && t.status !== 'not_done');
        if (activeFilter === 'In Progress') return todayTodos.filter(t => t.status === 'in_progress');
        if (activeFilter === 'Done' || activeFilter === 'Not Done') return [];
        return todayTodos;
    }, [todayTodos, activeFilter]);

    const displayedOverdue = useMemo(() => {
        if (activeFilter !== 'Not Done') return [];
        return overdueTodos;
    }, [overdueTodos, activeFilter]);

    return (
        <KeyboardAvoidingView 
            style={homeStyles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.bg} />
            <SafeAreaView style={homeStyles.safeArea} edges={['top']}>
                <Header />
                {todos === undefined ? (
                   <View style={homeStyles.loadingContainer}>
                     <ActivityIndicator size="large" color={colors.primary} />
                   </View>
                ) : (
                   <ScrollView 
                     ref={scrollViewRef}
                     contentContainerStyle={homeStyles.scrollContent} 
                     showsVerticalScrollIndicator={false} 
                     keyboardShouldPersistTaps="handled"
                   >

                      
                      {/* Today's Plan Card */}
                       <Animated.View
                         entering={FadeInDown.duration(400).easing(Easing.out(Easing.cubic))}
                         style={{ marginHorizontal: 16, marginBottom: 24, ...colors.shadows.glow, borderRadius: 24 }}
                       >
                         <LinearGradient
                           colors={isDarkMode ? ['#818CF8', '#6366F1', '#4F46E5'] : ['#F97316', '#E15A3E', '#C2410C']}
                           start={{ x: 0, y: 0 }}
                           end={{ x: 1, y: 1 }}
                           style={[homeStyles.todaysPlanCard, { marginHorizontal: 0, marginBottom: 0, flexDirection: isArabic ? 'row-reverse' : 'row' }]}
                         >
                           <View style={isArabic && { alignItems: 'flex-end' }}>
                               <Text style={homeStyles.todaysPlanTitle}>{t.todaysPlan}</Text>
                               <Text style={homeStyles.todaysPlanSubtitle}>{todayDoneForProgress}/{todayAllForProgress} {t.tasksCompleted}</Text>
                           </View>
                            <CircularProgress
                                size={64}
                                strokeWidth={6}
                                progress={progressPercent}
                                color={colors.primaryText}
                                unfilledColor={colors.primaryText + '30'}
                            >
                                <Text style={{ fontSize: 16, fontWeight: "800", color: colors.primaryText }}>{progressPercent}%</Text>
                            </CircularProgress>
                         </LinearGradient>
                       </Animated.View>

                      {/* Filter Pills */}
                      <View style={[homeStyles.pillsContainer, isArabic && { flexDirection: 'row-reverse' }]}>
                          {(['All', 'In Progress', 'Done', 'Not Done'] as const).map(filter => {
                              const isActive = activeFilter === filter;
                              let count = 0;
                              if (filter === 'All') count = totalCount;
                              if (filter === 'In Progress') count = inProgressCount;
                              if (filter === 'Done') count = totalDoneCount;
                              if (filter === 'Not Done') count = todayNotDone.length + overdueTodos.length;

                              const filterLabel = filter === 'All' ? (isArabic ? 'المهام' : 'To-Do') : 
                                                filter === 'In Progress' ? t.inProgress : 
                                                filter === 'Done' ? t.done : 
                                                (isArabic ? 'لم تُنجز' : 'Not Done');

                              return (
                                  <LivePress 
                                      key={filter} 
                                      style={[homeStyles.pill, isActive ? homeStyles.pillActive : homeStyles.pillInactive]}
                                      onPress={() => setActiveFilter(filter)}
                                  >
                                      <Text style={[homeStyles.pillText, { color: isActive ? colors.primary : colors.textMuted }]}>
                                          {filterLabel}
                                      </Text>
                                      <Text style={[homeStyles.pillSubText, { color: isActive ? colors.primary + 'CC' : colors.textMuted }]}>
                                          {count} {count === 1 ? t.task : t.tasks}
                                      </Text>
                                  </LivePress>
                              );
                          })}
                      </View>

                       {/* Today's Tasks List */}
                       {activeFilter !== 'Done' && activeFilter !== 'Not Done' && (
                         <View style={[homeStyles.sectionTitleContainer, isArabic && { flexDirection: 'row-reverse' }]}>
                             <Text style={homeStyles.sectionTitleText}>{t.tasksForToday}</Text>
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
                       )}

                        {activeFilter === 'All' && displayedTodos.length === 0 && (
                          <View style={homeStyles.emptyContainer}>
                             <Ionicons name="clipboard-outline" size={42} color={colors.primary} />
                             <Text style={homeStyles.emptyTitle}>{isArabic ? 'لا توجد مهام اليوم' : 'Nothing scheduled for today'}</Text>
                             <Text style={homeStyles.emptyText}>{isArabic ? 'أضف مهمتك الأولى للبدء وستظهر هنا.' : 'Add your first task to get started. Use the button below.'}</Text>
                             <TouchableOpacity style={homeStyles.emptyAction} onPress={() => setIsTaskModalVisible(true)} activeOpacity={0.9}>
                               <Text style={homeStyles.emptyActionText}>{isArabic ? 'إضافة مهمة' : 'Add a task'}</Text>
                             </TouchableOpacity>
                          </View>
                        )}

                       {activeFilter === 'In Progress' && displayedTodos.length === 0 && (
                         <View style={homeStyles.emptyContainer}>
                            <Ionicons name="play-circle-outline" size={42} color={colors.primary} />
                            <Text style={homeStyles.emptyTitle}>{isArabic ? 'لا توجد مهام قيد التنفيذ' : 'No tasks in progress'}</Text>
                            <Text style={homeStyles.emptyText}>{isArabic ? 'ابدأ أي مهمة من تبويب المهام لتظهر هنا.' : 'Start a task from the To-do list to see it here.'}</Text>
                         </View>
                       )}

                       {activeFilter === 'Done' && totalDoneCount === 0 && (
                         <View style={homeStyles.emptyContainer}>
                            <Ionicons name="checkmark-done-circle-outline" size={42} color={colors.success} />
                            <Text style={homeStyles.emptyTitle}>{isArabic ? 'لا توجد مهام مكتملة بعد' : 'No completed tasks yet'}</Text>
                            <Text style={homeStyles.emptyText}>{isArabic ? 'أكمل مهامك وستظهر هنا.' : 'Complete tasks and they will appear here grouped by day.'}</Text>
                         </View>
                       )}

                       {activeFilter === 'Not Done' && todayNotDone.length === 0 && overdueTodos.length === 0 && (
                         <View style={homeStyles.emptyContainer}>
                            <Ionicons name="shield-checkmark-outline" size={42} color={colors.success} />
                            <Text style={homeStyles.emptyTitle}>{isArabic ? 'كل شيء تحت السيطرة' : 'All clear'}</Text>
                            <Text style={homeStyles.emptyText}>{isArabic ? 'لا توجد مهام متأخرة. أحسنت!' : 'No overdue tasks. Nice work keeping up.'}</Text>
                         </View>
                       )}

                       {activeFilter !== 'Done' && activeFilter !== 'Not Done' && displayedTodos.filter(t => t.status !== 'done').map(todo => (
                           <TodoCard 
                               key={todo._id} 
                               todo={todo} 
                               onSetTimer={handleOpenTimerModal}
                               onLinkProject={handleOpenProjectModal}
                               homeStyles={homeStyles}
                                isTimelineMode={true}
                                onOpenDetail={handleEditTask}
                            />
                       ))}

                       {/* Not Done Tasks (today) - separate section */}
                       {activeFilter === 'Not Done' && todayNotDone.length > 0 && (
                            <View style={{ marginTop: 24 }}>
                                <View style={[homeStyles.sectionTitleContainer, isArabic && { flexDirection: 'row-reverse' }]}>
                                    <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={[homeStyles.sectionTitleText, { color: colors.danger }]}>{isArabic ? 'اليوم' : 'Today'}</Text>
                                        <View style={{ backgroundColor: colors.danger + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                                            <Text style={{ fontSize: 12, fontWeight: '800', color: colors.danger }}>{todayNotDone.length}</Text>
                                        </View>
                                    </View>
                                </View>
                                {todayNotDone.map(todo => (
                                    <TodoCard 
                                        key={todo._id} 
                                        todo={todo} 
                                        onSetTimer={handleOpenTimerModal}
                                        onLinkProject={handleOpenProjectModal}
                                        homeStyles={homeStyles}
                                        isTimelineMode={true}
                                        onOpenDetail={handleEditTask}
                                    />
                                ))}
                            </View>
                        )}


                       {activeFilter === 'Done' && groupedDoneTodos.map(({ dayTimestamp, tasks }) => {
                         const dayLabel = new Date(dayTimestamp).toLocaleDateString(
                           isArabic ? 'ar-SA' : 'en-US',
                           { weekday: 'long', month: 'short', day: 'numeric' }
                         );
                         return (
                           <View key={dayTimestamp} style={{ marginTop: 16 }}>
                               <View style={homeStyles.sectionTitleContainer}>
                                   <Text style={[homeStyles.sectionTitleText, { fontSize: 14, color: colors.textMuted }]}>{dayLabel}</Text>
                               </View>
                               <FlatList
                                 horizontal
                                 showsHorizontalScrollIndicator={false}
                                 data={tasks}
                                 keyExtractor={(item) => item._id}
                                 contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
                                 renderItem={({ item }) => (
                                   <View style={{ width: 320 }}>
                                     <TodoCard 
                                         todo={item} 
                                         onSetTimer={handleOpenTimerModal}
                                         onLinkProject={handleOpenProjectModal}
                                         homeStyles={homeStyles}
                                          isTimelineMode={false}
                                          onOpenDetail={handleEditTask}
                                      />
                                   </View>
                                 )}
                               />
                           </View>
                         );
                       })}
                       

                       {/* Not Done Tasks (Overdue) */}
                       {displayedOverdue.length > 0 && (
                         <View style={{ marginBottom: 16 }}>
                           <TouchableOpacity 
                             style={[homeStyles.sectionTitleContainer, isArabic && { flexDirection: 'row-reverse' }, { marginBottom: 8 }]}
                             onPress={() => setShowOverdue(!showOverdue)}
                           >
                             <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                               <Text style={[homeStyles.sectionTitleText, { color: colors.danger }]}>{isArabic ? 'سابقاً' : 'Previous'}</Text>
                               <View style={{ backgroundColor: colors.danger + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                                 <Text style={{ fontSize: 12, fontWeight: '800', color: colors.danger }}>{displayedOverdue.length}</Text>
                               </View>
                             </View>
                             <Ionicons 
                               name={showOverdue ? 'chevron-down' : (isArabic ? 'chevron-back' : 'chevron-forward')} 
                               size={20} 
                               color={colors.textMuted} 
                             />
                           </TouchableOpacity>
                           
                           {showOverdue && overdueByDay.map(({ dayTimestamp, tasks: dayTasks }) => {
                              const filteredDayTasks = activeFilter === 'Done' ? dayTasks.filter(t => t.status === 'done')
                                : activeFilter === 'In Progress' ? dayTasks.filter(t => t.status === 'in_progress')
                                : activeFilter === 'All' ? dayTasks.filter(t => t.status !== 'done' && t.status !== 'not_done')
                                : dayTasks;
                             if (filteredDayTasks.length === 0) return null;

                             const dayLabel = new Date(dayTimestamp).toLocaleDateString(
                               isArabic ? 'ar-SA' : 'en-US',
                               { weekday: 'short', month: 'short', day: 'numeric' }
                             );

                             return (
                               <View key={dayTimestamp} style={{ marginBottom: 12 }}>
                                 <View style={[{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginBottom: 8, paddingHorizontal: 24 }]}>
                                   <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                                   <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{dayLabel}</Text>
                                 </View>
                                 {filteredDayTasks.map(todo => (
                                     <TodoCard 
                                         key={todo._id} 
                                         todo={todo} 
                                         onSetTimer={handleOpenTimerModal}
                                         onLinkProject={handleOpenProjectModal}
                                         homeStyles={homeStyles}
                                          isTimelineMode={true}
                                          onOpenDetail={handleEditTask}
                                      />
                                 ))}
                               </View>
                             );
                           })}
                         </View>
                       )}

                   </ScrollView>
                )}

                <TaskDetailModal 
                    visible={isTaskModalVisible}
                    onClose={() => setIsTaskModalVisible(false)}
                    todoId={null}
                    initialDate={Date.now()}
                />
                <TaskDetailModal 
                    visible={editingTaskId !== null}
                    onClose={() => { setEditingTaskId(null); setEditingTaskSection(undefined); }}
                    todoId={editingTaskId}
                    initialSection={editingTaskSection}
                />
            </SafeAreaView>

            <TimerModal 
              visible={isTimerModalVisible}
              onClose={() => {
                setTimerModalVisible(false);
                setSelectedTodoId(null);
              }}
              onSave={handleSaveTimer}
              initialDate={todos?.find(t => t._id === selectedTodoId)?.date}
            />

            <ProjectPickerModal
              visible={isProjectModalVisible}
              onClose={() => {
                setProjectModalVisible(false);
                setSelectedTodoId(null);
              }}
              onSelect={handleSelectProject}
            />

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
                    displayedTodos.forEach(t => updateStatus({ id: t._id, status: 'done' }));
                  }
                },
                {
                  label: t.clearCompleted,
                  icon: 'trash-outline',
                  variant: 'destructive',
                  onPress: () => {
                    const completedTasks = todayTodos.filter(t => t.status === 'done');
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
