# Data Model: Offline-First Support

## Entities

### 1. Offline Mutation Queue (Local State)
Stores the list of actions performed by the user while disconnected.

- **Storage**: `AsyncStorage` (Key: `OFFLINE_MUTATION_QUEUE`)
- **Structure**: Array of `OfflineMutation` objects.
- **Fields**:
  - `id`: `string` (Unique UUID for the mutation to avoid duplicates)
  - `mutationName`: `string` (The name of the Convex mutation, e.g., `tasks:create`)
  - `args`: `object` (The arguments passed to the mutation)
  - `timestamp`: `number` (When the mutation was queued)
  - `retryCount`: `number` (Number of times sync was attempted)
  
### 2. Cached Query Results (Local State)
Stores the results of Convex queries for instant offline loading.

- **Storage**: `AsyncStorage` (Key: `CONVEX_QUERY_CACHE_[QueryName]_[ArgsHash]`)
- **Structure**: JSON Object of the returned data.
- **Fields**:
  - `data`: `any` (The actual result of the query)
  - `timestamp`: `number` (When the cache was last updated)

## State Transitions & Workflows

1. **App Startup (Offline)**:
   - Check `AsyncStorage` for cached query results.
   - Serve cached results to the UI instantly.
   
2. **User Performs Action (Offline/Online)**:
   - Action is intercepted by `useOfflineMutation`.
   - The UI is optimistically updated (the local query cache is updated).
   - An `OfflineMutation` is appended to the `OFFLINE_MUTATION_QUEUE`.
   - The sync manager is triggered.

3. **Sync Manager Trigger**:
   - Listens to `@react-native-community/netinfo`.
   - If `isConnected` is true:
     - Shift the oldest mutation from the queue.
     - Call the actual Convex mutation with `args`.
     - On success, remove from queue.
     - On failure (network error), increment `retryCount` and pause queue until next connection event.
     - On failure (validation error), remove from queue and potentially revert optimistic UI update.

## Validation Rules
- `mutationName` must map to a valid registered Convex mutation.
- `args` must be serializable to JSON.
