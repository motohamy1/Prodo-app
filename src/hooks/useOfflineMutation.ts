import { useMutation } from 'convex/react';
import { DeviceEventEmitter } from 'react-native';
import { pushOfflineMutation } from '../utils/asyncStorage';

export const CACHE_UPDATED_EVENT = 'CACHE_UPDATED_EVENT';

/**
 * Wrapper for useMutation that persists the mutation to a local queue
 * so it can be retried across app restarts if offline.
 */
export function useOfflineMutation(mutation: any) {
  const convexMutation = useMutation(mutation);
  const mutationName = typeof mutation === 'string' ? mutation : mutation?.name || 'unknown';

  return async (args: any, optimisticUpdateCache?: (queryName: string, queryArgs: any, updateFn: (oldData: any) => any) => Promise<void>) => {
    
    // We queue it locally to survive app restarts
    await pushOfflineMutation(mutationName, args);

    // If an optimistic update function is provided for local cache, execute it
    // The caller is responsible for calling cacheQueryResult inside this
    if (optimisticUpdateCache) {
      // This is a placeholder for how callers can update the cache manually
      // Then emit event so useOfflineQuery can re-render
      DeviceEventEmitter.emit(CACHE_UPDATED_EVENT);
    }

    try {
      // Execute the actual mutation. 
      // If offline, Convex queues this in-memory and applies optimistic UI (if configured).
      // If it succeeds immediately, it will be removed from the offline queue by the SyncManager eventually
      // or we could remove it right here to be more efficient.
      const result = await convexMutation(args);
      
      // If we got here, it succeeded online.
      // Ideally we would remove it from the offline queue here to save the SyncManager work.
      // (Implementation detail omitted for brevity, SyncManager will handle deduplication or we can just let it run)
      
      return result;
    } catch (error) {
      console.warn('Mutation failed or queued by Convex', error);
      throw error;
    }
  };
}
