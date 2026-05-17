import { LocalTodo, LocalProject } from './localDatabase';

export interface Conflict<T> {
  id: string;
  type: 'todo' | 'project';
  localVersion: T;
  remoteVersion: T;
  conflictType: 'update' | 'delete' | 'create';
  timestamp: number;
}

export interface ConflictResolution {
  conflictId: string;
  resolution: 'local' | 'remote' | 'merge';
  resolvedData?: any;
}

class ConflictResolver {
  private static instance: ConflictResolver;

  static getInstance(): ConflictResolver {
    if (!ConflictResolver.instance) {
      ConflictResolver.instance = new ConflictResolver();
    }
    return ConflictResolver.instance;
  }

  // Detect conflicts between local and remote data
  detectConflicts<T extends { _id: string; _version: number; updatedAt: number }>(
    localItems: T[],
    remoteItems: T[]
  ): Conflict<T>[] {
    const conflicts: Conflict<T>[] = [];

    // Create maps for easier lookup
    const localMap = new Map(localItems.map(item => [item._id, item]));
    const remoteMap = new Map(remoteItems.map(item => [item._id, item]));

    // Check for conflicts in existing items
    for (const [id, localItem] of localMap) {
      const remoteItem = remoteMap.get(id);
      
      if (remoteItem) {
        // Both exist - check for version conflicts
        if (this.hasVersionConflict(localItem, remoteItem)) {
          conflicts.push({
            id,
            type: this.getItemType(localItem),
            localVersion: localItem,
            remoteVersion: remoteItem,
            conflictType: 'update',
            timestamp: Date.now()
          });
        }
      } else {
        // Local item not found remotely - might be new or deleted remotely
        conflicts.push({
          id,
          type: this.getItemType(localItem),
          localVersion: localItem,
          remoteVersion: null as any,
          conflictType: 'create',
          timestamp: Date.now()
        });
      }
    }

    // Check for items that exist remotely but not locally (deleted locally)
    for (const [id, remoteItem] of remoteMap) {
      if (!localMap.has(id)) {
        conflicts.push({
          id,
          type: this.getItemType(remoteItem),
          localVersion: null as any,
          remoteVersion: remoteItem,
          conflictType: 'delete',
          timestamp: Date.now()
        });
      }
    }

    return conflicts;
  }

  // Check if there's a version conflict
  private hasVersionConflict<T extends { _version: number; updatedAt: number }>(
    local: T,
    remote: T
  ): boolean {
    // If versions are different, there's a conflict
    if (local._version !== remote._version) {
      return true;
    }

    // If timestamps are significantly different, there might be a conflict
    const timeDiff = Math.abs(local.updatedAt - remote.updatedAt);
    return timeDiff > 1000; // 1 second threshold
  }

  // Determine item type
  private getItemType(item: any): 'todo' | 'project' {
    if (item.text !== undefined) return 'todo';
    if (item.name !== undefined) return 'project';
    return 'todo'; // default
  }

  // Auto-resolve conflicts based on strategy
  autoResolveConflicts<T extends { _id: string; _version: number; updatedAt: number }>(
    conflicts: Conflict<T>[],
    strategy: 'local' | 'remote' | 'latest' | 'merge'
  ): ConflictResolution[] {
    return conflicts.map(conflict => {
      let resolution: ConflictResolution['resolution'];
      let resolvedData: T | undefined;

      switch (strategy) {
        case 'local':
          resolution = 'local';
          resolvedData = conflict.localVersion;
          break;

        case 'remote':
          resolution = 'remote';
          resolvedData = conflict.remoteVersion;
          break;

        case 'latest':
          resolution = this.resolveByTimestamp(conflict);
          resolvedData = resolution === 'local' ? conflict.localVersion : conflict.remoteVersion;
          break;

        case 'merge':
          resolution = 'merge';
          resolvedData = this.mergeData(conflict);
          break;

        default:
          resolution = 'local';
          resolvedData = conflict.localVersion;
      }

      return {
        conflictId: conflict.id,
        resolution,
        resolvedData
      };
    });
  }

  // Resolve conflict by timestamp (latest wins)
  private resolveByTimestamp<T extends { updatedAt: number }>(
    conflict: Conflict<T>
  ): 'local' | 'remote' {
    if (!conflict.localVersion) return 'remote';
    if (!conflict.remoteVersion) return 'local';
    
    return conflict.localVersion.updatedAt > conflict.remoteVersion.updatedAt ? 'local' : 'remote';
  }

  // Merge data intelligently
  private mergeData<T extends LocalTodo | LocalProject>(
    conflict: Conflict<T>
  ): T {
    if (!conflict.localVersion) return conflict.remoteVersion;
    if (!conflict.remoteVersion) return conflict.localVersion;

    const local = conflict.localVersion;
    const remote = conflict.remoteVersion;

    // For todos, merge intelligently
    if (this.getItemType(local) === 'todo') {
      const todoLocal = local as LocalTodo;
      const todoRemote = remote as LocalTodo;

      return {
        ...todoRemote, // Start with remote as base
        // Prefer local values for these fields if they're more recent
        ...(todoLocal.updatedAt > todoRemote.updatedAt && {
          text: todoLocal.text,
          description: todoLocal.description,
          status: todoLocal.status,
          priority: todoLocal.priority
        }),
        // Use the highest version
        _version: Math.max(todoLocal._version, todoRemote._version),
        // Update timestamp
        updatedAt: Date.now()
      } as T;
    }

    // For projects, similar merging logic
    if (this.getItemType(local) === 'project') {
      const projectLocal = local as LocalProject;
      const projectRemote = remote as LocalProject;

      return {
        ...projectRemote,
        ...(projectLocal.updatedAt > projectRemote.updatedAt && {
          name: projectLocal.name,
          description: projectLocal.description,
          color: projectLocal.color
        }),
        _version: Math.max(projectLocal._version, projectRemote._version),
        updatedAt: Date.now()
      } as T;
    }

    // Default: return remote version
    return conflict.remoteVersion;
  }

  // Manual conflict resolution (for UI)
  resolveManually<T>(
    conflict: Conflict<T>,
    resolution: 'local' | 'remote' | 'merge',
    customMergeData?: T
  ): ConflictResolution {
    let resolvedData: T;

    switch (resolution) {
      case 'local':
        resolvedData = conflict.localVersion;
        break;
      case 'remote':
        resolvedData = conflict.remoteVersion;
        break;
      case 'merge':
        resolvedData = customMergeData || this.mergeData(conflict);
        break;
      default:
        resolvedData = conflict.localVersion;
    }

    return {
      conflictId: conflict.id,
      resolution,
      resolvedData
    };
  }

  // Get conflict summary for UI display
  getConflictSummary(conflict: Conflict<any>): {
    title: string;
    description: string;
    localChanges: string[];
    remoteChanges: string[];
  } {
    const local = conflict.localVersion;
    const remote = conflict.remoteVersion;

    const title = conflict.type === 'todo' 
      ? (local?.text || remote?.text || 'Untitled Task')
      : (local?.name || remote?.name || 'Untitled Project');

    const description = this.getConflictDescription(conflict);
    const localChanges = this.getChangesSummary(local, remote, 'local');
    const remoteChanges = this.getChangesSummary(local, remote, 'remote');

    return {
      title,
      description,
      localChanges,
      remoteChanges
    };
  }

  private getConflictDescription(conflict: Conflict<any>): string {
    switch (conflict.conflictType) {
      case 'update':
        return 'This item has been modified on both devices';
      case 'create':
        return 'This item exists locally but not remotely';
      case 'delete':
        return 'This item was deleted locally but still exists remotely';
      default:
        return 'Unknown conflict type';
    }
  }

  private getChangesSummary(local: any, remote: any, side: 'local' | 'remote'): string[] {
    const changes: string[] = [];
    const base = side === 'local' ? remote : local;
    const compare = side === 'local' ? local : remote;

    if (!base || !compare) return changes;

    // Check for changes in common fields
    const fieldsToCheck = ['text', 'name', 'description', 'status', 'priority', 'color'];
    
    for (const field of fieldsToCheck) {
      if (base[field] !== compare[field]) {
        changes.push(`${field}: ${base[field]} → ${compare[field]}`);
      }
    }

    return changes;
  }
}

export default ConflictResolver.getInstance();
