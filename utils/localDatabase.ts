import AsyncStorage from '@react-native-async-storage/async-storage';

const generateId = () => `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 11)}`;

// Types for local storage
export interface LocalTodo {
  _id: string;
  userId: string;
  text: string;
  status: 'not_started' | 'not_done' | 'in_progress' | 'paused' | 'done';
  timerDuration?: number;
  timerDirection?: string;
  timerStartTime?: number;
  timerFirstStartTime?: number;
  timeLeftAtPause?: number;
  dueDate?: number;
  date?: number;
  projectId?: string;
  parentId?: string;
  description?: string;
  location?: string;
  meetingLink?: string;
  priority?: string;
  categoryId?: string;
  subCategoryId?: string;
  type?: string;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
  lastSyncAt?: number;
  isDeleted: boolean;
  _version: number;
}

export interface LocalProject {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: number;
  updatedAt: number;
  lastSyncAt?: number;
  isDeleted: boolean;
  _version: number;
}

export interface SyncMetadata {
  lastFullSync: number;
  lastIncrementalSync: number;
  pendingChanges: string[];
  conflictResolution: 'local' | 'remote' | 'manual';
}

class LocalDatabase {
  private static instance: LocalDatabase;
  private readonly TODOS_KEY = 'LOCAL_TODOS';
  private readonly PROJECTS_KEY = 'LOCAL_PROJECTS';
  private readonly SYNC_METADATA_KEY = 'SYNC_METADATA';
  private readonly USER_PREFIX = 'USER_';

  static getInstance(): LocalDatabase {
    if (!LocalDatabase.instance) {
      LocalDatabase.instance = new LocalDatabase();
    }
    return LocalDatabase.instance;
  }

  // User-specific keys
  private getUserKey(key: string, userId: string): string {
    return `${this.USER_PREFIX}${userId}_${key}`;
  }

  // Todo operations
  async getTodos(userId: string): Promise<LocalTodo[]> {
    try {
      const key = this.getUserKey(this.TODOS_KEY, userId);
      const todosJson = await AsyncStorage.getItem(key);
      const todos = todosJson ? JSON.parse(todosJson) : [];
      return todos.filter((todo: LocalTodo) => !todo.isDeleted);
    } catch (error) {
      console.error('Error getting todos:', error);
      return [];
    }
  }

  async getTodoById(userId: string, todoId: string): Promise<LocalTodo | null> {
    try {
      const todos = await this.getTodos(userId);
      return todos.find(todo => todo._id === todoId) || null;
    } catch (error) {
      console.error('Error getting todo by id:', error);
      return null;
    }
  }

  async saveTodo(userId: string, todo: Omit<LocalTodo, '_id' | 'createdAt' | 'updatedAt' | '_version'>): Promise<LocalTodo> {
    try {
      const todos = await this.getTodos(userId);
      const newTodo: LocalTodo = {
        ...todo,
        _id: generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        _version: 1,
        isDeleted: false
      };

      todos.push(newTodo);
      const key = this.getUserKey(this.TODOS_KEY, userId);
      await AsyncStorage.setItem(key, JSON.stringify(todos));
      
      return newTodo;
    } catch (error) {
      console.error('Error saving todo:', error);
      throw error;
    }
  }

  async updateTodo(userId: string, todoId: string, updates: Partial<LocalTodo>): Promise<LocalTodo | null> {
    try {
      const todos = await this.getTodos(userId);
      const todoIndex = todos.findIndex(todo => todo._id === todoId);
      
      if (todoIndex === -1) return null;

      todos[todoIndex] = {
        ...todos[todoIndex],
        ...updates,
        updatedAt: Date.now(),
        _version: todos[todoIndex]._version + 1
      };

      const key = this.getUserKey(this.TODOS_KEY, userId);
      await AsyncStorage.setItem(key, JSON.stringify(todos));
      
      return todos[todoIndex];
    } catch (error) {
      console.error('Error updating todo:', error);
      throw error;
    }
  }

  async deleteTodo(userId: string, todoId: string): Promise<boolean> {
    try {
      const todos = await this.getTodos(userId);
      const todoIndex = todos.findIndex(todo => todo._id === todoId);
      
      if (todoIndex === -1) return false;

      // Soft delete
      todos[todoIndex].isDeleted = true;
      todos[todoIndex].updatedAt = Date.now();
      todos[todoIndex]._version += 1;

      const key = this.getUserKey(this.TODOS_KEY, userId);
      await AsyncStorage.setItem(key, JSON.stringify(todos));
      
      return true;
    } catch (error) {
      console.error('Error deleting todo:', error);
      return false;
    }
  }

  // Project operations
  async getProjects(userId: string): Promise<LocalProject[]> {
    try {
      const key = this.getUserKey(this.PROJECTS_KEY, userId);
      const projectsJson = await AsyncStorage.getItem(key);
      const projects = projectsJson ? JSON.parse(projectsJson) : [];
      return projects.filter((project: LocalProject) => !project.isDeleted);
    } catch (error) {
      console.error('Error getting projects:', error);
      return [];
    }
  }

  async saveProject(userId: string, project: Omit<LocalProject, '_id' | 'createdAt' | 'updatedAt' | '_version'>): Promise<LocalProject> {
    try {
      const projects = await this.getProjects(userId);
      const newProject: LocalProject = {
        ...project,
        _id: generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        _version: 1,
        isDeleted: false
      };

      projects.push(newProject);
      const key = this.getUserKey(this.PROJECTS_KEY, userId);
      await AsyncStorage.setItem(key, JSON.stringify(projects));
      
      return newProject;
    } catch (error) {
      console.error('Error saving project:', error);
      throw error;
    }
  }

  // Sync metadata operations
  async getSyncMetadata(userId: string): Promise<SyncMetadata> {
    try {
      const key = this.getUserKey(this.SYNC_METADATA_KEY, userId);
      const metadataJson = await AsyncStorage.getItem(key);
      return metadataJson ? JSON.parse(metadataJson) : {
        lastFullSync: 0,
        lastIncrementalSync: 0,
        pendingChanges: [],
        conflictResolution: 'local'
      };
    } catch (error) {
      console.error('Error getting sync metadata:', error);
      return {
        lastFullSync: 0,
        lastIncrementalSync: 0,
        pendingChanges: [],
        conflictResolution: 'local'
      };
    }
  }

  async updateSyncMetadata(userId: string, metadata: Partial<SyncMetadata>): Promise<void> {
    try {
      const current = await this.getSyncMetadata(userId);
      const updated = { ...current, ...metadata };
      const key = this.getUserKey(this.SYNC_METADATA_KEY, userId);
      await AsyncStorage.setItem(key, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating sync metadata:', error);
    }
  }

  // Get pending changes for sync
  async getPendingChanges(userId: string): Promise<{ todos: LocalTodo[], projects: LocalProject[] }> {
    try {
      const todos = await this.getTodos(userId);
      const projects = await this.getProjects(userId);
      const metadata = await this.getSyncMetadata(userId);
      
      const lastSync = Math.max(metadata.lastFullSync, metadata.lastIncrementalSync);
      
      const pendingTodos = todos.filter(todo => 
        todo.updatedAt > (todo.lastSyncAt || 0) && !todo.isDeleted
      );
      
      const pendingProjects = projects.filter(project => 
        project.updatedAt > (project.lastSyncAt || 0) && !project.isDeleted
      );

      return { todos: pendingTodos, projects: pendingProjects };
    } catch (error) {
      console.error('Error getting pending changes:', error);
      return { todos: [], projects: [] };
    }
  }

  // Mark items as synced
  async markAsSynced(userId: string, todoIds: string[], projectIds: string[]): Promise<void> {
    try {
      const todos = await this.getTodos(userId);
      const projects = await this.getProjects(userId);
      const syncTime = Date.now();

      todoIds.forEach(id => {
        const todo = todos.find(t => t._id === id);
        if (todo) {
          todo.lastSyncAt = syncTime;
        }
      });

      projectIds.forEach(id => {
        const project = projects.find(p => p._id === id);
        if (project) {
          project.lastSyncAt = syncTime;
        }
      });

      const todosKey = this.getUserKey(this.TODOS_KEY, userId);
      const projectsKey = this.getUserKey(this.PROJECTS_KEY, userId);
      
      await AsyncStorage.setItem(todosKey, JSON.stringify(todos));
      await AsyncStorage.setItem(projectsKey, JSON.stringify(projects));
    } catch (error) {
      console.error('Error marking as synced:', error);
    }
  }

  // Clear all data (for testing or reset)
  async clearAllData(userId: string): Promise<void> {
    try {
      const keys = [
        this.getUserKey(this.TODOS_KEY, userId),
        this.getUserKey(this.PROJECTS_KEY, userId),
        this.getUserKey(this.SYNC_METADATA_KEY, userId)
      ];
      
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }
}

export default LocalDatabase.getInstance();
