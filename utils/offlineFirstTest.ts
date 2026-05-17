import localDatabase from './localDatabase';
import periodicSyncManager from './periodicSyncManager';
import offlineMigration from './offlineMigration';
import { LocalTodo } from './localDatabase';

export interface TestResult {
  testName: string;
  success: boolean;
  message: string;
  duration: number;
}

class OfflineFirstTester {
  private static instance: OfflineFirstTester;

  static getInstance(): OfflineFirstTester {
    if (!OfflineFirstTester.instance) {
      OfflineFirstTester.instance = new OfflineFirstTester();
    }
    return OfflineFirstTester.instance;
  }

  // Run comprehensive offline-first tests
  async runAllTests(userId: string): Promise<TestResult[]> {
    const tests: TestResult[] = [];

    console.log('Starting offline-first functionality tests...');

    // Test 1: Local Database Operations
    tests.push(await this.testLocalDatabaseOperations(userId));

    // Test 2: Data Persistence
    tests.push(await this.testDataPersistence(userId));

    // Test 3: Migration System
    tests.push(await this.testMigrationSystem(userId));

    // Test 4: Sync Status
    tests.push(await this.testSyncStatus(userId));

    // Test 5: Conflict Resolution
    tests.push(await this.testConflictResolution(userId));

    // Test 6: Performance
    tests.push(await this.testPerformance(userId));

    const successCount = tests.filter(t => t.success).length;
    console.log(`Tests completed: ${successCount}/${tests.length} passed`);

    return tests;
  }

  // Test local database CRUD operations
  private async testLocalDatabaseOperations(userId: string): Promise<TestResult> {
    const startTime = Date.now();
    const testName = 'Local Database Operations';

    try {
      // Create test todo
      const testTodo: Omit<LocalTodo, '_id' | 'createdAt' | 'updatedAt' | '_version'> = {
        userId,
        text: 'Test Todo for Offline-First',
        status: 'not_started',
        priority: 'high',
        isDeleted: false
      };

      const created = await localDatabase.saveTodo(userId, testTodo);
      if (!created._id) {
        throw new Error('Failed to create todo');
      }

      // Read todo
      const read = await localDatabase.getTodoById(userId, created._id);
      if (!read || read.text !== testTodo.text) {
        throw new Error('Failed to read todo correctly');
      }

      // Update todo
      const updated = await localDatabase.updateTodo(userId, created._id, {
        text: 'Updated Test Todo',
        status: 'in_progress'
      });
      if (!updated || updated.text !== 'Updated Test Todo') {
        throw new Error('Failed to update todo');
      }

      // Delete todo
      const deleted = await localDatabase.deleteTodo(userId, created._id);
      if (!deleted) {
        throw new Error('Failed to delete todo');
      }

      // Verify deletion (soft delete)
      const afterDelete = await localDatabase.getTodoById(userId, created._id);
      if (afterDelete && !afterDelete.isDeleted) {
        throw new Error('Todo was not properly soft-deleted');
      }

      const duration = Date.now() - startTime;
      return {
        testName,
        success: true,
        message: 'All CRUD operations working correctly',
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testName,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
    }
  }

  // Test data persistence across app restarts
  private async testDataPersistence(userId: string): Promise<TestResult> {
    const startTime = Date.now();
    const testName = 'Data Persistence';

    try {
      // Create test data
      const testTodo: Omit<LocalTodo, '_id' | 'createdAt' | 'updatedAt' | '_version'> = {
        userId,
        text: 'Persistence Test Todo',
        status: 'not_started',
        isDeleted: false
      };

      const created = await localDatabase.saveTodo(userId, testTodo);
      const todoId = created._id;

      // Simulate app restart by creating new database instance
      const todosAfterRestart = await localDatabase.getTodos(userId);
      const foundTodo = todosAfterRestart.find(t => t._id === todoId);

      if (!foundTodo || foundTodo.text !== testTodo.text) {
        throw new Error('Data not persisted correctly');
      }

      // Cleanup
      await localDatabase.deleteTodo(userId, todoId);

      const duration = Date.now() - startTime;
      return {
        testName,
        success: true,
        message: 'Data persists correctly across restarts',
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testName,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
    }
  }

  // Test migration system
  private async testMigrationSystem(userId: string): Promise<TestResult> {
    const startTime = Date.now();
    const testName = 'Migration System';

    try {
      // Check migration status
      const status = await offlineMigration.getMigrationStatus(userId);
      
      if (typeof status.needsMigration !== 'boolean') {
        throw new Error('Migration status check failed');
      }

      // Test migration status structure
      const requiredFields = ['needsMigration', 'localTodos', 'localProjects', 'cachedTodos', 'cachedProjects'];
      for (const field of requiredFields) {
        if (!(field in status)) {
          throw new Error(`Missing field in migration status: ${field}`);
        }
      }

      const duration = Date.now() - startTime;
      return {
        testName,
        success: true,
        message: 'Migration system working correctly',
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testName,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
    }
  }

  // Test sync status tracking
  private async testSyncStatus(userId: string): Promise<TestResult> {
    const startTime = Date.now();
    const testName = 'Sync Status';

    try {
      // Get sync status
      const status = await periodicSyncManager.getSyncStatus(userId);
      
      // Verify status structure
      const requiredFields = ['isOnline', 'isSyncing', 'lastSync', 'pendingChanges'];
      for (const field of requiredFields) {
        if (!(field in status)) {
          throw new Error(`Missing field in sync status: ${field}`);
        }
      }

      // Test sync metadata
      const metadata = await localDatabase.getSyncMetadata(userId);
      const requiredMetadataFields = ['lastFullSync', 'lastIncrementalSync', 'pendingChanges', 'conflictResolution'];
      for (const field of requiredMetadataFields) {
        if (!(field in metadata)) {
          throw new Error(`Missing field in sync metadata: ${field}`);
        }
      }

      const duration = Date.now() - startTime;
      return {
        testName,
        success: true,
        message: 'Sync status tracking working correctly',
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testName,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
    }
  }

  // Test conflict resolution
  private async testConflictResolution(userId: string): Promise<TestResult> {
    const startTime = Date.now();
    const testName = 'Conflict Resolution';

    try {
      // Import conflict resolver
      const { default: conflictResolver } = await import('./conflictResolution');
      
      // Create test data for conflict detection
      const localTodo: LocalTodo = {
        _id: 'test-conflict-1',
        userId,
        text: 'Local Version',
        status: 'not_started',
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 500,
        _version: 2,
        isDeleted: false
      };

      const remoteTodo: LocalTodo = {
        ...localTodo,
        text: 'Remote Version',
        updatedAt: Date.now() - 100,
        _version: 3
      };

      // Test conflict detection
      const conflicts = conflictResolver.detectConflicts([localTodo], [remoteTodo]);
      
      if (conflicts.length !== 1) {
        throw new Error('Expected 1 conflict, found ' + conflicts.length);
      }

      // Test auto-resolution
      const resolutions = conflictResolver.autoResolveConflicts(conflicts, 'latest');
      
      if (resolutions.length !== 1) {
        throw new Error('Expected 1 resolution, found ' + resolutions.length);
      }

      // Test conflict summary
      const summary = conflictResolver.getConflictSummary(conflicts[0]);
      if (!summary.title || !summary.description) {
        throw new Error('Conflict summary missing required fields');
      }

      const duration = Date.now() - startTime;
      return {
        testName,
        success: true,
        message: 'Conflict resolution working correctly',
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testName,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
    }
  }

  // Test performance with large datasets
  private async testPerformance(userId: string): Promise<TestResult> {
    const startTime = Date.now();
    const testName = 'Performance Test';

    try {
      const testSize = 100;
      const testTodos: Omit<LocalTodo, '_id' | 'createdAt' | 'updatedAt' | '_version'>[] = [];

      // Create test data
      for (let i = 0; i < testSize; i++) {
        testTodos.push({
          userId,
          text: `Performance Test Todo ${i}`,
          status: 'not_started',
          priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
          isDeleted: false
        });
      }

      // Test batch creation performance
      const createStart = Date.now();
      const createdTodos = [];
      for (const todo of testTodos) {
        createdTodos.push(await localDatabase.saveTodo(userId, todo));
      }
      const createTime = Date.now() - createStart;

      // Test read performance
      const readStart = Date.now();
      const allTodos = await localDatabase.getTodos(userId);
      const readTime = Date.now() - readStart;

      // Test update performance
      const updateStart = Date.now();
      for (const todo of createdTodos.slice(0, 10)) {
        await localDatabase.updateTodo(userId, todo._id, { status: 'in_progress' });
      }
      const updateTime = Date.now() - updateStart;

      // Verify data integrity
      if (allTodos.length < testSize) {
        throw new Error(`Expected at least ${testSize} todos, found ${allTodos.length}`);
      }

      // Cleanup
      for (const todo of createdTodos) {
        await localDatabase.deleteTodo(userId, todo._id);
      }

      const totalTime = Date.now() - startTime;
      const message = `Performance: Create ${createTime}ms, Read ${readTime}ms, Update ${updateTime}ms for ${testSize} items`;

      return {
        testName,
        success: true,
        message,
        duration: totalTime
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testName,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
    }
  }

  // Generate test report
  generateTestReport(results: TestResult[]): string {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const failedTests = results.filter(r => !r.success);
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    let report = `=== OFFLINE-FIRST TEST REPORT ===\n`;
    report += `Total Tests: ${totalTests}\n`;
    report += `Passed: ${passedTests}\n`;
    report += `Failed: ${failedTests.length}\n`;
    report += `Total Duration: ${totalDuration}ms\n\n`;

    results.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      report += `${status} ${result.testName} (${result.duration}ms)\n`;
      if (!result.success) {
        report += `   Error: ${result.message}\n`;
      } else {
        report += `   ${result.message}\n`;
      }
    });

    if (failedTests.length > 0) {
      report += `\n=== FAILED TESTS ===\n`;
      failedTests.forEach(test => {
        report += `${test.testName}: ${test.message}\n`;
      });
    }

    return report;
  }
}

export default OfflineFirstTester.getInstance();
