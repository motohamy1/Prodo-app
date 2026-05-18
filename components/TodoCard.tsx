import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import useTheme, { getNeoShadow } from '@/hooks/useTheme';
import { useTranslation } from '@/utils/i18n';
import { showTaskCompletedNotification } from '@/utils/notifications';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, LayoutAnimation, Share, Text, TouchableOpacity, View } from 'react-native';
import ActionModal from './ActionModal';
import CircularProgress from './CircularProgress';
import { SubtaskRow } from './SubtaskRow';
import TaskDetailModal from './TaskDetailModal';

interface TodoCardProps {
  todo: {
    _id: Id<"todos">;
    _creationTime?: number;
    text: string;
    status: string;
    timerDuration?: number;
    timerDirection?: string;
    timerStartTime?: number;
    timerFirstStartTime?: number;
    timeLeftAtPause?: number;
    dueDate?: number;
    completedAt?: number;
    projectId?: string;
    date?: number;
    parentId?: Id<"todos">;
    userId?: Id<"users">;
    description?: string;
    location?: string;
    meetingLink?: string;
    priority?: string;
    categoryId?: Id<"projectCategories">;
    subCategoryId?: Id<"projectSubCategories">;
  };
  onSetTimer: (id: Id<"todos">) => void;
  onLongPress?: (id: Id<"todos">) => void;
  onLinkProject: (id: Id<"todos">) => void;
  homeStyles: any;
  depth?: number;
  isTimelineMode?: boolean;
  initialShowDetails?: boolean;
  onOpenDetail?: (id: Id<"todos">, section?: 'subtask') => void;
}

// ─── Formatting & Color Helpers ──────────────────────────────────────────
const getLuminance = (hex: string) => {
  if (!hex || hex.length < 6) return 0;
  const c = hex.substring(hex.startsWith('#') ? 1 : 0);
  const rgb = parseInt(c, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >>  8) & 0xff;
  const b = (rgb >>  0) & 0xff;
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

const getStatusShadow = (colors: any, status: string, isRTL: boolean) => {
  switch (status) {
    case 'in_progress': return getNeoShadow(colors, 'raisedLg', isRTL);
    case 'done': return getNeoShadow(colors, 'inset', isRTL);
    case 'not_started': return getNeoShadow(colors, 'flat', isRTL);
    case 'paused': return getNeoShadow(colors, 'raised', isRTL);
    case 'not_done': return getNeoShadow(colors, 'raised', isRTL);
    default: return getNeoShadow(colors, 'raised', isRTL);
  }
};

const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const formatDuration = (ms: number) => {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const TodoCard: React.FC<TodoCardProps> = ({ todo, onSetTimer, onLongPress, onLinkProject, homeStyles, depth = 0, isTimelineMode = false, initialShowDetails = false, onOpenDetail }) => {
  const { colors, isDarkMode } = useTheme();
  const { userId, language } = useAuth();
  const { t, isArabic } = useTranslation(language);
  const updateStatus = useOfflineMutation(api.todos.updateStatus, "todos:updateStatus");
  const startTimer = useOfflineMutation(api.todos.startTimer, "todos:startTimer");
  const pauseTimer = useOfflineMutation(api.todos.pauseTimer, "todos:pauseTimer");
  const startSubtaskTimer = useOfflineMutation(api.todos.startSubtaskTimer, "todos:startSubtaskTimer");
  const pauseSubtaskTimer = useOfflineMutation(api.todos.pauseSubtaskTimer, "todos:pauseSubtaskTimer");
  const deleteTodo = useOfflineMutation(api.todos.deleteTodo, "todos:deleteTodo");
  const updateTodo = useOfflineMutation(api.todos.updateTodo, "todos:updateTodo");
  const setTimer = useOfflineMutation(api.todos.setTimer, "todos:setTimer");


  const project = useOfflineQuery<any>('projects.getProjectMetadata', api.projects.getProjectMetadata, todo.projectId ? { id: todo.projectId } : "skip");
  const linkedCategory = useOfflineQuery<any>('projects.getCategory', api.projects.getCategory, todo.categoryId ? { id: todo.categoryId } : "skip");
  const linkedSubCategory = useOfflineQuery<any>('projects.getSubCategory', api.projects.getSubCategory, todo.subCategoryId ? { id: todo.subCategoryId } : "skip");
  const subtasks = useOfflineQuery<any[]>('todos.getSubtasks', api.todos.getSubtasks, { parentId: todo._id });

  const [timeLeft, setTimeLeft] = useState(todo.timerDuration || 0);
  const hasAutoCompletedRef = useRef(false);
  const hasAutoCompletedSubtasksRef = useRef(false);
  // Optimistic status: updates immediately on user action, syncs from server
  const [optimisticStatus, setOptimisticStatus] = useState(todo.status);

  // Timer tick effect
  useEffect(() => {
    const effectiveStatus = optimisticStatus;
    let interval: any;
    if (effectiveStatus === 'in_progress' && todo.timerStartTime) {
      const tick = () => {
        const elapsed = Math.max(0, Date.now() - todo.timerStartTime!);
        if (todo.timerDirection === 'up') {
          setTimeLeft(elapsed);
        } else if (todo.timerDuration) {
          setTimeLeft(Math.max(0, todo.timerDuration - elapsed));
        }
      };
      tick();
      interval = setInterval(tick, 1000);
    } else if (effectiveStatus === 'paused' && todo.timeLeftAtPause !== undefined) {
      setTimeLeft(todo.timeLeftAtPause);
    } else if (effectiveStatus === 'not_started' || effectiveStatus === 'not_done') {
      if (todo.timerDirection === 'up') {
        setTimeLeft(0);
      } else if (todo.timerDuration) {
        setTimeLeft(todo.timerDuration);
      }
    } else if (effectiveStatus === 'done') {
      if (todo.timerDirection === 'up') {
        setTimeLeft(todo.timeLeftAtPause || 0);
      } else if (todo.timerDuration) {
        setTimeLeft(todo.timerDuration);
      }
    }
    return () => clearInterval(interval);
  }, [optimisticStatus, todo.timerStartTime, todo.timerDuration, todo.timeLeftAtPause, todo.timerDirection]);

  // Keep optimistic status in sync with server (server is source of truth)
  useEffect(() => {
    setOptimisticStatus(todo.status);
  }, [todo.status]);

  const [showSubtasks, setShowSubtasks] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(initialShowDetails);
  const [detailModalSection, setDetailModalSection] = useState<'subtask' | undefined>(undefined);
  const [isActionModalVisible, setIsActionModalVisible] = useState(false);

  const openDetail = (section?: 'subtask') => {
    if (onOpenDetail) {
      onOpenDetail(todo._id, section);
    } else {
      setDetailModalSection(section);
      setIsDetailModalVisible(true);
    }
  };

  const hasSubtasks = subtasks && subtasks.length > 0;

  const handleShare = async () => {
    let message = `Task: ${todo.text}`;
    if (todo.description) message += `\n\nDescription: ${todo.description}`;
    if (todo.dueDate) {
      const d = new Date(todo.dueDate);
      message += `\nDue: ${d.toLocaleDateString()}`;
    }
    if (hasSubtasks && subtasks.length > 0) {
      message += `\n\nSubtasks:`;
      subtasks.forEach(s => {
        const check = s.status === 'done' ? '[x]' : '[ ]';
        message += `\n${check} ${s.text}`;
      });
    }
    await Share.share({ message });
  };

  const subtasksWithTimers = useMemo(() => {
    if (!hasSubtasks) return [];
    return subtasks.filter((s: any) => !!s.timerDuration);
  }, [subtasks, hasSubtasks]);
  const hasSubtaskTimers = subtasksWithTimers.length > 0;

  const timerProgress = useMemo(() => {
    if (!hasSubtasks || !todo.timerDuration) return null;
    const completedTimerSum = subtasks
      .filter((s: any) => s.status === 'done' && s.timerDuration)
      .reduce((sum: number, s: any) => sum + (s.timerDuration || 0), 0);
    return Math.min(100, (completedTimerSum / todo.timerDuration) * 100);
  }, [subtasks, todo.timerDuration, hasSubtasks]);

  const countProgress = useMemo(() => {
    if (!hasSubtasks) return 0;
    const done = subtasks.filter((s: any) => s.status === 'done').length;
    return (done / subtasks.length) * 100;
  }, [subtasks, hasSubtasks]);

  // Reset auto-complete guard when status changes away from in_progress
  useEffect(() => {
    if (todo.status !== 'in_progress') {
      hasAutoCompletedRef.current = false;
    }
    if (todo.status !== 'not_started' && todo.status !== 'not_done' && todo.status !== 'in_progress') {
      hasAutoCompletedSubtasksRef.current = false;
    }
  }, [todo.status]);

  // Separate effect for subtask auto-completion to avoid loops with timer
  useEffect(() => {
    if (!hasSubtasks) return;
    const completedSubtasks = subtasks.filter((s: any) => s.status === 'done').length;
    const totalSubtasks = subtasks.length;
    if (totalSubtasks > 0 && completedSubtasks === totalSubtasks && (todo.status === 'not_started' || todo.status === 'not_done' || todo.status === 'in_progress')) {
      if (hasAutoCompletedSubtasksRef.current) return;
      hasAutoCompletedSubtasksRef.current = true;
      updateStatus({ id: todo._id, status: 'done' });
      showTaskCompletedNotification(todo.text, isArabic ? 'ar' : 'en');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtasks?.map((s: any) => s.status).join(','), todo.status, todo._id]);

  const stats = {
    done: subtasks?.filter((s: any) => s.status === 'done').length || 0,
    total: subtasks?.length || 0,
  };

  const handleStartTimer = async () => {
    setOptimisticStatus('in_progress'); // instant UI feedback
    startTimer({ id: todo._id });
  };

  const handlePauseTimer = async () => {
    setOptimisticStatus('paused'); // instant UI feedback
    pauseTimer({ id: todo._id });
  };

  const handleStartSubtask = useCallback((subId: Id<"todos">) => {
    startSubtaskTimer({ id: subId });
  }, [startSubtaskTimer]);

  const handlePauseSubtask = useCallback((subId: Id<"todos">) => {
    pauseSubtaskTimer({ id: subId });
  }, [pauseSubtaskTimer]);

  const handleToggleSubComplete = useCallback((subId: Id<"todos">, currentStatus: string) => {
    updateStatus({ id: subId, status: currentStatus === 'done' ? 'not_started' : 'done' });
  }, [updateStatus]);

  const handleDeleteSub = useCallback((subId: Id<"todos">) => {
    deleteTodo({ id: subId });
  }, [deleteTodo]);

  const handleSetSubTimer = useCallback((subId: Id<"todos">, ms: number, direction: string) => {
    setTimer({ id: subId, duration: ms, timerDirection: direction });
  }, [setTimer]);

  const handleUpdateSubText = useCallback((subId: Id<"todos">, text: string) => {
    updateTodo({ id: subId, text });
  }, [updateTodo]);

  const moveToStatus = (status: string) => {
    setOptimisticStatus(status);
    updateStatus({ id: todo._id, status });
    if (status === 'done') {
      showTaskCompletedNotification(todo.text, isArabic ? 'ar' : 'en');
    }
  };

  const toggleSubtasks = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowSubtasks(!showSubtasks);
  };

  const isTimerSet = !!todo.timerDuration || todo.timerDirection === 'up';
  const isDueSoon = todo.status === 'not_started' && todo.dueDate && (todo.dueDate - Date.now() < 86400000);
  const dueDateEnd = todo.dueDate ? new Date(todo.dueDate).setHours(23, 59, 59, 999) : 0;
  const isPastDue = todo.status === 'not_started' && todo.dueDate && dueDateEnd < Date.now();

  let badgeText = t.notStarted;
  let badgeBg = colors.border;
  let badgeColor = colors.surfaceText;
  let timerText = formatTime(timeLeft);
  if (!isTimerSet && hasSubtasks) timerText = `${stats.done}/${stats.total}`;
  
  let cardBg = colors.surface;
  let cardBorderColor = colors.border;
  
  // Claymorphism: status is communicated through background tint (clay surface).
  // Borders are removed — clay depth (shadow + inner highlight) separates cards.
  // Only overdue / not_done cards retain a subtle border as a functional signal.
  if (isDarkMode) {
    if (todo.status === "in_progress") { cardBg = colors.taskInProgressBg; }
    else if (todo.status === "paused") { cardBg = colors.taskPausedBg; }
    else if (todo.status === "done") { cardBg = colors.taskDoneBg; }
    else if (todo.status === "not_done" || isPastDue) { cardBg = colors.taskNotDoneBg; cardBorderColor = colors.danger; }
    else if (todo.status === "not_started") { cardBg = colors.taskNotStartedBg; }
  } else {
    if (todo.status === "in_progress") { cardBg = colors.taskInProgressBg; }
    else if (todo.status === "paused") { cardBg = colors.taskPausedBg; }
    else if (todo.status === "done") { cardBg = colors.taskDoneBg; }
    else if (todo.status === "not_done" || isPastDue) { cardBg = colors.taskNotDoneBg; cardBorderColor = colors.danger; }
    else if (todo.status === "not_started") { cardBg = colors.taskNotStartedBg; }
  }

  // Detect if the card background is bright enough to need dark text
  const isBrightBg = getLuminance(cardBg) > 170;
  
  const contentColor = isBrightBg ? colors.text : colors.surfaceText;
  const contentMutedColor = isBrightBg ? colors.text + '80' : colors.surfaceText + '80';

  if (todo.status === "in_progress") { 
    badgeText = t.inProgress; 
    badgeBg = isBrightBg ? colors.text + '15' : colors.primary + '15'; 
    badgeColor = isBrightBg ? colors.text : (isDarkMode ? colors.primary : colors.surfaceText); 
  }
  else if (todo.status === "paused") { 
    badgeText = t.paused; 
    badgeBg = isBrightBg ? colors.text + '10' : colors.surfaceText + '10'; 
    badgeColor = isBrightBg ? colors.text : (isDarkMode ? colors.surfaceText : colors.surfaceText); 
  }
  else if (todo.status === "done") { 
    badgeText = t.done; 
    badgeBg = colors.success + '20'; 
    badgeColor = colors.success; 
    timerText = t.done; 
  }
  else if (todo.status === "not_done" || isPastDue) { 
    badgeText = todo.status === "not_started" ? t.notStarted : t.notDone; 
    badgeBg = isBrightBg ? colors.danger + '15' : colors.danger + '20'; 
    badgeColor = colors.danger; 
    timerText = "—"; 
  }
  else if (todo.status === "not_started") { 
    badgeBg = isBrightBg ? colors.primary + '15' : colors.primary + '20'; 
    badgeColor = colors.primary; 
  }

  if (!isTimerSet && hasSubtasks) {
    // Already set above
  }

  const timerCircularProgress = useMemo(() => {
    if (isTimerSet && todo.timerDuration) {
      return Math.min(100, ((todo.timerDuration - timeLeft) / todo.timerDuration) * 100);
    }
    return 0;
  }, [isTimerSet, todo.timerDuration, timeLeft]);

  const circularProgressValue = isTimerSet ? timerCircularProgress : (hasSubtasks ? countProgress : 0);
  const circularProgressColor = todo.status === 'done' ? colors.success
    : (todo.status === 'not_done' || isPastDue) ? colors.danger
    : todo.status === 'not_started' ? colors.primary
    : todo.status === 'paused' ? (isBrightBg ? colors.text : colors.textMuted)
    : todo.status === 'in_progress' ? colors.warning
    : (isBrightBg ? colors.text + '40' : colors.surfaceText + '40');

  const anySubtaskRunning = hasSubtasks && subtasks.some((s: any) => s.status === 'in_progress' && !!s.timerDuration);

  const coreCard = (
    <>
      <TouchableOpacity 
        activeOpacity={0.95}
        onPress={() => openDetail()}
        onLongPress={() => { 
          setIsActionModalVisible(true);
          if (onLongPress) onLongPress(todo._id); 
        }}
        style={[
          homeStyles.card, 
          { 
            overflow: 'hidden', 
            position: 'relative', 
            backgroundColor: cardBg, 
            borderColor: (todo.status === 'not_done' || isPastDue) ? cardBorderColor : 'transparent', 
            borderWidth: (todo.status === 'not_done' || isPastDue) ? 1 : 0, 
            padding: isTimelineMode ? 18 : 14,
            ...(() => {
              const s = getStatusShadow(colors, todo.status, isArabic);
              const { backgroundColor: _, ...rest } = s;
              return rest;
            })(),
          }
        ]}
      >
        {isTimelineMode && (
          <View style={{
            position: 'absolute',
            start: 6,
            top: 24, bottom: 24, width: 4, borderRadius: 2,
            backgroundColor: todo.priority === 'High' ? colors.danger : todo.priority === 'Medium' ? colors.warning : colors.primary
          }}/>
        )}
        <View style={{ zIndex: 1, paddingStart: isTimelineMode ? 8 : 0, flex: 1 }}>
          <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }]}>
            <View style={[{ flex: 1, paddingEnd: 8 }, isArabic && { alignItems: 'flex-end' }]}>
              {(
                <View>
                  <Text 
                    style={[homeStyles.cardTitle, { marginBottom: 10, color: contentColor }, isArabic && { textAlign: 'right' }]} 
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {todo.text}
                  </Text>
                </View>
              )}
              <View style={[{ flexDirection: 'row', gap: 8 }]}>
                <View style={[homeStyles.badge, { backgroundColor: badgeBg === colors.border ? colors.surfaceText + '15' : badgeBg, alignSelf: isArabic ? 'flex-end' : 'flex-start' }]}>
                  <Text style={[homeStyles.badgeText, { color: (badgeColor === colors.text || badgeColor === colors.textMuted) ? colors.surfaceText : badgeColor }]}>{badgeText}</Text>
                </View>
              </View>
            </View>
            {isTimerSet && (
            <View style={{ justifyContent: 'center', alignItems: 'center', width: 56 }}>
              <CircularProgress
                size={56} strokeWidth={4} progress={circularProgressValue}
                color={circularProgressColor}
                unfilledColor={isBrightBg ? colors.text + '14' : (isDarkMode ? colors.surfaceText + '1A' : colors.text + '0D')}
              >
                <Text style={{ fontSize: 10, fontWeight: "700", color: circularProgressColor, textAlign: 'center' }}>
                  {timerText}
                </Text>
              </CircularProgress>
            </View>
            )}
          </View>

          {hasSubtasks && countProgress > 0 && (
            <View style={{ marginTop: 8, marginBottom: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Text style={[{ fontSize: 11, fontWeight: '700', color: contentMutedColor }, isArabic && { textAlign: 'right', flex: 1 }]}>
                  {isArabic ? 'تقدم المهام الفرعية' : 'Subtask Progress'}
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '800', color: countProgress >= 100 ? (isBrightBg ? colors.text : colors.success) : (isBrightBg ? colors.text : colors.primary) }}>
                  {Math.round(countProgress)}%
                </Text>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: isBrightBg ? colors.text + '1A' : (isDarkMode ? colors.surfaceText + '0F' : colors.text + '0F'), overflow: 'hidden' }}>
                <View style={{
                  height: '100%',
                  width: `${Math.min(100, countProgress)}%`,
                  borderRadius: 3,
                  backgroundColor: countProgress >= 100 ? (isBrightBg ? colors.text : colors.success) : (isBrightBg ? colors.text : colors.primary),
                }} />
              </View>
            </View>
          )}

          <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }]}>
            <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
              {!hasSubtaskTimers && (
                <>
                  {!isTimerSet && (
                    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                      <TouchableOpacity 
                        style={[homeStyles.iconBtn, { backgroundColor: optimisticStatus === 'not_started' || optimisticStatus === 'not_done' ? colors.primary + '20' : 'transparent', borderWidth: 1, borderColor: optimisticStatus === 'not_started' || optimisticStatus === 'not_done' ? colors.primary : colors.border }]}
                        onPress={() => optimisticStatus !== 'not_started' && moveToStatus('not_started')}
                      >
                        <Ionicons name="ellipse-outline" size={16} color={optimisticStatus === 'not_started' || optimisticStatus === 'not_done' ? colors.primary : contentColor} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[homeStyles.iconBtn, { backgroundColor: optimisticStatus === 'in_progress' ? colors.warning + '20' : 'transparent', borderWidth: 1, borderColor: optimisticStatus === 'in_progress' ? colors.warning : colors.border }]}
                        onPress={() => optimisticStatus !== 'in_progress' && moveToStatus('in_progress')}
                      >
                        <Ionicons name="play-outline" size={16} color={optimisticStatus === 'in_progress' ? colors.warning : contentColor} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[homeStyles.iconBtn, { backgroundColor: optimisticStatus === 'done' ? colors.success + '20' : 'transparent', borderWidth: 1, borderColor: optimisticStatus === 'done' ? colors.success : colors.border }]}
                        onPress={() => optimisticStatus !== 'done' && moveToStatus('done')}
                      >
                        <Ionicons name="checkmark-circle-outline" size={16} color={optimisticStatus === 'done' ? colors.success : contentColor} />
                      </TouchableOpacity>
                    </View>
                  )}
                  {(optimisticStatus === 'not_started' || optimisticStatus === 'not_done') && (
                    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                      {!isTimerSet ? (
                        <TouchableOpacity style={[homeStyles.actionBtn, { 
                          backgroundColor: colors.neomorphic.raised.backgroundColor,
                          shadowColor: colors.text,
                          shadowOffset: { width: 4, height: 4 },
                          shadowOpacity: 0.1,
                          shadowRadius: 8,
                          elevation: 4,
                        }]} onPress={() => onSetTimer(todo._id)}>
                          <Ionicons name="timer-outline" size={16} color={contentColor} />
                          <Text style={[homeStyles.actionBtnText, { color: contentColor }]}>{t.setTimer}</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity style={[homeStyles.actionBtn, { backgroundColor: isBrightBg ? colors.text : colors.primary }]} onPress={handleStartTimer}>
                          <Ionicons name="play" size={16} color={isBrightBg ? colors.surfaceText : (isDarkMode ? colors.text : colors.surfaceText)} />
                          <Text style={[homeStyles.actionBtnText, { color: isBrightBg ? colors.surfaceText : (isDarkMode ? colors.text : colors.surfaceText) }]}>{t.startTask}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                  {optimisticStatus === 'in_progress' && (
                    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                      <TouchableOpacity style={[homeStyles.iconBtn, { backgroundColor: isBrightBg ? colors.surfaceText + '66' : colors.surface, borderColor: isBrightBg ? colors.text + '1A' : colors.border, borderWidth: 1 }]} onPress={handlePauseTimer}>
                        <Ionicons name="pause" size={16} color={contentColor} />
                      </TouchableOpacity>
                      {todo.timerDirection === 'up' && (
                        <TouchableOpacity style={[homeStyles.iconBtn, { backgroundColor: isBrightBg ? colors.success + '4D' : colors.success + '26', borderColor: isBrightBg ? colors.text + '1A' : colors.success + '40', borderWidth: 1 }]} onPress={() => { updateStatus({ id: todo._id, status: 'done' }); showTaskCompletedNotification(todo.text, isArabic ? 'ar' : 'en'); }}>
                          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                  {optimisticStatus === 'paused' && (
                    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                      <TouchableOpacity style={[homeStyles.iconBtn, { backgroundColor: isBrightBg ? colors.text : colors.primary }]} onPress={handleStartTimer}>
                        <Ionicons name="play" size={16} color={isBrightBg ? colors.surfaceText : (isDarkMode ? colors.text : colors.surfaceText)} />
                      </TouchableOpacity>
                      {todo.timerDirection === 'up' && (
                        <TouchableOpacity style={[homeStyles.iconBtn, { backgroundColor: isBrightBg ? colors.success + '4D' : colors.success + '26', borderColor: isBrightBg ? colors.text + '1A' : colors.success + '40', borderWidth: 1 }]} onPress={() => { updateStatus({ id: todo._id, status: 'done' }); showTaskCompletedNotification(todo.text, isArabic ? 'ar' : 'en'); }}>
                          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </>
              )}
              {hasSubtaskTimers && (
                <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                  {!isTimerSet && (
                    <>
                      <TouchableOpacity 
                        style={[homeStyles.iconBtn, { backgroundColor: optimisticStatus === 'not_started' || optimisticStatus === 'not_done' ? colors.primary + '20' : 'transparent', borderWidth: 1, borderColor: optimisticStatus === 'not_started' || optimisticStatus === 'not_done' ? colors.primary : colors.border }]}
                        onPress={() => optimisticStatus !== 'not_started' && moveToStatus('not_started')}
                      >
                        <Ionicons name="ellipse-outline" size={16} color={optimisticStatus === 'not_started' || optimisticStatus === 'not_done' ? colors.primary : contentColor} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[homeStyles.iconBtn, { backgroundColor: optimisticStatus === 'in_progress' ? colors.warning + '20' : 'transparent', borderWidth: 1, borderColor: optimisticStatus === 'in_progress' ? colors.warning : colors.border }]}
                        onPress={() => optimisticStatus !== 'in_progress' && moveToStatus('in_progress')}
                      >
                        <Ionicons name="play-outline" size={16} color={optimisticStatus === 'in_progress' ? colors.warning : contentColor} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[homeStyles.iconBtn, { backgroundColor: optimisticStatus === 'done' ? colors.success + '20' : 'transparent', borderWidth: 1, borderColor: optimisticStatus === 'done' ? colors.success : colors.border }]}
                        onPress={() => optimisticStatus !== 'done' && moveToStatus('done')}
                      >
                        <Ionicons name="checkmark-circle-outline" size={16} color={optimisticStatus === 'done' ? colors.success : contentColor} />
                      </TouchableOpacity>
                    </>
                  )}
                  {anySubtaskRunning && (
                    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: isBrightBg ? colors.text + '1A' : colors.warning + '15', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: isBrightBg ? colors.text + '33' : colors.warning + '30' }]}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isBrightBg ? colors.text : colors.warning }} />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: isBrightBg ? colors.text : colors.warning }}>{t.timerRunning}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
            <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
              {hasSubtasks && (
                <TouchableOpacity
                  onPress={toggleSubtasks}
                  style={[homeStyles.actionBtn, { backgroundColor: isBrightBg ? colors.text + '0D' : colors.primary + '15', borderColor: isBrightBg ? colors.text + '1A' : colors.primary + '30', borderWidth: 1 }]}
                >
                  <Text style={{ color: contentColor, fontSize: 13, fontWeight: '700' }}>
                    {stats.total} {stats.total === 1 ? t.subtask : t.subtasks} {showSubtasks ? '▼' : '▶'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[homeStyles.actionBtn, {
                  paddingHorizontal: hasSubtasks ? 10 : 14,
                  backgroundColor: hasSubtasks ? 'transparent' : (isBrightBg ? colors.text + '0D' : colors.primary + '12'),
                  borderWidth: hasSubtasks ? 0 : 1,
                  borderColor: isBrightBg ? colors.text + '1A' : colors.primary + '40',
                  borderStyle: 'dashed',
                }]}
                onPress={() => openDetail('subtask')}
              >
                <Ionicons name="add-circle-outline" size={16} color={contentMutedColor} />
                {!hasSubtasks && (
                  <Text style={{ color: contentColor, fontSize: 12, fontWeight: '700' }}>{t.addSubtask}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {todo.dueDate && (
                <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                  <Ionicons name="calendar-outline" size={14} color={isDueSoon ? (isBrightBg ? colors.danger : colors.danger) : contentMutedColor} />
                  <Text style={[{ fontSize: 12, color: isDueSoon ? (isBrightBg ? colors.danger : colors.danger) : contentMutedColor, fontWeight: '600' }, isArabic && { textAlign: 'right' }]}>
                    {new Date(todo.dueDate).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')}
                  </Text>
                </View>
              )}
              {todo.date && (
                <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                  <Ionicons name="calendar-clear-outline" size={14} color={contentMutedColor} />
                  <Text style={[{ fontSize: 12, color: contentMutedColor, fontWeight: '600' }, isArabic && { textAlign: 'right' }]}>
                    {new Date(todo.date).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity style={[homeStyles.projectRow, { marginBottom: 12 }]} onPress={() => openDetail()}>
            <Ionicons name="link-outline" size={16} color={(todo.projectId || todo.subCategoryId || todo.categoryId) ? (isBrightBg ? colors.text : colors.primary) : contentMutedColor} />
            <Text style={[homeStyles.projectText, { color: contentMutedColor }, (todo.projectId || todo.subCategoryId || todo.categoryId) && { color: contentColor, fontStyle: 'normal', fontWeight: '700' }, isArabic && { textAlign: 'right' }]}>
              {project?.name || linkedSubCategory?.name || linkedCategory?.name || todo.projectId || t.noProject}
            </Text>
          </TouchableOpacity>

          <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 15 }]}>
              {hasSubtasks && (
                <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                  <Ionicons name="list-outline" size={15} color={contentMutedColor} />
                  <Text style={{ fontSize: 12, color: contentMutedColor, fontWeight: '700' }}>{stats.done}/{stats.total} {isArabic ? 'مهام' : 'Subtasks'}</Text>
                </View>
              )}
              <TouchableOpacity onPress={() => openDetail()}>
                <Ionicons name="create-outline" size={18} color={contentColor} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => deleteTodo({ id: todo._id })}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>

          {showSubtasks && hasSubtasks && (
            <View style={{ marginTop: 12, paddingTop: 8, gap: 8 }}>
              {subtasks.map((sub: any) => (
                <SubtaskRow
                  key={sub._id}
                  sub={sub}
                  parentTimerDuration={todo.timerDuration}
                  onStartSubtask={handleStartSubtask}
                  onPauseSubtask={handlePauseSubtask}
                  onToggleComplete={handleToggleSubComplete}
                  onDelete={handleDeleteSub}
                  onSetTimer={handleSetSubTimer}
                  onUpdateText={handleUpdateSubText}
                  onUpdateStatus={(id, status) => updateStatus({ id, status })}
                />
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </>
  );

  const actionModal = (
    <ActionModal 
      visible={isActionModalVisible}
      onClose={() => setIsActionModalVisible(false)}
      title={todo.text}
      isArabic={isArabic}
      options={[
        { 
          label: t.edit || 'Edit', 
          icon: 'create-outline', 
          onPress: () => {
            setIsActionModalVisible(false);
            openDetail();
          } 
        },
        {
          label: t.linkProject || 'Link Project',
          icon: 'folder-outline',
          onPress: () => {
            setIsActionModalVisible(false);
            if (onLinkProject) onLinkProject(todo._id);
          }
        },
        { 
          label: t.share || 'Share', 
          icon: 'share-social-outline', 
          onPress: () => {
            setIsActionModalVisible(false);
            handleShare();
          } 
        },
        { 
          label: t.delete || 'Delete', 
          icon: 'trash-outline', 
          variant: 'destructive',
          onPress: () => {
            setIsActionModalVisible(false);
            Alert.alert(
              t.confirmDeleteTitle || "Confirm Delete", 
              t.confirmDeleteTask || "Are you sure you want to delete this task?", 
              [
                { text: t.cancel || "Cancel", style: "cancel" },
                { text: t.delete || "Delete", style: "destructive", onPress: () => deleteTodo({ id: todo._id }) }
              ]
            );
          }
        }
      ]}
    />
  );

  if (isTimelineMode) {
    const isPlaying = todo.status === 'in_progress';
    const isDone = todo.status === 'done';
    const formatTimeShort = (ms: number) => {
      const d = new Date(ms);
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    // Top time: first time user ever started the timer; cleared only on reset
    const startTimeStr = todo.timerFirstStartTime ? formatTimeShort(todo.timerFirstStartTime) : '';

    // Bottom time: when task was completed (done status + completedAt), else empty
    const endTimeStr = isDone && todo.completedAt ? formatTimeShort(todo.completedAt) : '';
    
    return (
      <View style={[
        homeStyles.cardContainer,
        {
          marginHorizontal: 0,
          marginStart: 24 + (depth * 16),
          marginEnd: 24,
          flexDirection: 'row'
        }
      ]}>
        <View style={[homeStyles.timelineColumn, { justifyContent: 'space-between', paddingVertical: 12, alignItems: 'center' }]}>
          <Text style={[homeStyles.timelineTimeTop, { color: colors.text }]}>{startTimeStr}</Text>
          <View style={{ flex: 1, width: 2, backgroundColor: isPlaying ? colors.primary : colors.border, marginVertical: 8 }} />
          {endTimeStr ? <Text style={[homeStyles.timelineTimeBottom, { color: colors.textMuted }]}>{endTimeStr}</Text> : null}
        </View>
        {coreCard}
        {!onOpenDetail && (
        <TaskDetailModal 
          visible={isDetailModalVisible}
          onClose={() => { setIsDetailModalVisible(false); setDetailModalSection(undefined); }}
          todoId={todo._id}
          initialSection={detailModalSection}
        />
        )}
        {actionModal}
      </View>
    );
  }

  return (
    <View style={{ marginStart: depth * 16 }}>
      {coreCard}
      {!onOpenDetail && (
      <TaskDetailModal 
        visible={isDetailModalVisible}
        onClose={() => { setIsDetailModalVisible(false); setDetailModalSection(undefined); }}
        todoId={todo._id}
        initialSection={detailModalSection}
      />
      )}
      {actionModal}
    </View>
  );
};

export default TodoCard;
