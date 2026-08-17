import { useEffect, useState, useCallback, useRef } from 'react';
import localDatabase, { LocalTodo, LocalProject } from '@/utils/localDatabase';
import periodicSyncManager from '@/utils/periodicSyncManager';
import { useAuth } from './useAuth';
import NetInfo from '@react-native-community/netinfo';

// Generic hook for offline-first data
export function useOfflineFirstData<T>(
  dataType: 'todos' | 'projects',
  userId: string | null
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const { user } = useAuth();
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch data from local storage
  const fetchLocalData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      let localData: T[] = [];
      if (dataType === 'todos') {
        localData = (await localDatabase.getTodos(userId)) as unknown as T[];
      } else if (dataType === 'projects') {
        localData = (await localDatabase.getProjects(userId)) as unknown as T[];
      }

      setData(localData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [dataType, userId]);

  // Trigger sync when online
  const triggerSync = useCallback(async () => {
    if (!userId || !isOnline) return;

    try {
      await periodicSyncManager.triggerManualSync(userId);
      // Refetch data after sync
      await fetchLocalData();
    } catch (err) {
      console.error('Sync failed:', err);
    }
  }, [userId, isOnline, fetchLocalData]);

  // Network status monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = !!state.isConnected;
      setIsOnline(online);

      // Trigger sync when coming online
      if (online && userId) {
        // Debounce sync to avoid multiple calls
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
        syncTimeoutRef.current = setTimeout(triggerSync, 1000);
      }
    });

    // Initial network check
    NetInfo.fetch().then(state => {
      setIsOnline(!!state.isConnected);
    });

    return () => {
      unsubscribe();
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [userId, triggerSync]);

  // Initial data fetch
  useEffect(() => {
    if (userId) {
      fetchLocalData();
    }
  }, [userId, fetchLocalData]);

  // Auto-sync interval when online
  useEffect(() => {
    if (!userId || !isOnline) return;

    const interval = setInterval(() => {
      triggerSync();
    }, 5 * 60 * 1000); // Sync every 5 minutes when online

    return () => clearInterval(interval);
  }, [userId, isOnline, triggerSync]);

  return {
    data,
    loading,
    error,
    isOnline,
    refetch: fetchLocalData,
    sync: triggerSync
  };
}

// Specific hook for todos
export function useOfflineFirstTodos(userId: string | null) {
  const { data: todos, ...rest } = useOfflineFirstData<LocalTodo>('todos', userId);

  // Todo-specific mutations
  const addTodo = useCallback(async (todoData: Omit<LocalTodo, '_id' | 'createdAt' | 'updatedAt' | '_version'>) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const newTodo = await localDatabase.saveTodo(userId, todoData);
      
      // Update local state immediately
      rest.refetch();
      
      // Trigger sync if online
      if (rest.isOnline) {
        periodicSyncManager.triggerManualSync(userId);
      }
      
      return newTodo;
    } catch (error) {
      console.error('Failed to add todo:', error);
      throw error;
    }
  }, [userId, rest.isOnline, rest.refetch]);

  const updateTodo = useCallback(async (todoId: string, updates: Partial<LocalTodo>) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const updatedTodo = await localDatabase.updateTodo(userId, todoId, updates);
      
      // Update local state immediately
      rest.refetch();
      
      // Trigger sync if online
      if (rest.isOnline) {
        periodicSyncManager.triggerManualSync(userId);
      }
      
      return updatedTodo;
    } catch (error) {
      console.error('Failed to update todo:', error);
      throw error;
    }
  }, [userId, rest.isOnline, rest.refetch]);

  const deleteTodo = useCallback(async (todoId: string) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const success = await localDatabase.deleteTodo(userId, todoId);
      
      // Update local state immediately
      rest.refetch();
      
      // Trigger sync if online
      if (rest.isOnline) {
        periodicSyncManager.triggerManualSync(userId);
      }
      
      return success;
    } catch (error) {
      console.error('Failed to delete todo:', error);
      throw error;
    }
  }, [userId, rest.isOnline, rest.refetch]);

  const getTodoById = useCallback(async (todoId: string) => {
    if (!userId) return null;
    return await localDatabase.getTodoById(userId, todoId);
  }, [userId]);

  return {
    todos,
    addTodo,
    updateTodo,
    deleteTodo,
    getTodoById,
    ...rest
  };
}

// Specific hook for projects
export function useOfflineFirstProjects(userId: string | null) {
  const { data: projects, ...rest } = useOfflineFirstData<LocalProject>('projects', userId);

  const addProject = useCallback(async (projectData: Omit<LocalProject, '_id' | 'createdAt' | 'updatedAt' | '_version'>) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const newProject = await localDatabase.saveProject(userId, projectData);
      
      // Update local state immediately
      rest.refetch();
      
      // Trigger sync if online
      if (rest.isOnline) {
        periodicSyncManager.triggerManualSync(userId);
      }
      
      return newProject;
    } catch (error) {
      console.error('Failed to add project:', error);
      throw error;
    }
  }, [userId, rest.isOnline, rest.refetch]);

  return {
    projects,
    addProject,
    ...rest
  };
}

// Hook for sync status
export function useSyncStatus(userId: string | null) {
  const [syncStatus, setSyncStatus] = useState({
    isOnline: false,
    isSyncing: false,
    lastSync: 0,
    pendingChanges: 0
  });

  const updateStatus = useCallback(async () => {
    if (!userId) return;

    try {
      const status = await periodicSyncManager.getSyncStatus(userId);
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to get sync status:', error);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      updateStatus();
      
      // Update status every 30 seconds
      const interval = setInterval(updateStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [userId, updateStatus]);

  return {
    ...syncStatus,
    updateStatus,
    triggerSync: () => userId ? periodicSyncManager.triggerManualSync(userId) : Promise.resolve(false)
  };
}
