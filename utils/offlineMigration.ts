import localDatabase, { LocalProject, LocalTodo } from './localDatabase';
import { getCachedQuery } from './offlineStorage';

export interface MigrationResult {
  success: boolean;
  todosMigrated: number;
  projectsMigrated: number;
  errors: string[];
}

class OfflineMigration {
  private static instance: OfflineMigration;

  static getInstance(): OfflineMigration {
    if (!OfflineMigration.instance) {
      OfflineMigration.instance = new OfflineMigration();
    }
    return OfflineMigration.instance;
  }

  // Check if migration is needed
  async isMigrationNeeded(userId: string): Promise<boolean> {
    try {
      // Check if user has local data
      const localTodos = await localDatabase.getTodos(userId);
      const localProjects = await localDatabase.getProjects(userId);
      
      // Check if user has cached data from old system
      const cachedTodos = await getCachedQuery('todos.get', { userId });
      const cachedProjects = await getCachedQuery('projects.get', { userId });
      
      // Migration needed if there's cached data but no local data
      return ((cachedTodos && cachedTodos.length > 0) || 
              (cachedProjects && cachedProjects.length > 0)) && 
             (localTodos.length === 0 && localProjects.length === 0);
    } catch (error) {
      console.error('Error checking migration status:', error);
      return false;
    }
  }

  // Perform migration from cached data to local database
  async migrateFromCache(userId: string): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      todosMigrated: 0,
      projectsMigrated: 0,
      errors: []
    };

    try {
      console.log('Starting migration from cache to local database...');

      // Migrate todos
      const todosResult = await this.migrateTodos(userId);
      result.todosMigrated = todosResult.count;
      result.errors.push(...todosResult.errors);

      // Migrate projects
      const projectsResult = await this.migrateProjects(userId);
      result.projectsMigrated = projectsResult.count;
      result.errors.push(...projectsResult.errors);

      // Clear old cache after successful migration
      if (result.errors.length === 0) {
        await this.clearOldCache(userId);
        result.success = true;
        console.log('Migration completed successfully');
      } else {
        console.error('Migration completed with errors:', result.errors);
      }

      return result;
    } catch (error) {
      console.error('Migration failed:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown migration error');
      return result;
    }
  }

  // Migrate todos from cache
  private async migrateTodos(userId: string): Promise<{ count: number; errors: string[] }> {
    const result: { count: number; errors: string[] } = { count: 0, errors: [] };

    try {
      const cachedTodos = await getCachedQuery('todos.get', { userId });
      
      if (!cachedTodos || !Array.isArray(cachedTodos)) {
        return result;
      }

      console.log(`Migrating ${cachedTodos.length} todos...`);

      for (const cachedTodo of cachedTodos) {
        try {
          const localTodo: Omit<LocalTodo, '_id' | 'createdAt' | 'updatedAt' | '_version'> = {
            userId: cachedTodo.userId || userId,
            text: cachedTodo.text || '',
            status: cachedTodo.status || 'not_started',
            timerDuration: cachedTodo.timerDuration,
            timerDirection: cachedTodo.timerDirection,
            timerStartTime: cachedTodo.timerStartTime,
            timerFirstStartTime: cachedTodo.timerFirstStartTime,
            timeLeftAtPause: cachedTodo.timeLeftAtPause,
            dueDate: cachedTodo.dueDate,
            date: cachedTodo.date,
            projectId: cachedTodo.projectId,
            parentId: cachedTodo.parentId,
            description: cachedTodo.description,
            location: cachedTodo.location,
            meetingLink: cachedTodo.meetingLink,
            priority: cachedTodo.priority,
            categoryId: cachedTodo.categoryId,
            subCategoryId: cachedTodo.subCategoryId,
            type: cachedTodo.type,
            completedAt: cachedTodo.completedAt,
            lastSyncAt: cachedTodo._creationTime || Date.now(), // Use Convex creation time as last sync
            isDeleted: false
          };

          await localDatabase.saveTodo(userId, localTodo);
          result.count++;
        } catch (error) {
          const errorMsg = `Failed to migrate todo ${cachedTodo._id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      console.log(`Successfully migrated ${result.count} todos`);
      return result;
    } catch (error) {
      result.errors.push(`Failed to migrate todos: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  // Migrate projects from cache
  private async migrateProjects(userId: string): Promise<{ count: number; errors: string[] }> {
    const result: { count: number; errors: string[] } = { count: 0, errors: [] };

    try {
      const cachedProjects = await getCachedQuery('projects.get', { userId });
      
      if (!cachedProjects || !Array.isArray(cachedProjects)) {
        return result;
      }

      console.log(`Migrating ${cachedProjects.length} projects...`);

      for (const cachedProject of cachedProjects) {
        try {
          const localProject: Omit<LocalProject, '_id' | 'createdAt' | 'updatedAt' | '_version'> = {
            userId: cachedProject.userId || userId,
            name: cachedProject.name || '',
            description: cachedProject.description,
            color: cachedProject.color,
            lastSyncAt: cachedProject._creationTime || Date.now(),
            isDeleted: false
          };

          await localDatabase.saveProject(userId, localProject);
          result.count++;
        } catch (error) {
          const errorMsg = `Failed to migrate project ${cachedProject._id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      console.log(`Successfully migrated ${result.count} projects`);
      return result;
    } catch (error) {
      result.errors.push(`Failed to migrate projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  // Clear old cache after migration
  private async clearOldCache(userId: string): Promise<void> {
    try {
      import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
        const keysToRemove = [
          `CACHE_todos_get_${JSON.stringify({ userId })}`,
          `CACHE_projects_get_${JSON.stringify({ userId })}`,
          // Add other cache keys as needed
        ];

        AsyncStorage.multiRemove(keysToRemove).catch(error => {
          console.warn('Failed to clear old cache:', error);
        });
      });

      console.log('Old cache cleared successfully');
    } catch (error) {
      console.warn('Failed to clear old cache:', error);
    }
  }

  // Force re-migration (for testing or recovery)
  async forceRemigration(userId: string): Promise<MigrationResult> {
    try {
      // Clear local data
      await localDatabase.clearAllData(userId);
      
      // Perform migration
      return await this.migrateFromCache(userId);
    } catch (error) {
      return {
        success: false,
        todosMigrated: 0,
        projectsMigrated: 0,
        errors: [error instanceof Error ? error.message : 'Force re-migration failed']
      };
    }
  }

  // Get migration status
  async getMigrationStatus(userId: string): Promise<{
    needsMigration: boolean;
    localTodos: number;
    localProjects: number;
    cachedTodos: number;
    cachedProjects: number;
  }> {
    try {
      const localTodos = await localDatabase.getTodos(userId);
      const localProjects = await localDatabase.getProjects(userId);
      const cachedTodos = await getCachedQuery('todos.get', { userId });
      const cachedProjects = await getCachedQuery('projects.get', { userId });

      return {
        needsMigration: await this.isMigrationNeeded(userId),
        localTodos: localTodos.length,
        localProjects: localProjects.length,
        cachedTodos: (cachedTodos && Array.isArray(cachedTodos)) ? cachedTodos.length : 0,
        cachedProjects: (cachedProjects && Array.isArray(cachedProjects)) ? cachedProjects.length : 0
      };
    } catch (error) {
      console.error('Error getting migration status:', error);
      return {
        needsMigration: false,
        localTodos: 0,
        localProjects: 0,
        cachedTodos: 0,
        cachedProjects: 0
      };
    }
  }
}

export default OfflineMigration.getInstance();
