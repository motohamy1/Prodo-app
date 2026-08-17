# to-do-app Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-08-17

## Active Technologies
- TypeScript / React Native (Expo) + Expo SDK 55+, expo-router, React Native (FlatList/FlashList) (002-task-status-logic)
- Convex (Shared Backend Persistence) (002-task-status-logic)
- TypeScript 5.3 + React Native, Expo SDK 55+, `expo-notifications` (003-phase-2-notification)
- Convex (Real-time backend), Local Storage for notification IDs (003-phase-2-notification)
- TypeScript 5.3 + React Native, Expo SDK 55+, `expo-router`, Convex (004-long-press-actions)
- TypeScript / Expo SDK 55+ + React Native, Expo, Convex (005-phase-1-fixes)
- Convex (Backend), AsyncStorage/Custom Offline Cache (005-phase-1-fixes)
- TypeScript / React Native (Expo SDK 55+) + Expo, React Native, React (006-phase-2-fixes)
- Convex backend, AsyncStorage / Memory Cache for offline (006-phase-2-fixes)
- TypeScript / React Native (Expo) + Expo Router, React Native KeyboardAvoidingView (007-phase-3-fixes)
- Convex (Backend), AsyncStorage (Local) (007-phase-3-fixes)
- TypeScript / React Native Expo + React Native, Expo (Router, Notifications, Icons), Convex (008-phase-4-to-6-fixes)
- Convex backend (remote), AsyncStorage (local user preferences) (008-phase-4-to-6-fixes)
- TypeScript 5.9+, React 19, React Native 0.86+ (Expo SDK 57) + `react-native-reanimated` (v4.5.1), `react-native-gesture-handler` (v2.32.0), `expo-router`, `expo-linear-gradient`, `expo-haptics`, `convex` (v1.32.0) (009-hero-scroll-stack)
- Convex real-time backend + AsyncStorage / SQLite offline mutation cache (009-hero-scroll-stack)
- TypeScript 5.9+, React Native 0.86+, Expo SDK 57+, React 19 + `expo-audio`, `expo-file-system`, `convex`, `react-native-reanimated`, `react-native-svg` (010-voice-notes-ai)
- Convex File Storage (`_storage`) for audio files; Convex `todos` table for structured note entities and transcripts; AsyncStorage for offline caching (010-voice-notes-ai)

- TypeScript / React Native (Expo SDK 55) + expo-router, @react-native-community/datetimepicker, convex, react-native-reanimated (001-add-reminder-screen)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript / React Native (Expo SDK 55): Follow standard conventions

## Recent Changes
- 010-voice-notes-ai: Added TypeScript 5.9+, React Native 0.86+, Expo SDK 57+, React 19 + `expo-audio`, `expo-file-system`, `convex`, `react-native-reanimated`, `react-native-svg`
- 009-hero-scroll-stack: Added TypeScript 5.9+, React 19, React Native 0.86+ (Expo SDK 57) + `react-native-reanimated` (v4.5.1), `react-native-gesture-handler` (v2.32.0), `expo-router`, `expo-linear-gradient`, `expo-haptics`, `convex` (v1.32.0)
- 008-phase-4-to-6-fixes: Added TypeScript / React Native Expo + React Native, Expo (Router, Notifications, Icons), Convex


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
