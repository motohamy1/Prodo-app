import { saveCachedQuery } from '@/utils/offlineStorage';
import NetInfo from '@react-native-community/netinfo';
import { useQuery } from 'convex/react';
import { useEffect, useState } from 'react';

const memoryCache: Record<string, any> = {};

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
  const cacheKey = `CACHE_${queryKey}_${JSON.stringify(args || {})}`;
  
  const [offlineData, setOfflineData] = useState<any>(
    isEmptySingleResultCache(queryKey, memoryCache[cacheKey]) ? undefined : memoryCache[cacheKey]
  );
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    NetInfo.fetch().then(state => setIsOffline(!state.isConnected));
    const unsub = NetInfo.addEventListener(state => setIsOffline(!state.isConnected));
    return unsub;
  }, []);

  useEffect(() => {
    if (memoryCache[cacheKey] !== undefined) {
      if (isEmptySingleResultCache(queryKey, memoryCache[cacheKey])) {
        delete memoryCache[cacheKey];
      } else {
        setOfflineData(memoryCache[cacheKey]);
        return;
      }
    }

    setOfflineData(undefined);

    import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
      AsyncStorage.getItem(cacheKey).then(value => {
        if (value) {
          try {
            const parsed = JSON.parse(value);
            if (isEmptySingleResultCache(queryKey, parsed)) {
              AsyncStorage.removeItem(cacheKey);
              delete memoryCache[cacheKey];
              setOfflineData(undefined);
              return;
            }
            memoryCache[cacheKey] = parsed;
            setOfflineData(parsed);
          } catch (e) {
            AsyncStorage.removeItem(cacheKey);
            delete memoryCache[cacheKey];
            setOfflineData(undefined);
          }
        }
      }).catch(() => {
        delete memoryCache[cacheKey];
        setOfflineData(undefined);
      });
    });
  }, [cacheKey, queryKey]);

  useEffect(() => {
    if (convexData !== undefined) {
      memoryCache[cacheKey] = convexData;
      setOfflineData(convexData);
      saveCachedQuery(queryKey, args, convexData);
    }
  }, [convexData, cacheKey]);

  if (isOffline) {
    return offlineData;
  }

  if (convexData === undefined && offlineData !== undefined) {
     return offlineData;
  }

  return convexData !== undefined ? convexData : offlineData;
}
