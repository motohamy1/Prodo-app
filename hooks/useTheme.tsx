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

// ── Neomorphic Shadow Types ──────────────────────────────────────────

export interface NeoShadow {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export type NeoDepth = 'raised' | 'raisedLg' | 'pressed' | 'inset' | 'flat';

/**
 * Returns neomorphic shadow props, optionally mirrored for RTL.
 * In RTL mode the light source flips horizontally: dark shadow moves
 * to bottom-left, light highlight moves to top-right.
 */
export const getNeoShadow = (
  colors: ColorScheme,
  depth: NeoDepth,
  isRTL: boolean = false,
): { backgroundColor: string } & Partial<NeoShadow> => {
  const preset = colors.neomorphic[depth];
  if (depth === 'flat' || !('shadow' in preset)) {
    return { backgroundColor: preset.backgroundColor };
  }
  const sh = preset.shadow as NeoShadow;
  return {
    backgroundColor: preset.backgroundColor,
    shadowColor: sh.shadowColor,
    shadowOffset: {
      width: isRTL ? -sh.shadowOffset.width : sh.shadowOffset.width,
      height: sh.shadowOffset.height,
    },
    shadowOpacity: sh.shadowOpacity,
    shadowRadius: sh.shadowRadius,
    elevation: sh.elevation,
  };
};

// ── Color Scheme Interface ───────────────────────────────────────────

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
  neomorphic: {
    raised: {
      shadow: NeoShadow;
      backgroundColor: string;
    };
    raisedLg: {
      shadow: NeoShadow;
      backgroundColor: string;
    };
    pressed: {
      shadow: NeoShadow;
      backgroundColor: string;
    };
    inset: {
      shadow: NeoShadow;
      backgroundColor: string;
    };
    flat: {
      backgroundColor: string;
    };
  };
}

// ── Light Mode: Classic Neomorphism ──────────────────────────────────
// Monochrome gray scale. Single accent: steel gray (#4A4A4A).
// Every surface extrudes from the #E4E4E4 substrate with
// sharp opposing shadows (dark bottom-right, light top-left).
// Status is conveyed through extrusion depth, not color.

const lightColors: ColorScheme = {
  bg: "#E4E4E4",
  surface: "#E4E4E4",
  text: "#2D2D2D",
  textMuted: "#8C8C8C",
  border: "#D0D0D0",
  // Single accent: darkest gray on the page, reserved for CTAs
  primary: "#4A4A4A",
  // Semantic tones — all monochrome, distinguished by lightness
  success: "#555555",
  warning: "#666666",
  danger: "#777777",
  info: "#999999",
  // Alert/status backgrounds — tonal, no hue
  infoBg: "#E8E8E8",
  successBg: "#DADADA",
  warningBg: "#E0E0E0",
  dangerBg: "#DEDEDE",
  // Task status backgrounds — extrusion depth encoded as lightness
  taskInProgressBg: "#ECECEC",   // Maximum extrusion (raised)
  taskNotStartedBg: "#E4E4E4",   // Flush with background (flat)
  taskDoneBg: "#DADADA",         // Inset (embossed)
  taskPausedBg: "#E8E8E8",       // Moderate extrusion
  taskNotDoneBg: "#DEDEDE",      // Slightly darker than not-started
  shadow: "#B0B0B0",
  gradients: {
    background: ["#E4E4E4", "#E4E4E4"],
    surface: ["#EEEEEE", "#E8E8E8"],
    primary: ["#5A5A5A", "#4A4A4A"],
    success: ["#6A6A6A", "#555555"],
    warning: ["#7A7A7A", "#666666"],
    danger: ["#8A8A8A", "#777777"],
    muted: ["#ECECEC", "#E4E4E4"],
    empty: ["#E8E8E8", "#E4E4E4"],
  },
  backgrounds: {
    input: "#D8D8D8",     // Inset surface — darker than background
    editInput: "#E0E0E0",
  },
  surfaceText: "#2D2D2D",
  statusBarStyle: "dark-content" as const,
  radii: {
    sm: 10,
    md: 16,
    lg: 20,
    xl: 26,
    full: 30,
    tab: 32,
  },
  neomorphic: {
    raised: {
      shadow: {
        shadowColor: "#B0B0B0",
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
      },
      backgroundColor: "#ECECEC",
    },
    raisedLg: {
      shadow: {
        shadowColor: "#B0B0B0",
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
      },
      backgroundColor: "#ECECEC",
    },
    pressed: {
      shadow: {
        shadowColor: "#B0B0B0",
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
      },
      backgroundColor: "#DADADA",
    },
    inset: {
      shadow: {
        shadowColor: "#B0B0B0",
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 2,
      },
      backgroundColor: "#D8D8D8",
    },
    flat: {
      backgroundColor: "#E4E4E4",
    },
  },
};

// ── Dark Mode: Classic Neomorphism ───────────────────────────────────
// Monochrome dark scale. Single accent: light steel (#CCCCCC).
// Light-on-dark extrusion: raised surfaces are lighter than background.
// Dark shadow recedes, light highlight rises.

const darkColors: ColorScheme = {
  bg: "#2D2D30",
  surface: "#2D2D30",
  surfaceText: "#FFFFFF",
  text: "#FFFFFF",
  textMuted: "#A0A0A0",
  border: "#404045",
  // Single accent: lightest gray on the dark surface
  primary: "#CCCCCC",
  // Semantic tones — monochrome light-dark reversal
  success: "#AAAAAA",
  warning: "#999999",
  danger: "#888888",
  info: "#777777",
  // Alert/status backgrounds — tonal, no hue
  infoBg: "#3D3D40",
  successBg: "#28282C",
  warningBg: "#323236",
  dangerBg: "#303034",
  // Task status backgrounds — extrusion depth
  taskInProgressBg: "#36363A",   // Maximum extrusion
  taskNotStartedBg: "#2D2D30",   // Flush with background
  taskDoneBg: "#28282C",         // Inset
  taskPausedBg: "#323236",       // Moderate extrusion
  taskNotDoneBg: "#303034",      // Slightly lighter than not-started
  shadow: "#1A1A1C",
  gradients: {
    background: ["#2D2D30", "#2D2D30"],
    surface: ["#3D3D40", "#2D2D30"],
    primary: ["#DDDDDD", "#CCCCCC"],
    success: ["#BBBBBB", "#AAAAAA"],
    warning: ["#AAAAAA", "#999999"],
    danger: ["#999999", "#888888"],
    muted: ["#3D3D40", "#2D2D30"],
    empty: ["#2D2D30", "#3D3D40"],
  },
  backgrounds: {
    input: "#242428",     // Inset surface — darker than background
    editInput: "#3D3D40",
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
  neomorphic: {
    raised: {
      shadow: {
        shadowColor: "#1A1A1C",
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
      },
      backgroundColor: "#36363A",
    },
    raisedLg: {
      shadow: {
        shadowColor: "#1A1A1C",
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
      },
      backgroundColor: "#36363A",
    },
    pressed: {
      shadow: {
        shadowColor: "#1A1A1C",
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
      },
      backgroundColor: "#242428",
    },
    inset: {
      shadow: {
        shadowColor: "#1A1A1C",
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 2,
      },
      backgroundColor: "#242428",
    },
    flat: {
      backgroundColor: "#2D2D30",
    },
  },
};

// ── Theme Context & Provider ─────────────────────────────────────────

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
