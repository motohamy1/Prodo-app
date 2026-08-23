import { getCacheKey, memoryCache, saveCachedQuery, subscribeToCache } from '@/utils/offlineStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useQuery } from 'convex/react';
import { useCallback, useEffect, useState } from 'react';

const singleResultQueryKeys = [
  'auth.getUserSettings',
  'projects.getCategory',
  'projects.getProject',
  'projects.getProjectMetadata',
  'projects.getSubCategory',
  'todos.getById',
];

const isEmptySingleResultCache = (queryKey: string, value: any) =>
  singleResultQueryKeys.includes(queryKey) && Array.isArray(value) && value.length === 0;

function hasOfflineId(args: any): boolean {
  if (!args || typeof args !== 'object' || args === 'skip') return false;
  for (const key of Object.keys(args)) {
    const val = args[key];
    if (typeof val === 'string') {
      if (val.includes('_')) {
        const lowerKey = key.toLowerCase();
        if (lowerKey.endsWith('id') || lowerKey === 'id' || lowerKey === '_id' || lowerKey === 'parentid') {
           return true;
        }
      }
    } else if (typeof val === 'object' && val !== null) {
      if (hasOfflineId(val)) return true;
    }
  }
  return false;
}

export function useOfflineQuery<T = any>(queryKey: string, queryFn: any, args?: any): T | undefined {
  const convexArgs = (args === 'skip' || hasOfflineId(args)) ? 'skip' : args;
  const convexData = useQuery(queryFn, convexArgs);
  const cacheKey = getCacheKey(queryKey, args);

  // Synchronously initialize with in-memory cache if available
  const [offlineData, setOfflineData] = useState<any>(() => {
    const memVal = memoryCache[cacheKey];
    return isEmptySingleResultCache(queryKey, memVal) ? undefined : memVal;
  });

  const [isOffline, setIsOffline] = useState(false);

  // Network listener
  useEffect(() => {
    NetInfo.fetch().then((state) => setIsOffline(!state.isConnected));
    const unsub = NetInfo.addEventListener((state) => setIsOffline(!state.isConnected));
    return unsub;
  }, []);

  // Sync state with in-memory or persisted cache whenever cacheKey changes
  const refreshFromCache = useCallback(() => {
    const memVal = memoryCache[cacheKey];
    if (memVal !== undefined && !isEmptySingleResultCache(queryKey, memVal)) {
      setOfflineData(memVal);
      return;
    }

    AsyncStorage.getItem(cacheKey)
      .then((value) => {
        if (value) {
          try {
            const parsed = JSON.parse(value);
            if (!isEmptySingleResultCache(queryKey, parsed)) {
              memoryCache[cacheKey] = parsed;
              setOfflineData(parsed);
            }
          } catch (e) {
            // ignore parse error
          }
        }
      })
      .catch(() => {});
  }, [cacheKey, queryKey]);

  // Initial and cacheKey change refresh
  useEffect(() => {
    refreshFromCache();
  }, [refreshFromCache]);

  // Subscribe to offlineStorage events (fires on any optimistic update or cache change)
  useEffect(() => {
    const unsub = subscribeToCache(() => {
      const memVal = memoryCache[cacheKey];
      if (memVal !== undefined) {
        setOfflineData(memVal);
      }
    });
    return unsub;
  }, [cacheKey]);

  // When live Convex server data arrives, update cache & persistence
  useEffect(() => {
    if (convexData !== undefined) {
      memoryCache[cacheKey] = convexData;
      setOfflineData(convexData);
      saveCachedQuery(queryKey, args, convexData);
    }
  }, [convexData, cacheKey, queryKey, args]);

  // If offline or if live Convex data hasn't arrived yet (e.g. slow connection), serve cached data instantly
  if (isOffline) {
    if (offlineData !== undefined) return offlineData;
    if (args !== 'skip' && !singleResultQueryKeys.includes(queryKey)) {
      return [] as any;
    }
    return offlineData;
  }

  if (convexData === undefined && offlineData !== undefined) {
    return offlineData;
  }

  if (convexData === undefined && args !== 'skip' && !isOffline) {
    // If we have an offline ID, the Convex query is skipped, so we will never get remote data.
    // We must return empty defaults if there is no offline cache.
    if (hasOfflineId(args)) {
      if (!singleResultQueryKeys.includes(queryKey)) {
        return [] as any;
      }
      return offlineData; // which might be undefined, that's fine for objects
    }

    // If waiting on slow network and no cache yet, return offlineData if available
    if (!singleResultQueryKeys.includes(queryKey)) {
      return offlineData;
    }
  }

  return convexData !== undefined ? convexData : offlineData;
}
