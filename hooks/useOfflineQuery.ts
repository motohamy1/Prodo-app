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

export function useOfflineQuery<T = any>(queryKey: string, queryFn: any, args?: any): T | undefined {
  const convexData = useQuery(queryFn, args);
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

  if (convexData === undefined && args !== 'skip' && !singleResultQueryKeys.includes(queryKey) && !isOffline) {
    // If waiting on slow network and no cache yet, return offlineData if available
    return offlineData;
  }

  return convexData !== undefined ? convexData : offlineData;
}
