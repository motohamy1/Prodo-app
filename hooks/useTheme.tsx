import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

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
      console.warn("Storage getItem failed:", error);
      return memoryStorage[key] || null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      memoryStorage[key] = value;
      if (Platform.OS === "web") {
        if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
        return;
      }
      if (SecureStore && typeof SecureStore.setItemAsync === "function") {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.warn("Storage setItem failed:", error);
    }
  },
};

export interface ShadowPreset {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface ColorScheme {
  bg: string;
  surface: string;
  surfaceHigh: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryText: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  shadow: string;
  infoBg: string;
  successBg: string;
  warningBg: string;
  dangerBg: string;
  taskInProgressBg: string;
  taskNotStartedBg: string;
  taskDoneBg: string;
  taskPausedBg: string;
  taskNotDoneBg: string;
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
  shadows: {
    sm: ShadowPreset;
    md: ShadowPreset;
    lg: ShadowPreset;
    glow: ShadowPreset;
    auroraGlow: ShadowPreset;
  };
}

const darkColors: ColorScheme = {
  bg: "#0F172A",
  surface: "#1E293B",
  surfaceHigh: "#334155",
  text: "#F8FAFC",
  textMuted: "#94A3B8",
  border: "#334155",
  primary: "#6366F1",
  primaryText: "#FFFFFF",
  success: "#34D399",
  warning: "#FBBF24",
  danger: "#F87171",
  info: "#60A5FA",
  shadow: "#000000",
  infoBg: "#1E3A8A",
  successBg: "#064E3B",
  warningBg: "#78350F",
  dangerBg: "#7F1D1D",
  taskInProgressBg: "#2B2F5C",
  taskNotStartedBg: "#1D1F3E",
  taskDoneBg: "#064E3B",
  taskPausedBg: "#1D1F3E",
  taskNotDoneBg: "#7F1D1D",
  surfaceText: "#F8FAFC",
  statusBarStyle: "light-content" as const,
  radii: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 24,
    tab: 20,
  },
  shadows: {
    sm: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.45,
      shadowRadius: 6,
      elevation: 3,
    },
    md: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.50,
      shadowRadius: 12,
      elevation: 6,
    },
    lg: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.55,
      shadowRadius: 20,
      elevation: 10,
    },
    glow: {
      shadowColor: "#6366F1",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 18,
      elevation: 8,
    },
    auroraGlow: {
      shadowColor: "#34D399",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 14,
      elevation: 6,
    },
  },
};

const lightColors: ColorScheme = {
  bg: "#FCF8ED",
  surface: "#FFFFFF",
  surfaceHigh: "#F4ECD8",
  text: "#292524",
  textMuted: "#78716C",
  border: "#E6DEC8",
  primary: "#E15A3E",
  primaryText: "#FFFFFF",
  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
  info: "#0284C7",
  shadow: "#44403C",
  infoBg: "#E0F2FE",
  successBg: "#D1FAE5",
  warningBg: "#FEF3C7",
  dangerBg: "#FEE2E2",
  taskInProgressBg: "#FFE8E0",
  taskNotStartedBg: "#FFF8F5",
  taskDoneBg: "#D1FAE5",
  taskPausedBg: "#F4ECD8",
  taskNotDoneBg: "#FEE2E2",
  surfaceText: "#1C1917",
  statusBarStyle: "dark-content" as const,
  radii: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 24,
    tab: 20,
  },
  shadows: {
    sm: {
      shadowColor: "#44403C",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
    },
    md: {
      shadowColor: "#44403C",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: "#44403C",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius: 20,
      elevation: 8,
    },
    glow: {
      shadowColor: "#E15A3E",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.28,
      shadowRadius: 16,
      elevation: 6,
    },
    auroraGlow: {
      shadowColor: "#059669",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 12,
      elevation: 4,
    },
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
