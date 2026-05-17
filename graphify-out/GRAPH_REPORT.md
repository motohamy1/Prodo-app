# Graph Report - .  (2026-05-17)

## Corpus Check
- 153 files · ~222,170 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 338 nodes · 447 edges · 20 communities detected
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 39 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_App Shell & Navigation|App Shell & Navigation]]
- [[_COMMUNITY_Home Screen & Settings|Home Screen & Settings]]
- [[_COMMUNITY_Task Detail Modal|Task Detail Modal]]
- [[_COMMUNITY_Planner & Projects|Planner & Projects]]
- [[_COMMUNITY_Bug Fixes & Features|Bug Fixes & Features]]
- [[_COMMUNITY_Sync Manager|Sync Manager]]
- [[_COMMUNITY_Offline Migration|Offline Migration]]
- [[_COMMUNITY_Design System|Design System]]
- [[_COMMUNITY_Todo Card Components|Todo Card Components]]
- [[_COMMUNITY_Conflict Resolution|Conflict Resolution]]
- [[_COMMUNITY_Offline-First Testing|Offline-First Testing]]
- [[_COMMUNITY_Architecture Foundation|Architecture Foundation]]
- [[_COMMUNITY_Note Detail & Reminders|Note Detail & Reminders]]
- [[_COMMUNITY_Onboarding & Localization|Onboarding & Localization]]
- [[_COMMUNITY_Timer Modal|Timer Modal]]
- [[_COMMUNITY_Module 28|Module 28]]
- [[_COMMUNITY_Module 29|Module 29]]
- [[_COMMUNITY_Module 40|Module 40]]
- [[_COMMUNITY_Module 41|Module 41]]
- [[_COMMUNITY_Module 42|Module 42]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 21 edges
2. `PeriodicSyncManager` - 18 edges
3. `useTranslation()` - 16 edges
4. `LocalDatabase` - 15 edges
5. `useOfflineQuery()` - 12 edges
6. `ConflictResolver` - 12 edges
7. `useOfflineMutation()` - 10 edges
8. `OfflineFirstTester` - 10 edges
9. `OfflineMigration` - 9 edges
10. `Timer` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Offline-First Architecture` --requires--> `Conflict Resolution`  [INFERRED]
  specs/005-phase-1-fixes/spec.md → utils/conflictResolution.ts
- `Offline-First Architecture` --requires--> `Periodic Background Sync`  [INFERRED]
  specs/005-phase-1-fixes/spec.md → utils/periodicSyncManager.ts
- `Offline-First Architecture` --requires--> `Offline Data Migration`  [INFERRED]
  specs/005-phase-1-fixes/spec.md → utils/offlineMigration.ts
- `Morning Due Tasks Summary (9AM)` --reminds_about--> `Todo (Task)`  [EXTRACTED]
  specs/003-phase-2-notification/spec.md → convex/schema.ts
- `Bug: Keyboard Blocks Confirm Button` --affects--> `Todo (Task)`  [EXTRACTED]
  fix02.md → convex/schema.ts

## Hyperedges (group relationships)
- **Task Status State Machine** — taskstatus_notstarted, taskstatus_notdone, taskstatus_inprogress, taskstatus_paused, taskstatus_done [EXTRACTED 1.00]
- **Notification System** — notification_entity, notification_timer_completion, notification_morning_summary, notification_evening_summary, notification_native_actions, notification_sound_settings [EXTRACTED 1.00]
- **Claymorphism Design System** — design_claymorphism, design_warm_palette, design_dualshadow_depth, design_task_card_clay, design_fab, design_typography_system [EXTRACTED 1.00]
- **Offline-First Architecture** — arch_offline_first, arch_cache_first, arch_mutation_system, concept_sync_manager, concept_periodic_sync, concept_conflict_resolution, concept_local_database, concept_offline_migration [EXTRACTED 1.00]
- **Product Design Philosophy** — product_purpose, product_clarity_over_density, product_momentum_matters, product_personality_no_gamification, product_inclusive_design [EXTRACTED 1.00]

## Communities (43 total, 9 thin omitted)

### Community 0 - "App Shell & Navigation"
Cohesion: 0.08
Nodes (10): AuthProvider(), useAuth(), useOfflineFirstData(), useOfflineFirstProjects(), useOfflineFirstTodos(), useOfflineFirstInit(), isEmptySingleResultCache(), useOfflineQuery() (+2 more)

### Community 1 - "Home Screen & Settings"
Cohesion: 0.08
Nodes (19): useDailyReminders(), useNotifications(), useTaskTimers(), handlePickImage(), handleSoundChange(), uploadImage(), cancelTaskNotification(), getAlarmSound() (+11 more)

### Community 2 - "Task Detail Modal"
Cohesion: 0.11
Nodes (9): handleBack(), handleClose(), handleDeleteSub(), handleUpdatePriority(), handleUpdateSubText(), performDelete(), saveDescription(), saveText() (+1 more)

### Community 3 - "Planner & Projects"
Cohesion: 0.07
Nodes (3): useOfflineMutation(), useScreenGuide(), pushMutationToQueue()

### Community 4 - "Bug Fixes & Features"
Cohesion: 0.08
Nodes (27): Cascade Deletion Pattern, Task Checklist, Issue: Concurrent Timer Edit Handling, Bug: Keyboard Blocks Confirm Button, Feature: Customizable Notification Sound, Bug: Notification Shows undefined Task Name, Bug: Subtask Creation in Detail Modal, Bug: Timer Edit Resets Elapsed Time (+19 more)

### Community 6 - "Offline Migration"
Cohesion: 0.19
Nodes (7): useSyncManager(), OfflineMigration, clearMutationQueue(), getCachedQuery(), getMutationQueue(), saveCachedQuery(), updateCachedQuery()

### Community 7 - "Design System"
Cohesion: 0.15
Nodes (17): Claymorphism Design System, Dual-Shadow Depth Model, Floating Action Button, Clay Task Card with Status Tint, Typography System (Soft/Bold Hierarchy), Warm Color Palette, Bug: Done Tasks in Today Section, Issue: FAB Button Design (+9 more)

### Community 8 - "Todo Card Components"
Cohesion: 0.15
Nodes (4): startTimer(), handleStartTimer(), moveToStatus(), showTaskCompletedNotification()

### Community 11 - "Architecture Foundation"
Cohesion: 0.2
Nodes (11): Cache-First Data Loading, Convex Backend (Real-time Sync), Offline Mutation Queue, Offline-First Architecture, Optimistic UI Updates, Conflict Resolution, Local SQLite Database, Offline Data Migration (+3 more)

### Community 12 - "Note Detail & Reminders"
Cohesion: 0.32
Nodes (4): handleSaveNote(), serializeBlocks(), onDateChange(), scheduleReminderNotification()

### Community 13 - "Onboarding & Localization"
Cohesion: 0.29
Nodes (7): i18n Localization (EN/AR), Screen Guide Tips, RTL & Arabic First-Class Support, Welcome Onboarding Flow, First-Launch Language Selection, Welcome Guide Slides, Design Principle: Inclusive by Design

## Knowledge Gaps
- **41 isolated node(s):** `Project Resource`, `User`, `Countdown Timer`, `Count-Up Timer`, `Auto-Complete on Timer Expiry` (+36 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `App Shell & Navigation` to `Home Screen & Settings`, `Task Detail Modal`, `Planner & Projects`, `Todo Card Components`, `Note Detail & Reminders`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `useOfflineMutation()` connect `Planner & Projects` to `App Shell & Navigation`, `Home Screen & Settings`, `Task Detail Modal`, `Todo Card Components`, `Note Detail & Reminders`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `useTranslation()` connect `App Shell & Navigation` to `Home Screen & Settings`, `Task Detail Modal`, `Planner & Projects`, `Todo Card Components`, `Note Detail & Reminders`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useAuth()` (e.g. with `useOfflineFirstInit()` and `useOfflineFirstData()`) actually correct?**
  _`useAuth()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Project Resource`, `User`, `Countdown Timer` to the rest of the system?**
  _41 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Shell & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Home Screen & Settings` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._