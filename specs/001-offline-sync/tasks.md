# Tasks: Offline-First Support

**Input**: Design documents from `/specs/001-offline-sync/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create `hooks` and `utils` directories under `src/` (if they do not exist)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Implement AsyncStorage wrappers for offline cache and queue in `src/utils/asyncStorage.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Offline Usage and Data Creation (Priority: P1) 🎯 MVP

**Goal**: As a user, I want to be able to open the app and create new data even when I have no internet connection.

**Independent Test**: Can be fully tested by turning off Wi-Fi/Cellular on the device, opening the app, and successfully adding new items to the list which instantly appear in the UI.

### Implementation for User Story 1

- [x] T003 [P] [US1] Implement `useOfflineQuery` hook in `src/hooks/useOfflineQuery.ts` to cache query results locally
- [x] T004 [P] [US1] Implement `useOfflineMutation` hook in `src/hooks/useOfflineMutation.ts` to optimistically update cache and queue mutations
- [x] T005 [US1] Update the screens (e.g. `app/(tabs)/index.tsx`) to use `useOfflineQuery` and `useOfflineMutation` instead of standard Convex hooks

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. The app should load data offline and save new mutations to the local queue.

---

## Phase 4: User Story 2 - Background Data Synchronization (Priority: P2)

**Goal**: As a user, I want the app to automatically sync my offline changes to the backend database once I regain internet connection.

**Independent Test**: Can be fully tested by creating an item offline, reconnecting to the internet, and observing that the item appears in the backend database.

### Implementation for User Story 2

- [x] T006 [US2] Implement `useSyncManager` hook in `src/hooks/useSyncManager.ts` to listen to `NetInfo` and process the offline queue
- [x] T007 [US2] Integrate `useSyncManager` in the root layout `app/_layout.tsx` so background sync happens globally

**Checkpoint**: At this point, User Stories 1 AND 2 should both work. The queue will flush when the network returns.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T008 Handle sync errors (e.g. network failure during queue processing) and add exponential backoff or retry limits in `src/hooks/useSyncManager.ts`
- [x] T009 Clean up unused imports and verify typings across `src/hooks/` and `src/utils/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - Sequential in priority order (US1 → US2)
- **Polish (Final Phase)**: Depends on all user stories being complete

### Parallel Opportunities

- `T003` and `T004` (Offline hooks) can be worked on in parallel.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and 2
2. Complete Phase 3 (US1)
3. **STOP and VALIDATE**: Verify offline reading and writing locally
4. Proceed to Phase 4 (US2) for backend synchronization
