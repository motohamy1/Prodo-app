# Nizam (نظام) 👋

Nizam is a next-generation mobile productivity and life-operating application built with **Expo + React Native** and powered by **Convex**.

It helps users manage tasks, projects, planning, and reminders in one place, with support for:
- real-time sync,
- offline-first behavior,
- task timers,
- notifications,
- localization (including RTL),
- and theme customization.

---

## What this project provides

- A complete **To-Do management workflow** (create, update, organize, and track tasks).
- **Project-based organization** for grouping related work.
- **Daily planning** and structured productivity flows.
- **Timer-based focus tracking** for tasks and subtasks.
- **Reminder and notification support** with sound preferences.
- **Offline-first data handling** and sync conflict management utilities.
- **Cross-platform mobile app** experience through Expo (Android/iOS development workflow).

---

## Core Features

- ✅ Task creation and editing
- ✅ Priority / status oriented task handling
- ✅ Subtasks support
- ✅ Project grouping
- ✅ Daily planner flows
- ✅ Reminder/notification flows
- ✅ Timer utilities for productivity tracking
- ✅ Dark/light theme support
- ✅ i18n support (English and Arabic with RTL)
- ✅ Convex-backed real-time sync

---

## Tech Stack

- **Mobile App**: [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **Backend / Realtime Data**: [Convex](https://www.convex.dev/)
- **Localization**: `i18next`, `react-i18next`
- **Notifications & Device APIs**: Expo APIs
- **Persistence/Secure Storage**: `expo-secure-store`
- **Language**: TypeScript

---

## Project Structure (high level)

- `app/` – Application screens and route structure (Expo Router)
- `components/` – Reusable UI components (cards, modals, inputs, etc.)
- `hooks/` – Custom hooks (theme, auth, sync, timers, onboarding, notifications)
- `convex/` – Backend schema and serverless functions
- `utils/` – Supporting utilities (notifications, local storage, i18n, sync helpers)
- `assets/` – Images, icons, sounds, and style modules

---

## Getting Started

### 1) Prerequisites
- [Node.js](https://nodejs.org/) (LTS recommended)
- npm
- Expo Go app (or Android/iOS emulator)

### 2) Install dependencies
```bash
npm install
```

### 3) Run Convex (backend)
```bash
npx convex dev
```

### 4) Start Expo app
```bash
npx expo start -c
```

---

## Notes

- This repository includes product/design/spec documentation files (`PRODUCT.md`, `DESIGN.md`, `PLAN.md`, and `specs/`) used to guide development.
- Convex setup is required for full real-time backend behavior.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

Developed by [dr-tohamy](https://github.com/dr-tohamy)
