# Research: Offline-First Support with Convex in React Native

## Technical Context
- **Language/Version**: TypeScript / React Native (Expo)
- **Primary Dependencies**: Convex, `@react-native-async-storage/async-storage`, `@react-native-community/netinfo`
- **Storage**: AsyncStorage for local caching and mutation queues; Convex for backend state.
- **Project Type**: Mobile App
- **Constraints**: Offline-capable, zero data loss, optimistic UI.

## Decision 1: Local Data Persistence (Query Caching)
- **Decision**: Use `AsyncStorage` to cache the latest results of Convex queries.
- **Rationale**: Convex's standard `useQuery` caches data in memory but does not persist it across app restarts when offline. By wrapping `useQuery` to save its results to `AsyncStorage`, we can instantly load the last known state when the app is opened without an internet connection.
- **Alternatives considered**: WatermelonDB or SQLite were considered but rejected as they introduce significant complexity and overhead for a simple To-Do app. `AsyncStorage` is already installed and sufficient for moderate amounts of data.

## Decision 2: Offline Mutation Queue
- **Decision**: Implement a local mutation queue in `AsyncStorage` for actions performed while offline.
- **Rationale**: When a user creates a task offline, the action must be stored persistently so it survives app restarts. A simple JSON array in `AsyncStorage` acting as a FIFO queue will track pending mutations.
- **Alternatives considered**: Redux-Offline or specialized sync engines. Rejected because they are heavy dependencies and we want a lightweight solution tightly integrated with our Convex backend.

## Decision 3: Optimistic UI & Syncing
- **Decision**: Use a custom hook (`useOfflineMutation`) that immediately updates the local cache (optimistic UI) and queues the mutation. A background sync manager listening to `NetInfo` will flush the queue when the connection is restored.
- **Rationale**: This provides the immediate feedback required by the spec (items instantly appear in the UI) and guarantees eventual consistency with the backend.

## Constitution Check
- **V. Shared Backend Persistence**: "Use Convex queries and mutations exclusively for state that needs to persist or sync across tabs." 
  - *Evaluation*: We will continue to use Convex queries and mutations. The offline wrapper will simply intercept them to provide the offline caching and queueing transparently, without violating the principle of keeping complex syncing logic out of the UI components. This is fully compliant.
