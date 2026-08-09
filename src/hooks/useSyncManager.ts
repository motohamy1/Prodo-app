import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useConvex } from 'convex/react';
import { getOfflineMutationQueue, setOfflineMutationQueue } from '../utils/asyncStorage';

/**
 * A hook that listens to network state changes and flushes the 
 * offline mutation queue to Convex when the device comes online.
 */
export function useSyncManager() {
  const convex = useConvex();

  useEffect(() => {
    // We create an async function inside so we can await operations
    const handleConnectivityChange = async (state: any) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        console.log('Network connected, checking offline mutation queue...');
        
        const queue = await getOfflineMutationQueue();
        if (queue.length === 0) return;

        console.log(`Found ${queue.length} pending mutations, flushing...`);
        let newQueue = [...queue];
        
        for (let i = 0; i < queue.length; i++) {
          const mutation = queue[i];
          try {
            // Using convex.mutation dynamically
            // Note: Since we only have the string name in the queue, we use it directly.
            // If mutationName is not registered this might throw.
            await convex.mutation(mutation.mutationName as any, mutation.args);
            
            // Success, remove from our new queue list
            newQueue = newQueue.filter(m => m.id !== mutation.id);
            // Save immediately after success in case it crashes midway
            await setOfflineMutationQueue(newQueue);
            console.log(`Successfully synced mutation ${mutation.mutationName}`);
          } catch (error) {
            console.error(`Failed to sync mutation ${mutation.mutationName}`, error);
            
            // T008: Handle sync errors and add exponential backoff or retry limits
            // Increment retry count
            mutation.retryCount = (mutation.retryCount || 0) + 1;
            
            // If it failed more than 5 times, drop it to avoid infinite loops
            if (mutation.retryCount > 5) {
              console.warn(`Dropping mutation ${mutation.id} after 5 failed retries.`);
              newQueue = newQueue.filter(m => m.id !== mutation.id);
            } else {
              // We could break here if it's a network error to avoid failing the rest,
              // but for now we'll just try them all or break.
              // Let's break on first failure assuming network dropped again.
              break; 
            }
            await setOfflineMutationQueue(newQueue);
          }
        }
      }
    };

    const unsubscribe = NetInfo.addEventListener(handleConnectivityChange);
    
    // Also try on mount
    NetInfo.fetch().then(handleConnectivityChange);

    return () => unsubscribe();
  }, [convex]);
}
