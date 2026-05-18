import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { scheduleTimerCompletion, cancelTaskNotification } from '../utils/notifications';

export function useTaskTimers(todos: any[] | undefined, updateStatus: any) {
  const appState = useRef(AppState.currentState);
  const todosRef = useRef(todos);
  const scheduledNotifications = useRef(new Map<string, string>());

  useEffect(() => {
    todosRef.current = todos;
    
    if (!todos || !Array.isArray(todos)) return;

    const activeTaskIds = new Set<string>();

    todos.forEach((todo) => {
      activeTaskIds.add(todo._id);
      if (todo.status === 'in_progress' && todo.timerStartTime && todo.timerDuration && todo.timerDirection !== 'up') {
        const elapsed = Date.now() - todo.timerStartTime;
        const remaining = Math.max(0, todo.timerDuration - elapsed);
        
        if (remaining > 0) {
           const lastScheduled = scheduledNotifications.current.get(todo._id);
           const scheduleKey = `${todo.timerStartTime}-${todo.timerDuration}`;
           if (lastScheduled !== scheduleKey) {
             if (lastScheduled) {
               cancelTaskNotification(todo._id);
             }
             scheduleTimerCompletion(todo._id, todo.text, remaining);
             scheduledNotifications.current.set(todo._id, scheduleKey);
           }
        }
      } else {
        if (scheduledNotifications.current.has(todo._id)) {
          cancelTaskNotification(todo._id);
          scheduledNotifications.current.delete(todo._id);
        }
      }
    });

    for (const [taskId] of scheduledNotifications.current.entries()) {
      if (!activeTaskIds.has(taskId)) {
        cancelTaskNotification(taskId);
        scheduledNotifications.current.delete(taskId);
      }
    }
  }, [todos]);

  useEffect(() => {
    const checkTasks = (currentTodos: any[]) => {
      if (!currentTodos || !Array.isArray(currentTodos)) return;

      currentTodos.forEach((todo) => {
        // 1. Timer expiry → done (count-down only)
        if (todo.status === 'in_progress' && todo.timerStartTime && todo.timerDuration) {
          if (todo.timerDirection === 'up') return;

          const elapsed = Date.now() - todo.timerStartTime;
          const remaining = Math.max(0, todo.timerDuration - elapsed);

          if (remaining === 0) {
            updateStatus({ id: todo._id, status: 'done' });
            return;
          }
        }

        // 2. Deadline passed without completion → not_done
        // Only trigger based on dueDate (deadline), never on creation/scheduled date.
        if (
          (todo.status === 'not_started' || todo.status === 'in_progress' || todo.status === 'paused') &&
          todo.dueDate
        ) {
          const dueDateEndOfDay = new Date(todo.dueDate);
          dueDateEndOfDay.setHours(23, 59, 59, 999);
          if (dueDateEndOfDay.getTime() < Date.now()) {
            updateStatus({ id: todo._id, status: 'not_done' });
          }
        }
      });
    };

    // Initial check
    if (todosRef.current) {
      checkTasks(todosRef.current);
    }

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (todosRef.current) {
          checkTasks(todosRef.current);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [updateStatus]);
}
