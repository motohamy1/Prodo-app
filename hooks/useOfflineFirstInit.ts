import { useEffect, useState } from 'react';
import { Platform, Alert } from 'react-native';
import periodicSyncManager from '@/utils/periodicSyncManager';
import offlineMigration from '@/utils/offlineMigration';
import { useAuth } from './useAuth';

export interface OfflineFirstStatus {
  isInitialized: boolean;
  isMigrated: boolean;
  migrationInProgress: boolean;
  migrationResult: {
    todosMigrated: number;
    projectsMigrated: number;
    errors: string[];
  } | null;
  needsMigration: boolean;
  error: string | null;
}

export function useOfflineFirstInit() {
  const { user } = useAuth();
  const [status, setStatus] = useState<OfflineFirstStatus>({
    isInitialized: false,
    isMigrated: false,
    migrationInProgress: false,
    migrationResult: null,
    needsMigration: false,
    error: null
  });

  useEffect(() => {
    if (!user?.userId) {
      return;
    }

    initializeOfflineFirst(user.userId);
  }, [user?.userId]);

  const initializeOfflineFirst = async (userId: string) => {
    try {
      setStatus(prev => ({ ...prev, error: null }));

      // Initialize periodic sync manager
      await periodicSyncManager.initialize();
      
      // Check if migration is needed
      const needsMigration = await offlineMigration.isMigrationNeeded(userId);
      setStatus(prev => ({ ...prev, needsMigration }));

      if (needsMigration) {
        await performMigration(userId);
      }

      setStatus(prev => ({ ...prev, isInitialized: true, isMigrated: true }));
      
      console.log('Offline-first system initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize offline-first system';
      console.error('Offline-first initialization failed:', error);
      setStatus(prev => ({ ...prev, error: errorMessage }));
    }
  };

  const performMigration = async (userId: string) => {
    setStatus(prev => ({ ...prev, migrationInProgress: true }));

    try {
      const migrationResult = await offlineMigration.migrateFromCache(userId);
      
      setStatus(prev => ({ 
        ...prev, 
        migrationInProgress: false, 
        migrationResult,
        needsMigration: false
      }));

      if (migrationResult.success) {
        console.log(`Migration completed: ${migrationResult.todosMigrated} todos, ${migrationResult.projectsMigrated} projects`);
      } else {
        console.error('Migration completed with errors:', migrationResult.errors);
        
        // Show migration errors to user
        if (Platform.OS !== 'web') {
          Alert.alert(
            'Migration Warning',
            `Some data could not be migrated. ${migrationResult.todosMigrated} todos and ${migrationResult.projectsMigrated} projects were successfully migrated. ${migrationResult.errors.length} errors occurred.`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Migration failed';
      console.error('Migration failed:', error);
      
      setStatus(prev => ({ 
        ...prev, 
        migrationInProgress: false, 
        error: errorMessage
      }));

      // Show migration failure to user
      if (Platform.OS !== 'web') {
        Alert.alert(
          'Migration Failed',
          'Failed to migrate your data to the new offline-first system. Please try again or contact support.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: () => performMigration(userId) }
          ]
        );
      }
    }
  };

  const retryMigration = () => {
    if (!user?.userId) return;
    performMigration(user.userId);
  };

  const forceRemigration = async () => {
    if (!user?.userId) return;

    setStatus(prev => ({ ...prev, migrationInProgress: true }));
    
    try {
      const migrationResult = await offlineMigration.forceRemigration(user.userId);
      
      setStatus(prev => ({ 
        ...prev, 
        migrationInProgress: false, 
        migrationResult,
        needsMigration: false
      }));

      if (migrationResult.success) {
        console.log(`Force re-migration completed: ${migrationResult.todosMigrated} todos, ${migrationResult.projectsMigrated} projects`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Force re-migration failed';
      console.error('Force re-migration failed:', error);
      setStatus(prev => ({ 
        ...prev, 
        migrationInProgress: false, 
        error: errorMessage
      }));
    }
  };

  return {
    ...status,
    retryMigration,
    forceRemigration
  };
}
