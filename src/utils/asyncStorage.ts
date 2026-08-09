import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_MUTATION_QUEUE_KEY = 'OFFLINE_MUTATION_QUEUE';
const CONVEX_QUERY_CACHE_PREFIX = 'CONVEX_QUERY_CACHE_';

export interface OfflineMutation {
  id: string;
  mutationName: string;
  args: Record<string, any>;
  timestamp: number;
  retryCount: number;
}

/**
 * Pushes a new mutation to the offline queue.
 */
export async function pushOfflineMutation(mutationName: string, args: Record<string, any>) {
  try {
    const queue = await getOfflineMutationQueue();
    const newMutation: OfflineMutation = {
      id: Math.random().toString(36).substring(2, 15),
      mutationName,
      args,
      timestamp: Date.now(),
      retryCount: 0,
    };
    
    queue.push(newMutation);
    await AsyncStorage.setItem(OFFLINE_MUTATION_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Failed to push offline mutation', error);
  }
}

/**
 * Retrieves the current offline mutation queue.
 */
export async function getOfflineMutationQueue(): Promise<OfflineMutation[]> {
  try {
    const queueData = await AsyncStorage.getItem(OFFLINE_MUTATION_QUEUE_KEY);
    if (queueData) {
      return JSON.parse(queueData) as OfflineMutation[];
    }
  } catch (error) {
    console.error('Failed to get offline mutation queue', error);
  }
  return [];
}

/**
 * Sets the entire offline mutation queue (e.g. after processing).
 */
export async function setOfflineMutationQueue(queue: OfflineMutation[]) {
  try {
    await AsyncStorage.setItem(OFFLINE_MUTATION_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Failed to set offline mutation queue', error);
  }
}

/**
 * Caches the result of a Convex query.
 */
export async function cacheQueryResult(queryName: string, args: Record<string, any> | undefined, data: any) {
  try {
    const key = `${CONVEX_QUERY_CACHE_PREFIX}${queryName}_${JSON.stringify(args || {})}`;
    await AsyncStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (error) {
    console.error('Failed to cache query result', error);
  }
}

/**
 * Retrieves a cached query result.
 */
export async function getCachedQueryResult(queryName: string, args: Record<string, any> | undefined) {
  try {
    const key = `${CONVEX_QUERY_CACHE_PREFIX}${queryName}_${JSON.stringify(args || {})}`;
    const cachedData = await AsyncStorage.getItem(key);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      return parsed.data;
    }
  } catch (error) {
    console.error('Failed to get cached query result', error);
  }
  return undefined;
}
