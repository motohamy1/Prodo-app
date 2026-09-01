import { applyOptimisticMutation, pushMutationToQueue, rollbackOptimisticEntry, updateCachedQuery } from '@/utils/offlineStorage';
import NetInfo from '@react-native-community/netinfo';
import { useMutation } from 'convex/react';

// Reactive network state tracker
let _isConnected = true;
NetInfo.addEventListener((state) => {
  _isConnected = state.isConnected ?? true;
});

// Initial network fetch
NetInfo.fetch().then((state) => {
  _isConnected = state.isConnected ?? true;
});

const recentMutations = new Map<string, { timestamp: number; result: any }>();

export function useOfflineMutation(mutationFn: any, mutationPath: string) {
  const convexMutation = useMutation(mutationFn);

  return async (
    args: any,
    options?: {
      optimisticUpdater?: (oldData: any[]) => any[];
      queryKey?: string;
      queryArgs?: any;
    }
  ) => {
    // Rapid duplicate tap suppression (1000ms window)
    const mutationHash = `${mutationPath}_${JSON.stringify(args || {})}`;
    const last = recentMutations.get(mutationHash);
    if (last && Date.now() - last.timestamp < 1000) {
      console.log(`Debounced rapid duplicate mutation tap: ${mutationPath}`);
      return last.result;
    }

    // 1. Apply explicit custom optimistic updater if provided
    if (options?.optimisticUpdater && options?.queryKey) {
      await updateCachedQuery(options.queryKey, options.queryArgs, options.optimisticUpdater);
    }

    // 2. Apply automatic built-in optimistic update to local store
    const optimisticResult = applyOptimisticMutation(mutationPath, args);
    const tempId = typeof optimisticResult === 'string' ? optimisticResult : optimisticResult?._id || `temp_${Date.now()}`;
    const fallbackResult = typeof optimisticResult === 'string' ? optimisticResult : { _id: tempId, id: tempId, ...optimisticResult };

    recentMutations.set(mutationHash, { timestamp: Date.now(), result: fallbackResult });
    // Keep map size clean
    if (recentMutations.size > 100) {
      const now = Date.now();
      recentMutations.forEach((val, key) => {
        if (now - val.timestamp > 5000) recentMutations.delete(key);
      });
    }

    // 3. If offline, queue mutation and return immediately (0ms)
    if (!_isConnected) {
      console.log('Offline: Queuing mutation:', mutationPath);
      await pushMutationToQueue(mutationPath, mutationPath, args, tempId);
      return fallbackResult;
    }

    // 4. If online, race Convex mutation against a 4000ms timeout
    // to prevent sluggish networks / hanging WebSockets from freezing the UI
    try {
      const serverResultPromise = convexMutation(args);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('NETWORK_TIMEOUT')), 4000);
      });

      const result = await Promise.race([serverResultPromise, timeoutPromise]);
      return result !== undefined ? result : (typeof optimisticResult === 'string' ? optimisticResult : { _id: tempId, ...optimisticResult });
    } catch (err: any) {
      const msg = String(err?.message || err || '');
      const isNetworkIssue =
        msg === 'NETWORK_TIMEOUT' ||
        !_isConnected ||
        /network|offline|transport|websocket|fetch failed|client is closed|socket|timed? ?out|unavailable|ENOTFOUND|ECONNRESET|EAI_AGAIN|50[234]/i.test(msg);

      // Real server-side rejections (validation, auth, app errors) must surface
      // to the caller instead of being silently queued forever.
      if (!isNetworkIssue) {
        console.error(`Mutation ${mutationPath} rejected by Convex:`, msg);
        if (tempId) {
          if (mutationPath.startsWith('yearlyGoals:') && /Goal/.test(mutationPath)) {
            rollbackOptimisticEntry(
              ['CACHE_yearlyGoals', 'CACHE_monthlyGoals', 'CACHE_dailyGoals'],
              tempId
            );
          } else if (mutationPath.startsWith('yearlyGoals:') && /Achievement/.test(mutationPath)) {
            rollbackOptimisticEntry(
              ['CACHE_yearlyAchievements', 'CACHE_monthlyAchievements', 'CACHE_dailyAchievements'],
              tempId
            );
          }
        }
        throw err;
      }

      // On network timeout or connection drop, silently queue for background sync
      console.warn(`Mutation ${mutationPath} deferred to offline queue (Network condition: ${msg})`);
      await pushMutationToQueue(mutationPath, mutationPath, args, tempId);
      return typeof optimisticResult === 'string' ? optimisticResult : { _id: tempId, id: tempId, ...optimisticResult };
    }
  };
}
