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
  bg: "#151120",
  surface: "#1E1830",
  surfaceHigh: "#292045",
  text: "#F4F0FA",
  textMuted: "#9C92BE",
  border: "#352B54",
  primary: "#EC9A33",
  primaryText: "#1C1330",
  success: "#4EE6C1",
  warning: "#F2B544",
  danger: "#F4789C",
  info: "#A89CFF",
  shadow: "#0A0714",
  infoBg: "#251E44",
  successBg: "#13282E",
  warningBg: "#2B2214",
  dangerBg: "#2D1926",
  taskInProgressBg: "#241C3C",
  taskNotStartedBg: "#1E1830",
  taskDoneBg: "#13282E",
  taskPausedBg: "#251F38",
  taskNotDoneBg: "#2D1926",
  surfaceText: "#F4F0FA",
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
      shadowColor: "#0A0714",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.45,
      shadowRadius: 6,
      elevation: 3,
    },
    md: {
      shadowColor: "#0A0714",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.50,
      shadowRadius: 12,
      elevation: 6,
    },
    lg: {
      shadowColor: "#0A0714",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.55,
      shadowRadius: 20,
      elevation: 10,
    },
    glow: {
      shadowColor: "#F2B544",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 18,
      elevation: 8,
    },
    auroraGlow: {
      shadowColor: "#4EE6C1",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 14,
      elevation: 6,
    },
  },
};

const lightColors: ColorScheme = {
  bg: "#F6F3FB",
  surface: "#FFFFFF",
  surfaceHigh: "#FDFCFF",
  text: "#251D3A",
  textMuted: "#7B7199",
  border: "#E6DFF3",
  primary: "#C08210",
  primaryText: "#FFFFFF",
  success: "#0C9C81",
  warning: "#C08210",
  danger: "#D64E74",
  info: "#7466E8",
  shadow: "#4A3A78",
  infoBg: "#EEEBFD",
  successBg: "#E2F7F1",
  warningBg: "#FBF0DA",
  dangerBg: "#FBE6ED",
  taskInProgressBg: "#FBF7EE",
  taskNotStartedBg: "#FFFFFF",
  taskDoneBg: "#E2F7F1",
  taskPausedBg: "#F7F4FB",
  taskNotDoneBg: "#FBE6ED",
  surfaceText: "#251D3A",
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
      shadowColor: "#4A3A78",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.10,
      shadowRadius: 6,
      elevation: 2,
    },
    md: {
      shadowColor: "#4A3A78",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.13,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: "#4A3A78",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius: 20,
      elevation: 8,
    },
    glow: {
      shadowColor: "#E9A93A",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.28,
      shadowRadius: 16,
      elevation: 6,
    },
    auroraGlow: {
      shadowColor: "#0C9C81",
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
