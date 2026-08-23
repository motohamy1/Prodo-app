import NetInfo from '@react-native-community/netinfo';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import conflictResolver, { Conflict, ConflictResolution } from './conflictResolution';
import localDatabase, { LocalProject, LocalTodo } from './localDatabase';

const BACKGROUND_SYNC_TASK = 'background-sync';

// Sync task configuration
export interface SyncConfig {
  interval: number; // in milliseconds
  batchSize: number;
  retryAttempts: number;
  conflictResolution: 'local' | 'remote' | 'manual';
}

class PeriodicSyncManager {
  private static instance: PeriodicSyncManager;
  private isInitialized = false;
  private isSyncing = false;
  private syncConfig: SyncConfig = {
    interval: 15 * 60 * 1000, // 15 minutes
    batchSize: 50,
    retryAttempts: 3,
    conflictResolution: 'local'
  };

  static getInstance(): PeriodicSyncManager {
    if (!PeriodicSyncManager.instance) {
      PeriodicSyncManager.instance = new PeriodicSyncManager();
    }
    return PeriodicSyncManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Configure background fetch
      await BackgroundFetch.setMinimumIntervalAsync(this.syncConfig.interval);
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: this.syncConfig.interval,
        stopOnTerminate: false,
        startOnBoot: true,
      });

      this.isInitialized = true;
      console.log('Periodic sync manager initialized');
    } catch (error) {
      console.error('Failed to initialize periodic sync manager:', error);
    }
  }

  // Background sync task handler
  public async handleBackgroundSync(): Promise<BackgroundFetch.BackgroundFetchResult> {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    try {
      this.isSyncing = true;
      console.log('Starting background sync...');

      // Check network connectivity
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
        console.log('No network connection, skipping sync');
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      // Get current user (this would need to be stored securely)
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.log('No user found, skipping sync');
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      await this.performSync(userId);
      
      console.log('Background sync completed');
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
      console.error('Background sync failed:', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    } finally {
      this.isSyncing = false;
    }
  }

  // Manual sync trigger
  async triggerManualSync(userId: string): Promise<boolean> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return false;
    }

    try {
      this.isSyncing = true;
      console.log('Starting manual sync...');

      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
        console.log('No network connection');
        return false;
      }

      await this.performSync(userId);
      console.log('Manual sync completed');
      return true;
    } catch (error) {
      console.error('Manual sync failed:', error);
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  // Core sync logic
  private async performSync(userId: string): Promise<void> {
    const pendingChanges = await localDatabase.getPendingChanges(userId);
    
    // Sync todos
    if (pendingChanges.todos.length > 0) {
      await this.syncTodos(userId, pendingChanges.todos);
    }

    // Sync projects
    if (pendingChanges.projects.length > 0) {
      await this.syncProjects(userId, pendingChanges.projects);
    }

    // Fetch remote changes
    await this.fetchRemoteChanges(userId);

    // Update sync metadata
    await localDatabase.updateSyncMetadata(userId, {
      lastIncrementalSync: Date.now(),
      pendingChanges: []
    });
  }

  // Sync todos to remote
  private async syncTodos(userId: string, todos: LocalTodo[]): Promise<void> {
    // This would need to be called with a Convex client
    // For now, we'll implement the structure
    console.log(`Syncing ${todos.length} todos to remote`);
    
    // Batch process todos
    for (let i = 0; i < todos.length; i += this.syncConfig.batchSize) {
      const batch = todos.slice(i, i + this.syncConfig.batchSize);
      
      for (const todo of batch) {
        try {
          await this.syncTodoToRemote(todo);
        } catch (error) {
          console.error(`Failed to sync todo ${todo._id}:`, error);
          // Could implement retry logic here
        }
      }
    }
  }

  // Sync individual todo to remote
  private async syncTodoToRemote(todo: LocalTodo): Promise<void> {
    // This would use the Convex client to sync
    // For now, we'll mark as if synced
    console.log(`Syncing todo: ${todo.text}`);
    
    // In a real implementation, this would:
    // 1. Check if todo exists remotely
    // 2. Handle conflicts based on version/timestamp
    // 3. Create, update, or delete the remote todo
    // 4. Update local todo with remote ID and sync timestamp
  }

  // Sync projects to remote
  private async syncProjects(userId: string, projects: LocalProject[]): Promise<void> {
    console.log(`Syncing ${projects.length} projects to remote`);
    
    for (let i = 0; i < projects.length; i += this.syncConfig.batchSize) {
      const batch = projects.slice(i, i + this.syncConfig.batchSize);
      
      for (const project of batch) {
        try {
          await this.syncProjectToRemote(project);
        } catch (error) {
          console.error(`Failed to sync project ${project._id}:`, error);
        }
      }
    }
  }

  // Sync individual project to remote
  private async syncProjectToRemote(project: LocalProject): Promise<void> {
    console.log(`Syncing project: ${project.name}`);
    // Similar to todo sync, would use Convex client
  }

  // Fetch remote changes
  private async fetchRemoteChanges(userId: string): Promise<void> {
    console.log('Fetching remote changes...');
    
    const metadata = await localDatabase.getSyncMetadata(userId);
    const lastSync = Math.max(metadata.lastFullSync, metadata.lastIncrementalSync);
    
    // Get local data for conflict detection
    const localTodos = await localDatabase.getTodos(userId);
    const localProjects = await localDatabase.getProjects(userId);
    
    // In a real implementation, this would fetch remote data
    const remoteTodos: LocalTodo[] = []; // Would fetch from Convex
    const remoteProjects: LocalProject[] = []; // Would fetch from Convex
    
    // Detect and resolve conflicts
    const todoConflicts = conflictResolver.detectConflicts(localTodos, remoteTodos);
    const projectConflicts = conflictResolver.detectConflicts(localProjects, remoteProjects);
    
    if (todoConflicts.length > 0 || projectConflicts.length > 0) {
      console.log(`Found ${todoConflicts.length + projectConflicts.length} conflicts`);
      await this.resolveConflicts(userId, todoConflicts, projectConflicts);
    }
    
    // Apply resolved changes to local database
    await this.applyRemoteChanges(userId, remoteTodos, remoteProjects);
  }

  // Resolve conflicts based on configuration
  private async resolveConflicts(
    userId: string, 
    todoConflicts: Conflict<LocalTodo>[], 
    projectConflicts: Conflict<LocalProject>[]
  ): Promise<void> {
    const allConflicts = [...todoConflicts, ...projectConflicts];
    
    if (allConflicts.length === 0) return;

    let resolutions: ConflictResolution[];

    if (this.syncConfig.conflictResolution === 'manual') {
      // For manual resolution, we'd need to trigger UI
      // For now, fall back to auto-resolution
      resolutions = conflictResolver.autoResolveConflicts(allConflicts as any, 'latest');
    } else {
      resolutions = conflictResolver.autoResolveConflicts(allConflicts as any, this.syncConfig.conflictResolution);
    }

    await this.applyConflictResolutions(userId, resolutions);
  }

  // Apply conflict resolutions
  private async applyConflictResolutions(userId: string, resolutions: ConflictResolution[]): Promise<void> {
    for (const resolution of resolutions) {
      try {
        if (!resolution.resolvedData) continue;

        if (resolution.resolution === 'merge' || resolution.resolution === 'local') {
          // Update local with resolved data
          if ('text' in resolution.resolvedData) {
            await localDatabase.updateTodo(userId, resolution.conflictId, resolution.resolvedData as LocalTodo);
          } else if ('name' in resolution.resolvedData) {
            // Handle project updates
            console.log(`Updating project ${resolution.conflictId} with resolved data`);
          }
        }
        // If resolution is 'remote', local data stays as is and will be overwritten in fetchRemoteChanges
      } catch (error) {
        console.error(`Failed to apply resolution for conflict ${resolution.conflictId}:`, error);
      }
    }
  }

  // Apply remote changes to local database
  private async applyRemoteChanges(
    userId: string, 
    remoteTodos: LocalTodo[], 
    remoteProjects: LocalProject[]
  ): Promise<void> {
    try {
      // Update todos
      for (const remoteTodo of remoteTodos) {
        const existing = await localDatabase.getTodoById(userId, remoteTodo._id);
        if (existing) {
          await localDatabase.updateTodo(userId, remoteTodo._id, remoteTodo);
        } else {
          await localDatabase.saveTodo(userId, remoteTodo);
        }
      }

      // Update projects (similar logic)
      console.log(`Applied ${remoteTodos.length} remote todo changes`);
    } catch (error) {
      console.error('Failed to apply remote changes:', error);
    }
  }

  // Get current user ID (this would need to be implemented based on auth)
  private async getCurrentUserId(): Promise<string | null> {
    try {
      // This would get the current user from secure storage or auth context
      // For now, return null to indicate it needs implementation
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Update sync configuration
  updateConfig(config: Partial<SyncConfig>): void {
    this.syncConfig = { ...this.syncConfig, ...config };
  }

  // Get sync status
  async getSyncStatus(userId: string): Promise<{
    isOnline: boolean;
    isSyncing: boolean;
    lastSync: number;
    pendingChanges: number;
  }> {
    const networkState = await NetInfo.fetch();
    const metadata = await localDatabase.getSyncMetadata(userId);
    const pendingChanges = await localDatabase.getPendingChanges(userId);
    
    return {
      isOnline: !!networkState.isConnected,
      isSyncing: this.isSyncing,
      lastSync: Math.max(metadata.lastFullSync, metadata.lastIncrementalSync),
      pendingChanges: pendingChanges.todos.length + pendingChanges.projects.length
    };
  }

  // Cleanup
  async cleanup(): Promise<void> {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
      this.isInitialized = false;
      console.log('Periodic sync manager cleaned up');
    } catch (error) {
      console.error('Error cleaning up periodic sync manager:', error);
    }
  }
}

const syncManager = PeriodicSyncManager.getInstance();

// Background tasks must be defined in the global scope
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  return await syncManager.handleBackgroundSync();
});

export default syncManager;
