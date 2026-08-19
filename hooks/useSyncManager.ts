import { api } from '@/convex/_generated/api';
import { clearMutationQueue, getMutationQueue, setMutationQueue } from '@/utils/offlineStorage';
import NetInfo from '@react-native-community/netinfo';
import { useConvex } from 'convex/react';
import { useEffect, useRef } from 'react';

const apiAny = api as any;

const mutationMap: Record<string, any> = {
  // Todos
  'todos:addTodo': apiAny.todos.addTodo,
  'todos:updateTodo': apiAny.todos.updateTodo,
  'todos:updateStatus': apiAny.todos.updateStatus,
  'todos:deleteTodo': apiAny.todos.deleteTodo,
  'todos:setTimer': apiAny.todos.setTimer,
  'todos:startTimer': apiAny.todos.startTimer,
  'todos:pauseTimer': apiAny.todos.pauseTimer,
  'todos:startSubtaskTimer': apiAny.todos.startSubtaskTimer,
  'todos:pauseSubtaskTimer': apiAny.todos.pauseSubtaskTimer,
  'todos:resetTimer': apiAny.todos.resetTimer,
  'todos:removeTimer': apiAny.todos.removeTimer,
  'todos:linkProject': apiAny.todos.linkProject,
  'todos:linkTask': apiAny.todos.linkTask,

  // Task Checklists
  'todos:addTaskChecklistItem': apiAny.todos.addTaskChecklistItem,
  'todos:toggleTaskChecklistItem': apiAny.todos.toggleTaskChecklistItem,
  'todos:deleteTaskChecklistItem': apiAny.todos.deleteTaskChecklistItem,

  // Spaces / Categories
  'projects:addCategory': apiAny.projects.addCategory,
  'projects:updateCategory': apiAny.projects.updateCategory,
  'projects:deleteCategory': apiAny.projects.deleteCategory,
  'projects:addSubCategory': apiAny.projects.addSubCategory,
  'projects:updateSubCategory': apiAny.projects.updateSubCategory,
  'projects:deleteSubCategory': apiAny.projects.deleteSubCategory,

  // Projects
  'projects:addProject': apiAny.projects.addProject,
  'projects:updateProject': apiAny.projects.updateProject,
  'projects:deleteProject': apiAny.projects.deleteProject,

  // Category Items & Planner Items
  'projects:addCategoryItem': apiAny.projects.addCategoryItem,
  'projects:updateCategoryItem': apiAny.projects.updateCategoryItem,
  'projects:deleteCategoryItem': apiAny.projects.deleteCategoryItem,
  'projects:addPlannerItem': apiAny.projects.addPlannerItem,
  'projects:updatePlannerItem': apiAny.projects.updatePlannerItem,
  'projects:deletePlannerItem': apiAny.projects.deletePlannerItem,

  // Project Checklists & Resources
  'projects:addChecklistItem': apiAny.projects.addChecklistItem,
  'projects:toggleChecklistItem': apiAny.projects.toggleChecklistItem,
  'projects:deleteChecklistItem': apiAny.projects.deleteChecklistItem,
  'projects:addResource': apiAny.projects.addResource,
  'projects:deleteResource': apiAny.projects.deleteResource,

  // Goals & Achievements
  'yearlyGoals:createGoal': apiAny.yearlyGoals.createGoal || apiAny.yearlyGoals.addGoal,
  'yearlyGoals:addGoal': apiAny.yearlyGoals.addGoal || apiAny.yearlyGoals.createGoal,
  'yearlyGoals:addMonthGoal': apiAny.yearlyGoals.addMonthGoal,
  'yearlyGoals:addDayGoal': apiAny.yearlyGoals.addDayGoal,
  'yearlyGoals:updateGoal': apiAny.yearlyGoals.updateGoal,
  'yearlyGoals:deleteGoal': apiAny.yearlyGoals.deleteGoal,
  'yearlyGoals:createAchievement': apiAny.yearlyGoals.createAchievement || apiAny.yearlyGoals.addAchievement,
  'yearlyGoals:addAchievement': apiAny.yearlyGoals.addAchievement || apiAny.yearlyGoals.createAchievement,
  'yearlyGoals:addMonthAchievement': apiAny.yearlyGoals.addMonthAchievement,
  'yearlyGoals:addDayAchievement': apiAny.yearlyGoals.addDayAchievement,
  'yearlyGoals:updateAchievement': apiAny.yearlyGoals.updateAchievement,
  'yearlyGoals:deleteAchievement': apiAny.yearlyGoals.deleteAchievement,

  // Auth / Settings
  'auth:updateSettings': apiAny.auth.updateSettings,
};

export function useSyncManager() {
  const convex = useConvex();
  const isSyncing = useRef(false);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected && !isSyncing.current) {
        processQueue();
      }
    });

    // Check on initial mount
    NetInfo.fetch().then((state) => {
      if (state.isConnected && !isSyncing.current) processQueue();
    });

    return unsub;
  }, [convex]);

  const remapArgs = (args: any, idMap: Record<string, string>): any => {
    if (!args || typeof args !== 'object') return args;
    const remapped = { ...args };

    ['id', 'todoId', 'parentId', 'categoryId', 'subCategoryId', 'projectId'].forEach((field) => {
      if (remapped[field] && typeof remapped[field] === 'string' && idMap[remapped[field]]) {
        remapped[field] = idMap[remapped[field]];
      }
    });

    return remapped;
  };

  const processQueue = async () => {
    if (isSyncing.current) return;
    isSyncing.current = true;

    try {
      const queue = await getMutationQueue();
      if (queue.length === 0) {
        isSyncing.current = false;
        return;
      }

      console.log('Syncing offline mutations. Total items:', queue.length);
      const remainingQueue = [];
      const idMap: Record<string, string> = {};

      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        const mutationFn = mutationMap[item.mutationPath];

        if (mutationFn) {
          try {
            // Remap any temp IDs to real server IDs from previous creation steps
            const preparedArgs = remapArgs(item.args, idMap);

            const result = await convex.mutation(mutationFn, preparedArgs);
            console.log(`Successfully synced mutation: ${item.mutationPath}`);

            // If this mutation created a new document and returned a server ID, map it
            if (item.tempId && (typeof result === 'string' || result?._id)) {
              const serverId = typeof result === 'string' ? result : result._id;
              idMap[item.tempId] = serverId;
            }
          } catch (err: any) {
            console.warn(`Failed to sync mutation ${item.mutationPath}`, err);

            item.retryCount = (item.retryCount || 0) + 1;

            if (item.retryCount <= 5) {
              remainingQueue.push(item);
            } else {
              console.warn(`Dropping mutation ${item.mutationPath} after exceeding retry limit.`);
            }

            // Check if network is still connected
            const state = await NetInfo.fetch();
            if (!state.isConnected) {
              console.warn('Network lost during sync. Pausing queue processing.');
              remainingQueue.push(...queue.slice(i + 1));
              break;
            }
          }
        } else {
          console.warn(`No matching convex function found for ${item.mutationPath}, dropping.`);
        }
      }

      if (remainingQueue.length === 0) {
        await clearMutationQueue();
        console.log('Sync complete, mutation queue cleared!');
      } else {
        await setMutationQueue(remainingQueue);
        console.log(`Sync paused, ${remainingQueue.length} items remaining in queue.`);
      }
    } catch (err) {
      console.error('Error during offline sync processing', err);
    } finally {
      isSyncing.current = false;
    }
  };
}
