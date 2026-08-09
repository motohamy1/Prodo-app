import { useEffect, useRef } from 'react';
import { useConvex } from 'convex/react';
import NetInfo from '@react-native-community/netinfo';
import { getMutationQueue, clearMutationQueue, setMutationQueue } from '@/utils/offlineStorage';
import { api } from '@/convex/_generated/api';

const apiAny = api as any;

const mutationMap: Record<string, any> = {
  // Todos
  "todos:addTodo": apiAny.todos.addTodo,
  "todos:updateTodo": apiAny.todos.updateTodo,
  "todos:updateStatus": apiAny.todos.updateStatus,
  "todos:deleteTodo": apiAny.todos.deleteTodo,
  "todos:setTimer": apiAny.todos.setTimer,
  "todos:startTimer": apiAny.todos.startTimer,
  "todos:pauseTimer": apiAny.todos.pauseTimer,
  "todos:startSubtaskTimer": apiAny.todos.startSubtaskTimer,
  "todos:pauseSubtaskTimer": apiAny.todos.pauseSubtaskTimer,
  "todos:linkProject": apiAny.todos.linkProject,
  "todos:linkTask": apiAny.todos.linkTask,
   
  // Projects
  "projects:addProject": apiAny.projects.addProject || apiAny.projects?.add,
  "projects:deleteProject": apiAny.projects.deleteProject,
  
  // Auth
  "auth:updateSettings": apiAny.auth.updateSettings,
};

export function useSyncManager() {
  const convex = useConvex();
  const isSyncing = useRef(false);

  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      if (state.isConnected && !isSyncing.current) {
        processQueue();
      }
    });
    // Check on initial mount
    NetInfo.fetch().then(state => {
        if (state.isConnected) processQueue();
    });
    return unsub;
  }, [convex]);


  const processQueue = async () => {
    isSyncing.current = true;
    try {
      const queue = await getMutationQueue();
      if (queue.length === 0) {
        isSyncing.current = false;
        return;
      }

      console.log('Syncing offline mutations. Total:', queue.length);
      const remainingQueue = [];
      
      for (const item of queue) {
        const mutationFn = mutationMap[item.mutationPath];
        if (mutationFn) {
          try {
             await convex.mutation(mutationFn, item.args);
             console.log(`Successfully synced mutation ${item.mutationPath}`);
          } catch (err) {
             console.warn(`Failed to sync mutation ${item.mutationPath}`, err);
             
             // Increment retry count
             item.retryCount = (item.retryCount || 0) + 1;
             
             if (item.retryCount <= 5) {
               remainingQueue.push(item);
             } else {
               console.warn(`Dropping mutation ${item.mutationPath} after 5 failed retries.`);
             }
             
             // Stop processing remaining items if we suspect a network issue
             // By checking if we are still connected
             const state = await NetInfo.fetch();
             if (!state.isConnected) {
               console.warn('Network lost during sync. Aborting queue processing.');
               // Add the rest of the queue to remaining
               remainingQueue.push(...queue.slice(queue.indexOf(item) + 1));
               break;
             }
          }
        } else {
             console.warn(`No matching convex function found for ${item.mutationPath}, dropping.`);
        }
      }
      
      if (remainingQueue.length === 0) {
        await clearMutationQueue();
        console.log('Sync complete, queue cleared!');
      } else {
        await setMutationQueue(remainingQueue);
        console.log(`Sync paused, ${remainingQueue.length} items remaining in queue.`);
      }
    } catch (err) {
      console.error('Error during sync processing', err);
    } finally {
      isSyncing.current = false;
    }
  };
}
