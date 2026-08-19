import AsyncStorage from '@react-native-async-storage/async-storage';

// Global in-memory cache shared across the application
export const memoryCache: Record<string, any> = {};

// Subscriber listeners for reactive query re-renders
const listeners = new Set<() => void>();

export const subscribeToCache = (callback: () => void) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};

export const notifyCacheChanged = () => {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.warn('Error in cache subscriber:', e);
    }
  });
};

export const getCacheKey = (queryKey: string, args: any) => {
  return `CACHE_${queryKey}_${JSON.stringify(args || {})}`;
};

export const getCachedQuerySync = (queryKey: string, args: any) => {
  const key = getCacheKey(queryKey, args);
  return memoryCache[key];
};

export const saveCachedQuery = async (queryKey: string, args: any, data: any) => {
  const key = getCacheKey(queryKey, args);
  memoryCache[key] = data;
  notifyCacheChanged();
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to persist query cache to storage', err);
  }
};

export const getCachedQuery = async (queryKey: string, args: any) => {
  const key = getCacheKey(queryKey, args);
  if (memoryCache[key] !== undefined) {
    return memoryCache[key];
  }
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      const parsed = JSON.parse(value);
      memoryCache[key] = parsed;
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to read query cache from storage', err);
  }
  return null;
};

export const updateCachedQuery = async (
  queryKey: string,
  args: any,
  updater: (oldData: any) => any
) => {
  const key = getCacheKey(queryKey, args);
  let currentData = memoryCache[key];
  if (currentData === undefined) {
    currentData = await getCachedQuery(queryKey, args);
  }
  if (currentData !== undefined && currentData !== null) {
    const updated = updater(currentData);
    await saveCachedQuery(queryKey, args, updated);
  }
};

// --- Mutation Queue Management ---

export interface QueuedMutation {
  id: string;
  tempId?: string;
  mutationKey: string;
  mutationPath: string;
  args: any;
  timestamp: number;
  retryCount?: number;
}

export const pushMutationToQueue = async (
  mutationKey: string,
  mutationPath: string,
  args: any,
  tempId?: string
) => {
  try {
    const queueJson = await AsyncStorage.getItem('OFFLINE_MUTATION_QUEUE');
    const queue: QueuedMutation[] = queueJson ? JSON.parse(queueJson) : [];
    
    // Deduplication check: ignore if identical mutation was queued within the last 4 seconds or same tempId
    const now = Date.now();
    const isDuplicate = queue.some((item) => {
      if (tempId && item.tempId === tempId) return true;
      if (item.mutationPath === mutationPath && JSON.stringify(item.args) === JSON.stringify(args)) {
        return now - item.timestamp < 4000;
      }
      return false;
    });

    if (isDuplicate) {
      console.log(`Suppressed duplicate queued mutation: ${mutationPath}`);
      return;
    }

    queue.push({
      id: Date.now().toString() + Math.random().toString(),
      tempId,
      mutationKey,
      mutationPath,
      args,
      timestamp: Date.now(),
      retryCount: 0,
    });
    await AsyncStorage.setItem('OFFLINE_MUTATION_QUEUE', JSON.stringify(queue));
  } catch (err) {
    console.warn('Failed to push to mutation queue', err);
  }
};

export const getMutationQueue = async (): Promise<QueuedMutation[]> => {
  try {
    const queueJson = await AsyncStorage.getItem('OFFLINE_MUTATION_QUEUE');
    return queueJson ? JSON.parse(queueJson) : [];
  } catch (err) {
    return [];
  }
};

export const clearMutationQueue = async () => {
  try {
    await AsyncStorage.removeItem('OFFLINE_MUTATION_QUEUE');
  } catch (err) {}
};

export const setMutationQueue = async (queue: QueuedMutation[]) => {
  try {
    await AsyncStorage.setItem('OFFLINE_MUTATION_QUEUE', JSON.stringify(queue));
  } catch (err) {
    console.warn('Failed to set mutation queue', err);
  }
};

// --- Automatic Optimistic Local Store Execution ---

export const applyOptimisticMutation = (mutationPath: string, args: any): any => {
  const tempId = `temp_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

  // Find and update all memoryCache entries matching specific prefixes
  const updateMatchingCaches = (prefix: string, updater: (val: any) => any) => {
    Object.keys(memoryCache).forEach((key) => {
      if (key.startsWith(prefix)) {
        const current = memoryCache[key];
        if (current !== undefined) {
          const updated = updater(current);
          if (updated !== undefined) {
            memoryCache[key] = updated;
            AsyncStorage.setItem(key, JSON.stringify(updated)).catch(() => {});
          }
        }
      }
    });
  };

  switch (mutationPath) {
    // ─── TODOS ─────────────────────────────────────────────────────────────────
    case 'todos:addTodo': {
      const newTodo = {
        _id: tempId,
        _creationTime: Date.now(),
        ...args,
        status: args.status || 'not_started',
        hashtags: args.hashtags || [],
        text: args.text || '',
        description: args.description || '',
      };

      // Add to todos query cache
      updateMatchingCaches('CACHE_todos_', (todosList) => {
        if (!Array.isArray(todosList)) return [newTodo];
        // If it already exists, replace; otherwise prepend
        return [newTodo, ...todosList.filter((t: any) => t._id !== tempId)];
      });

      // If it has a parent, also update getSubtasks cache
      if (args.parentId) {
        updateMatchingCaches('CACHE_todos.getSubtasks_', (subtasks) => {
          if (!Array.isArray(subtasks)) return [newTodo];
          return [...subtasks.filter((s: any) => s._id !== tempId), newTodo];
        });
      }

      // Save getById cache for immediate detail access
      const getByIdKey = getCacheKey('todos.getById', { id: tempId });
      memoryCache[getByIdKey] = newTodo;
      AsyncStorage.setItem(getByIdKey, JSON.stringify(newTodo)).catch(() => {});

      notifyCacheChanged();
      return tempId;
    }

    case 'todos:updateTodo':
    case 'todos:updateStatus':
    case 'todos:setTimer':
    case 'todos:startTimer':
    case 'todos:pauseTimer':
    case 'todos:startSubtaskTimer':
    case 'todos:pauseSubtaskTimer':
    case 'todos:resetTimer':
    case 'todos:removeTimer':
    case 'todos:linkTask':
    case 'todos:linkProject': {
      const targetId = args.id || args.todoId;
      if (!targetId) break;

      const patchTodo = (item: any) => {
        if (item._id !== targetId) return item;
        const updated = { ...item };

        if (mutationPath === 'todos:updateStatus') {
          updated.status = args.status;
          if (args.status === 'done') {
            updated.completedAt = Date.now();
          } else {
            updated.completedAt = undefined;
          }
        } else if (mutationPath === 'todos:startTimer' || mutationPath === 'todos:startSubtaskTimer') {
          updated.status = 'in_progress';
          updated.timerStartTime = Date.now();
          if (!updated.timerFirstStartTime) updated.timerFirstStartTime = Date.now();
        } else if (mutationPath === 'todos:pauseTimer' || mutationPath === 'todos:pauseSubtaskTimer') {
          updated.status = 'paused';
          if (updated.timerStartTime) {
            const elapsed = Date.now() - updated.timerStartTime;
            if (updated.timerDirection === 'up') {
              updated.timeLeftAtPause = (updated.timeLeftAtPause || 0) + elapsed;
            } else if (updated.timerDuration) {
              const currentLeft = updated.timeLeftAtPause !== undefined ? updated.timeLeftAtPause : updated.timerDuration;
              updated.timeLeftAtPause = Math.max(0, currentLeft - elapsed);
            }
          }
          updated.timerStartTime = undefined;
        } else if (mutationPath === 'todos:resetTimer') {
          updated.status = 'not_started';
          updated.timerStartTime = undefined;
          updated.timeLeftAtPause = undefined;
        } else if (mutationPath === 'todos:removeTimer') {
          updated.timerDuration = undefined;
          updated.timerDirection = undefined;
          updated.timerStartTime = undefined;
          updated.timeLeftAtPause = undefined;
        } else if (mutationPath === 'todos:setTimer') {
          if (args.duration !== undefined) updated.timerDuration = args.duration;
          if (args.timerDuration !== undefined) updated.timerDuration = args.timerDuration;
          if (args.timerDirection !== undefined) updated.timerDirection = args.timerDirection;
          if (args.timerStartTime !== undefined) updated.timerStartTime = args.timerStartTime;
          if (args.dueDate !== undefined) updated.dueDate = args.dueDate;
          if (args.date !== undefined) updated.date = args.date;
        } else if (mutationPath === 'todos:linkTask' || mutationPath === 'todos:linkProject') {
          updated.categoryId = args.categoryId;
          updated.subCategoryId = args.subCategoryId;
          updated.projectId = args.projectId;
        } else {
          // General updateTodo
          Object.assign(updated, args);
        }

        return updated;
      };

      updateMatchingCaches('CACHE_todos_', (list) => {
        if (!Array.isArray(list)) return list;
        return list.map(patchTodo);
      });

      updateMatchingCaches('CACHE_todos.getSubtasks_', (list) => {
        if (!Array.isArray(list)) return list;
        return list.map(patchTodo);
      });

      updateMatchingCaches('CACHE_todos.getById_', (single) => {
        if (!single || single._id !== targetId) return single;
        return patchTodo(single);
      });

      notifyCacheChanged();
      return { success: true };
    }

    case 'todos:deleteTodo': {
      const targetId = args.id || args.todoId;
      if (!targetId) break;

      updateMatchingCaches('CACHE_todos_', (list) => {
        if (!Array.isArray(list)) return list;
        // Delete target todo and any nested subtasks
        return list.filter((t: any) => t._id !== targetId && t.parentId !== targetId);
      });

      updateMatchingCaches('CACHE_todos.getSubtasks_', (list) => {
        if (!Array.isArray(list)) return list;
        return list.filter((t: any) => t._id !== targetId);
      });

      notifyCacheChanged();
      return { success: true };
    }

    case 'todos:addTaskChecklistItem': {
      const newCheck = {
        _id: tempId,
        _creationTime: Date.now(),
        todoId: args.todoId,
        userId: args.userId,
        text: args.text,
        isCompleted: false,
      };

      updateMatchingCaches('CACHE_todos.getTaskChecklists_', (list) => {
        if (!Array.isArray(list)) return [newCheck];
        return [...list.filter((i: any) => i._id !== tempId), newCheck];
      });

      notifyCacheChanged();
      return tempId;
    }

    case 'todos:toggleTaskChecklistItem': {
      updateMatchingCaches('CACHE_todos.getTaskChecklists_', (list) => {
        if (!Array.isArray(list)) return list;
        return list.map((i: any) => (i._id === args.id ? { ...i, isCompleted: !i.isCompleted } : i));
      });

      notifyCacheChanged();
      return { success: true };
    }

    case 'todos:deleteTaskChecklistItem': {
      updateMatchingCaches('CACHE_todos.getTaskChecklists_', (list) => {
        if (!Array.isArray(list)) return list;
        return list.filter((i: any) => i._id !== args.id);
      });

      notifyCacheChanged();
      return { success: true };
    }

    // ─── SPACES & CATEGORIES ───────────────────────────────────────────────────
    case 'projects:addCategory': {
      const newCat = {
        _id: tempId,
        _creationTime: Date.now(),
        ...args,
      };

      updateMatchingCaches('CACHE_projects.getCategories', (list) => {
        if (!Array.isArray(list)) return [newCat];
        return [...list.filter((c: any) => c._id !== tempId), newCat];
      });

      const getCatKey = getCacheKey('projects.getCategory', { id: tempId });
      memoryCache[getCatKey] = newCat;
      AsyncStorage.setItem(getCatKey, JSON.stringify(newCat)).catch(() => {});

      notifyCacheChanged();
      return tempId;
    }

    case 'projects:updateCategory': {
      const catId = args.id;
      updateMatchingCaches('CACHE_projects.getCategories', (list) => {
        if (!Array.isArray(list)) return list;
        return list.map((c: any) => (c._id === catId ? { ...c, ...args } : c));
      });

      updateMatchingCaches('CACHE_projects.getCategory_', (cat) => {
        if (!cat || cat._id !== catId) return cat;
        return { ...cat, ...args };
      });

      notifyCacheChanged();
      return { success: true };
    }

    case 'projects:deleteCategory': {
      const catId = args.id;
      updateMatchingCaches('CACHE_projects.getCategories', (list) => {
        if (!Array.isArray(list)) return list;
        return list.filter((c: any) => c._id !== catId);
      });

      notifyCacheChanged();
      return { success: true };
    }

    case 'projects:addSubCategory': {
      const newSub = {
        _id: tempId,
        _creationTime: Date.now(),
        ...args,
      };

      updateMatchingCaches('CACHE_projects.getSubCategories', (list) => {
        if (!Array.isArray(list)) return [newSub];
        return [...list.filter((s: any) => s._id !== tempId), newSub];
      });

      notifyCacheChanged();
      return tempId;
    }

    case 'projects:updateSubCategory': {
      const subId = args.id;
      updateMatchingCaches('CACHE_projects.getSubCategories', (list) => {
        if (!Array.isArray(list)) return list;
        return list.map((s: any) => (s._id === subId ? { ...s, ...args } : s));
      });

      notifyCacheChanged();
      return { success: true };
    }

    case 'projects:deleteSubCategory': {
      const subId = args.id;
      updateMatchingCaches('CACHE_projects.getSubCategories', (list) => {
        if (!Array.isArray(list)) return list;
        return list.filter((s: any) => s._id !== subId);
      });

      notifyCacheChanged();
      return { success: true };
    }

    // ─── PROJECTS ──────────────────────────────────────────────────────────────
    case 'projects:addProject': {
      const newProj = {
        _id: tempId,
        _creationTime: Date.now(),
        ...args,
      };

      updateMatchingCaches('CACHE_projects.getProjects', (list) => {
        if (!Array.isArray(list)) return [newProj];
        return [...list.filter((p: any) => p._id !== tempId), newProj];
      });

      const metaKey = getCacheKey('projects.getProjectMetadata', { id: tempId });
      memoryCache[metaKey] = newProj;
      AsyncStorage.setItem(metaKey, JSON.stringify(newProj)).catch(() => {});

      notifyCacheChanged();
      return tempId;
    }

    case 'projects:updateProject': {
      const projId = args.id;
      updateMatchingCaches('CACHE_projects.getProjects', (list) => {
        if (!Array.isArray(list)) return list;
        return list.map((p: any) => (p._id === projId ? { ...p, ...args } : p));
      });

      updateMatchingCaches('CACHE_projects.getProject', (p) => {
        if (!p || p._id !== projId) return p;
        return { ...p, ...args };
      });

      notifyCacheChanged();
      return { success: true };
    }

    case 'projects:deleteProject': {
      const projId = args.id;
      updateMatchingCaches('CACHE_projects.getProjects', (list) => {
        if (!Array.isArray(list)) return list;
        return list.filter((p: any) => p._id !== projId);
      });

      notifyCacheChanged();
      return { success: true };
    }

    // ─── CATEGORY & PLANNER ITEMS ──────────────────────────────────────────────
    case 'projects:addCategoryItem': {
      const newItem = {
        _id: tempId,
        _creationTime: Date.now(),
        isCompleted: false,
        isExpanded: false,
        ...args,
      };

      updateMatchingCaches('CACHE_categoryItems', (list) => {
        if (!Array.isArray(list)) return [newItem];
        return [...list.filter((i: any) => i._id !== tempId), newItem];
      });

      notifyCacheChanged();
      return tempId;
    }

    case 'projects:updateCategoryItem': {
      const itemId = args.id;
      updateMatchingCaches('CACHE_categoryItems', (list) => {
        if (!Array.isArray(list)) return list;
        return list.map((i: any) => (i._id === itemId ? { ...i, ...args } : i));
      });

      notifyCacheChanged();
      return { success: true };
    }

    case 'projects:deleteCategoryItem': {
      const itemId = args.id;
      updateMatchingCaches('CACHE_categoryItems', (list) => {
        if (!Array.isArray(list)) return list;
        return list.filter((i: any) => i._id !== itemId);
      });

      notifyCacheChanged();
      return { success: true };
    }

    case 'projects:addPlannerItem': {
      const newPlanner = {
        _id: tempId,
        _creationTime: Date.now(),
        isCompleted: false,
        ...args,
      };

      updateMatchingCaches('CACHE_plannerItems', (list) => {
        if (!Array.isArray(list)) return [newPlanner];
        return [...list.filter((i: any) => i._id !== tempId), newPlanner];
      });

      notifyCacheChanged();
      return tempId;
    }

    case 'projects:updatePlannerItem': {
      const itemId = args.id;
      updateMatchingCaches('CACHE_plannerItems', (list) => {
        if (!Array.isArray(list)) return list;
        return list.map((i: any) => (i._id === itemId ? { ...i, ...args } : i));
      });

      notifyCacheChanged();
      return { success: true };
    }

    case 'projects:deletePlannerItem': {
      const itemId = args.id;
      updateMatchingCaches('CACHE_plannerItems', (list) => {
        if (!Array.isArray(list)) return list;
        return list.filter((i: any) => i._id !== itemId);
      });

      notifyCacheChanged();
      return { success: true };
    }

    // ─── PROJECT CHECKLISTS & RESOURCES ────────────────────────────────────────
    case 'projects:addChecklistItem': {
      const newCheck = {
        _id: tempId,
        _creationTime: Date.now(),
        projectId: args.projectId,
        text: args.text,
        isCompleted: false,
      };

      updateMatchingCaches('CACHE_projects.getProjectChecklists', (list) => {
        if (!Array.isArray(list)) return [newCheck];
        return [...list.filter((i: any) => i._id !== tempId), newCheck];
      });

      notifyCacheChanged();
      return tempId;
    }

    case 'projects:toggleChecklistItem': {
      const itemId = args.id;
      updateMatchingCaches('CACHE_projects.getProjectChecklists', (list) => {
        if (!Array.isArray(list)) return list;
        return list.map((i: any) => (i._id === itemId ? { ...i, isCompleted: !i.isCompleted } : i));
      });

      notifyCacheChanged();
      return { success: true };
    }

    case 'projects:deleteChecklistItem': {
      const itemId = args.id;
      updateMatchingCaches('CACHE_projects.getProjectChecklists', (list) => {
        if (!Array.isArray(list)) return list;
        return list.filter((i: any) => i._id !== itemId);
      });

      notifyCacheChanged();
      return { success: true };
    }

    case 'projects:addResource': {
      const newRes = {
        _id: tempId,
        _creationTime: Date.now(),
        ...args,
      };

      updateMatchingCaches('CACHE_projects.getProjectResources', (list) => {
        if (!Array.isArray(list)) return [newRes];
        return [...list.filter((r: any) => r._id !== tempId), newRes];
      });

      notifyCacheChanged();
      return tempId;
    }

    case 'projects:deleteResource': {
      const resId = args.id;
      updateMatchingCaches('CACHE_projects.getProjectResources', (list) => {
        if (!Array.isArray(list)) return list;
        return list.filter((r: any) => r._id !== resId);
      });

      notifyCacheChanged();
      return { success: true };
    }

    // ─── GOALS & ACHIEVEMENTS ──────────────────────────────────────────────────
    case 'yearlyGoals:createGoal':
    case 'yearlyGoals:addGoal':
    case 'yearlyGoals:addMonthGoal':
    case 'yearlyGoals:addDayGoal': {
      const newGoal = {
        _id: tempId,
        _creationTime: Date.now(),
        isCompleted: false,
        ...args,
      };

      updateMatchingCaches('CACHE_yearlyGoals', (list) => {
        if (!Array.isArray(list)) return [newGoal];
        return [...list.filter((g: any) => g._id !== tempId), newGoal];
      });

      notifyCacheChanged();
      return tempId;
    }

    case 'yearlyGoals:updateGoal': {
      const goalId = args.id;
      updateMatchingCaches('CACHE_yearlyGoals', (list) => {
        if (!Array.isArray(list)) return list;
        return list.map((g: any) => (g._id === goalId ? { ...g, ...args } : g));
      });

      notifyCacheChanged();
      return { success: true };
    }

    case 'yearlyGoals:deleteGoal': {
      const goalId = args.id;
      updateMatchingCaches('CACHE_yearlyGoals', (list) => {
        if (!Array.isArray(list)) return list;
        return list.filter((g: any) => g._id !== goalId);
      });

      notifyCacheChanged();
      return { success: true };
    }

    case 'yearlyGoals:createAchievement':
    case 'yearlyGoals:addAchievement':
    case 'yearlyGoals:addMonthAchievement':
    case 'yearlyGoals:addDayAchievement': {
      const newAch = {
        _id: tempId,
        _creationTime: Date.now(),
        isCompleted: false,
        ...args,
      };

      updateMatchingCaches('CACHE_yearlyAchievements', (list) => {
        if (!Array.isArray(list)) return [newAch];
        return [...list.filter((a: any) => a._id !== tempId), newAch];
      });

      notifyCacheChanged();
      return tempId;
    }

    case 'yearlyGoals:updateAchievement': {
      const achId = args.id;
      updateMatchingCaches('CACHE_yearlyAchievements', (list) => {
        if (!Array.isArray(list)) return list;
        return list.map((a: any) => (a._id === achId ? { ...a, ...args } : a));
      });

      notifyCacheChanged();
      return { success: true };
    }

    case 'yearlyGoals:deleteAchievement': {
      const achId = args.id;
      updateMatchingCaches('CACHE_yearlyAchievements', (list) => {
        if (!Array.isArray(list)) return list;
        return list.filter((a: any) => a._id !== achId);
      });

      notifyCacheChanged();
      return { success: true };
    }

    // ─── AUTH / SETTINGS ───────────────────────────────────────────────────────
    case 'auth:updateSettings': {
      updateMatchingCaches('CACHE_auth.getUserSettings', (settings) => {
        if (!settings) return args;
        return { ...settings, ...args };
      });

      notifyCacheChanged();
      return { success: true };
    }

    default: {
      notifyCacheChanged();
      return tempId;
    }
  }

  return tempId;
};
