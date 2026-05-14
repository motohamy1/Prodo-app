import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

// In-memory fallback
const memoryStorage: Record<string, string> = {};

const safeStorage = {
  getItem: async (key: string) => {
    try {
      if (Platform.OS === "web") {
        return typeof localStorage !== "undefined" ? localStorage.getItem(key) : memoryStorage[key];
      }
      if (SecureStore && typeof SecureStore.getItemAsync === "function") {
        return await SecureStore.getItemAsync(key);
      }
      return memoryStorage[key] || null;
    } catch (error) {
      console.warn("AsyncStorage getItem failed, falling back to memory:", error);
      return memoryStorage[key] || null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      memoryStorage[key] = value;
      if (Platform.OS === "web") {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(key, value);
        }
        return;
      }
      if (SecureStore && typeof SecureStore.setItemAsync === "function") {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.warn("AsyncStorage setItem failed, using memory instead:", error);
    }
  },
};

export interface ColorScheme {
  bg: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  success: string;
  warning: string;
  danger: string;
  shadow: string;
  info: string;
  infoBg: string;
  successBg: string;
  warningBg: string;
  dangerBg: string;
  taskInProgressBg: string;
  taskNotStartedBg: string;
  taskDoneBg: string;
  taskPausedBg: string;
  taskNotDoneBg: string;
  gradients: {
    background: [string, string];
    surface: [string, string];
    primary: [string, string];
    success: [string, string];
    warning: [string, string];
    danger: [string, string];
    muted: [string, string];
    empty: [string, string];
  };
  backgrounds: {
    input: string;
    editInput: string;
  };
  surfaceText: string;
  statusBarStyle: "light-content" | "dark-content";
  radii: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
    tab: number;
  };
}

// ── Light Mode: Claymorphism ──────────────────────────────────────────
// Milky cream background, warm orange accent, soft clay depth on surfaces.
// Inner highlights simulate light hitting raised clay — gradients run
// lighter at top-left → base color at bottom-right.
const lightColors: ColorScheme = {
  bg: "#FFF8F0",
  surface: "#FFFEF9",
  text: "#1E1814",
  textMuted: "#8B7765",
  border: "#F0E0CC",
  primary: "#FF7E3D",
  success: "#2DB886",
  warning: "#E89300",
  danger: "#E84A45",
  info: "#5BA0D9",
  infoBg: "#F2EDE6",
  successBg: "#EAF5EC",
  warningBg: "#FFF3E0",
  dangerBg: "#FFF0EE",
  taskInProgressBg: "#FFF2E0",
  taskNotStartedBg: "#F8F0E6",
  taskDoneBg: "#EAF5EC",
  taskPausedBg: "#FDF0E0",
  taskNotDoneBg: "#FEEAE8",
  shadow: "#B8860B",
  gradients: {
    background: ["#FFF8F0", "#FFF3E6"],
    surface: ["#FFFCF7", "#FFFEF9"],
    primary: ["#FF924D", "#FF7E3D"],
    success: ["#40C492", "#2DB886"],
    warning: ["#F0A320", "#E89300"],
    danger: ["#EE6058", "#E84A45"],
    muted: ["#A08E7A", "#8B7765"],
    empty: ["#FFF5EC", "#F0E0CC"],
  },
  backgrounds: {
    input: "#FFFEF9",
    editInput: "#FFFBF6",
  },
  surfaceText: "#1E1814",
  statusBarStyle: "dark-content" as const,
  radii: {
    sm: 10,
    md: 16,
    lg: 20,
    xl: 26,
    full: 30,
    tab: 32,
  },
};

// ── Dark Mode: Claymorphism ───────────────────────────────────────────
// Obsidian canvas with clay depth on surfaces. Electric lime accent
// preserved. Inner highlights lift cards off the dark background.
const darkColors: ColorScheme = {
  bg: "#0F0F12",
  surface: "#1C1C21",
  surfaceText: "#FFFFFF",
  text: "#FFFFFF",
  textMuted: "#9494B8",
  border: "#2C2C35",
  primary: "#D4F82D",
  success: "#00E096",
  warning: "#FFB800",
  danger: "#FF5C77",
  info: "#5CB2FF",
  infoBg: "#121A2B",
  successBg: "#10261E",
  warningBg: "#2B2100",
  dangerBg: "#2B1014",
  taskInProgressBg: "#2B2000",
  taskNotStartedBg: "#1C1C21",
  taskDoneBg: "#10261E",
  taskPausedBg: "#201C14",
  taskNotDoneBg: "#2B1014",
  shadow: "#000000",
  gradients: {
    background: ["#0F0F12", "#0F0F12"],
    surface: ["#24242B", "#1C1C21"],
    primary: ["#D4F82D", "#C4E81D"],
    success: ["#00E096", "#00C58E"],
    warning: ["#FFB800", "#FFAB00"],
    danger: ["#FF5C77", "#FF4D6A"],
    muted: ["#2C2C35", "#1C1C21"],
    empty: ["#0F0F12", "#1C1C21"],
  },
  backgrounds: {
    input: "#1C1C21",
    editInput: "#1C1C21",
  },
  statusBarStyle: "light-content" as const,
  radii: {
    sm: 10,
    md: 16,
    lg: 20,
    xl: 26,
    full: 30,
    tab: 32,
  },
};

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  colors: ColorScheme;
}

const ThemeContext = createContext<undefined | ThemeContextType>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }): React.JSX.Element => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    safeStorage.getItem("darkMode").then((value) => {
      if (value) setIsDarkMode(JSON.parse(value));
    });
  }, []);

  const toggleDarkMode = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    await safeStorage.setItem("darkMode", JSON.stringify(newMode));
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default useTheme;