import { useQuery } from 'convex/react';
import { useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { cacheQueryResult, getCachedQueryResult } from '../utils/asyncStorage';
import { CACHE_UPDATED_EVENT } from './useOfflineMutation';

/**
 * A wrapper around Convex's useQuery that caches results locally
 * and serves them when offline or while loading.
 */
export function useOfflineQuery(query: any, args?: any, options?: any) {
  // Use the standard Convex hook
  const convexData = useQuery(query, args === undefined ? 'skip' : args);
  
  const [cachedData, setCachedData] = useState<any>(undefined);
  const [isLoadedFromCache, setIsLoadedFromCache] = useState(false);

  const queryName = typeof query === 'string' ? query : query?.name || 'unknown';

  // Load from cache on mount and when cache is manually updated
  useEffect(() => {
    let isMounted = true;
    
    if (args === 'skip' || options?.skip) return;

    const loadFromCache = () => {
      getCachedQueryResult(queryName, args).then((data) => {
        if (isMounted && data !== undefined) {
          setCachedData(data);
          setIsLoadedFromCache(true);
        }
      });
    };

    loadFromCache();

    // Listen for manual cache updates (from optimistic mutations)
    const subscription = DeviceEventEmitter.addListener(CACHE_UPDATED_EVENT, loadFromCache);

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [queryName, JSON.stringify(args)]);

  // Update cache when Convex returns fresh data
  useEffect(() => {
    if (convexData !== undefined) {
      setCachedData(convexData);
      cacheQueryResult(queryName, args, convexData);
    }
  }, [convexData, queryName, JSON.stringify(args)]);

  // If Convex has returned data, it's fresh. Otherwise, fallback to cache.
  // Note: convexData will be undefined while loading or if offline (and query can't complete)
  return convexData !== undefined ? convexData : cachedData;
}
