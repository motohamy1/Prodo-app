import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import useTheme from '@/hooks/useTheme';
import { useTranslation } from '@/utils/i18n';
import { useAuth } from '@/hooks/useAuth';
import { createScrollStackStyles } from '@/assets/styles/scrollStack.styles';
import { Id } from '@/convex/_generated/dataModel';

export interface ChecklistTaskItem {
  _id: Id<"todos">;
  text: string;
  status?: string;
  priority?: string;
  dueDate?: number;
}

interface ChecklistCardProps {
  tasks: ChecklistTaskItem[];
  doneCount: number;
  totalCount: number;
  onToggleTask: (id: Id<"todos">, currentStatus: string) => void;
  onOpenTaskDetail: (id: Id<"todos">) => void;
  onQuickManage: () => void;
  onScrollToTasksSection: () => void;
  onAddNewTask?: () => void;
}

export const ChecklistCard: React.FC<ChecklistCardProps> = ({
  tasks,
  doneCount,
  totalCount,
  onToggleTask,
  onOpenTaskDetail,
  onQuickManage,
  onScrollToTasksSection,
  onAddNewTask,
}) => {
  const { colors, isDarkMode } = useTheme();
  const { language } = useAuth();
  const { t, isArabic } = useTranslation(language);
  const styles = createScrollStackStyles(colors, isArabic, isDarkMode);

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'Urgent':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444' };
      case 'High':
        return { bg: 'rgba(246, 229, 201, 0.2)', text: '#f6e5c9' };
      case 'Medium':
        return { bg: 'rgba(222, 254, 249, 0.2)', text: '#defef9' };
      default:
        return { bg: 'rgba(219, 212, 253, 0.2)', text: '#dbd4fd' };
    }
  };

  return (
    <View style={styles.card}>
      {/* Header - Tapping triggers scroll to full Tasks section */}
      <TouchableOpacity 
        style={styles.cardHeader} 
        onPress={onScrollToTasksSection}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.iconBadge, { backgroundColor: isDarkMode ? 'rgba(222, 254, 249, 0.18)' : 'rgba(222, 254, 249, 0.35)' }]}>
            <Ionicons name="checkmark-done" size={20} color="#defef9" />
          </View>
          <View style={isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }}>
            <Text style={styles.cardTitle}>{t.todaysChecklist}</Text>
            <Text style={styles.cardSubtitle}>
              {doneCount}/{totalCount} {t.tasksCompleted}
            </Text>
          </View>
        </View>

        <View style={styles.cardHeaderRight}>
          <View style={styles.headerPill}>
            <Ionicons name="arrow-down-circle-outline" size={14} color={colors.primary} />
            <Text style={styles.headerPillText}>{t.tabTodo}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Body: Checklist Tasks with Internal Nested Scroll to Prevent Overflow */}
      {tasks.length === 0 ? (
        <View style={styles.emptyCardContent}>
          <Ionicons name="sparkles-outline" size={28} color={colors.primary} />
          <Text style={styles.emptyCardTitle}>{t.noTasksTodayChecklist}</Text>
          {onAddNewTask && (
            <TouchableOpacity style={styles.emptyCardBtn} onPress={onAddNewTask} activeOpacity={0.8}>
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={styles.emptyCardBtnText}>{t.startTask}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.checklistScrollView}
          contentContainerStyle={styles.checklistScrollContent}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          overScrollMode="never"
          decelerationRate="fast"
          scrollEventThrottle={16}
        >
          {tasks.map((task) => {
            const isDone = task.status === 'done';
            const priorityTheme = getPriorityColor(task.priority);

            return (
              <View key={task._id} style={styles.checklistItem}>
                <View style={styles.checklistItemLeft}>
                  {/* Interactive Checkbox */}
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      onToggleTask(task._id, task.status || 'not_started');
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={[styles.checkbox, isDone && styles.checkboxChecked]}
                  >
                    {isDone && <Ionicons name="checkmark" size={14} color="#16270E" />}
                  </TouchableOpacity>

                  {/* Task Text: Tapping opens TaskDetailModal */}
                  <TouchableOpacity
                    onPress={() => onOpenTaskDetail(task._id)}
                    style={{ flex: 1 }}
                    activeOpacity={0.7}
                  >
                    <Text 
                      style={[styles.checkItemText, isDone && styles.checkItemTextDone]}
                      numberOfLines={1}
                    >
                      {task.text}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Priority Tag */}
                {task.priority && (
                  <View style={[styles.priorityTag, { backgroundColor: priorityTheme.bg }]}>
                    <Text style={[styles.priorityTagText, { color: priorityTheme.text }]}>
                      {task.priority}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Footer: Quick Manage Icon & Scroll Hint */}
      <View style={styles.cardFooter}>
        <TouchableOpacity 
          style={styles.footerActionBtn}
          onPress={onQuickManage}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={16} color={colors.textMuted} />
          <Text style={styles.footerActionText}>{t.manageTask}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={onScrollToTasksSection}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={styles.footerHintText}>{t.tapToScrollTasks} ↓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChecklistCard;
