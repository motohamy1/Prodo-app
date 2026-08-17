# 🚀 Prodo — Next-Generation AI Productivity & Life Operating System

> **Prodo** is an AI-powered, offline-first productivity and life management application built with **React Native (Expo SDK 57)**, **TypeScript**, and a reactive real-time **Convex** cloud backend. Designed with fluid aesthetics, Arabic/English bilingual RTL support, and multi-tier project architectures, Prodo combines fast daily execution with long-range planning.

---

## 🌟 Key Advantages & Highlights

- **⚡ Zero-Latency Real-Time Reactivity**: Powered by Convex live WebSocket subscriptions with automatic multi-device synchronization.
- **📶 Offline-First Engine**: Complete local caching and offline mutation queues with smart conflict resolution so you never lose a thought or task offline.
- **🎙️ Voice Intelligence**: Instant high-fidelity voice recording with interactive live audio waveforms and AI-assisted transcription & task extraction.
- **🎨 Premium UI / UX Architecture**: Asymmetrical layered wavy headers, tactile haptics (`LivePress`), breathing micro-animations, and high-contrast Neo Lime styling.
- **🌐 Full Arabic & English Bilingual Localization**: Native right-to-left (RTL) mirroring and contextual translations across every screen and component.
- **🛡️ Rock-Solid Architecture**: Strict TypeScript type safety, modular design systems, and background audio/alarm scheduling.

---

## 📱 Comprehensive Feature Breakdown

### 1. 🏠 Home & Daily Execution Engine
- **Horizontal DateBar Carousel**:
  - Month-scrolling date strip with task density indicator dots.
  - **5-Second Idle Auto-Return**: Automatically springs back to the active day after scrolling through dates.
  - Quick "Today" reset badge with dropdown calendar date picker.
- **Interactive 3D ScrollStack**:
  - **Today's Checklist Card**: Quick-toggle completion with nested scroll protection.
  - **Eisenhower Priority Card**: Urgent vs. Important categorization matrix.
  - **Active Spaces Card**: Real-time project completion and workspace progress bars.
  - **Habit Streaks Card**: Daily habit consistency tracker.
- **Live Interactive Kanban Board**:
  - 3-column workflow: *To Do*, *In Progress*, and *Done*.
  - Task status transitions, priority tags (*Urgent*, *High*, *Medium*, *Low*), and linked project pills.
  - Inline stopwatch and countdown timer controls directly on tasks.
- **Floating Action Button (FAB)**:
  - Breathing ambient micro-animation with high-energy Neo Lime (`#D4FF00`) and dark contrast typography.

---

### 2. 🎙️ Voice Notes & AI Brainstorming
- **Interactive Siri Waveforms**:
  - Real-time animated canvas reacting dynamically to microphone audio amplitude during recordings.
- **Multi-Mode Input**:
  - **Voice Input**: One-tap voice dictation with automatic hashtag classification and transcription.
  - **Type Mode**: Instant direct navigation to the full rich-text note editor.
- **Note Detail & Rich Editor**:
  - Title, rich body text, formatting tools, custom checklist blocks (`☐`/`☑`), and audio playback controls.
  - Custom reminder scheduling with date/time pickers and notification integration.
  - Filter notes by custom hashtags (`#work`, `#dev`, `#study`, `#personal`).

---

### 3. 📅 Multi-View Day & Month Planner
- **Month Grid View**:
  - Clean monthly calendar overview with task activity heatmaps and milestone dots.
- **Day Timeline Schedule**:
  - Continuous 24-hour vertical timeline with block collision detection and customizable time-slots.
  - Drag-to-time scheduling and AM/PM time pickers.
- **Yearly & Long-Term Goals**:
  - Year-at-a-glance roadmap broken down by quarters (Q1–Q4).
  - Target tracking with unit progress bars and status toggles.

---

### 4. 🗂️ Spaces & Hierarchical Project Workspaces
- **Layered 3D Project Folders**:
  - Tactile physical folder styling with custom color palettes (Golden Yellow, Royal Blue, Lavender, Lime, etc.).
  - **Stack Peeking Cards**:
    - **Hashtag Card**: Displays the parent space/category hashtag.
    - **Item Counts Card**: Displays live numbers of tasks, checklists, and items inside.
    - **Icon Sticker Card**: Displays the project badge.
- **Multi-Tier Organization**:
  - **Spaces (Categories)** $\rightarrow$ **Sub-Categories** $\rightarrow$ **Projects**.
- **Project Detail Workspaces**:
  - **Hero Overview**: Dynamic progress bar (`%` done) and status chips (*Active*, *Completed*, *On Hold*).
  - **Toggle Notes & Guidelines**: Collapsible SOPs, guidelines, and reference notes.
  - **Project Checklists**: Independent unit checklist items.
  - **Linked Tasks**: Dedicated task list synced with the global Kanban board.
  - **Multi-Source Resources Manager**:
    - 📄 **Device Files**: Upload and attach any local file (PDFs, Word docs, spreadsheets, zip archives).
    - 🖼️ **Gallery Photos**: Attach screenshots, photos, and media assets.
    - 🌐 **Remote Web Links**: Add external URLs (Figma, GitHub, Notion, web documentation) with in-app browser opening.
    - 📝 **Notes & Memos**: Attach contextual text snippets.

---

### 5. 📊 Insights & Analytics
- **Productivity Scoring**: Weekly completion velocity and performance trends.
- **Category & Project Distribution**: Visual breakdown of where your time and focus are allocated.
- **Focus Streaks**: Streak counters to encourage daily consistency.

---

### 6. ⚙️ Settings, Customization & Reliability
- **Theme Modes**: Seamless Dark Mode (`#0E0F14`) and Light Mode (`#F8FAFC`) with tailored HSL tokens.
- **Language Switcher**: Instant Arabic and English toggle without app reload.
- **Alarm & Sound Tones**: Custom alarm notification sounds (`alarm_tone.wav`) and exact background alarms.
- **Conflict Resolution Engine**: Automatically resolves sync differences when switching between offline and online states.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | React Native (Expo SDK 57), Expo Router (Typed Routes) |
| **Backend & Database** | Convex (Real-time Cloud Database, Functions & Storage) |
| **State & Data** | React Hooks, Offline Cache & Convex Reactive Live Queries |
| **Animations** | React Native Reanimated, Expo Audio, SVG Curves (`react-native-svg`) |
| **Hardware & Native** | Expo Notifications, Exact Alarm Manager, Document Picker, Image Picker |
| **Localization** | Custom i18n Translation Engine (Arabic RTL / English LTR) |

---

## 🚀 Building & Running the Project

### Development Server
```bash
npx expo start --clear
```

### Convex Backend Dev
```bash
npx convex dev
```

### Build Android APK (EAS)
```bash
eas build -p android --profile preview
```
