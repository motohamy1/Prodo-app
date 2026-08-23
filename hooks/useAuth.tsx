import { Id } from "@/convex/_generated/dataModel";
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
      console.warn("Storage setItem failed");
    }
  },
  removeItem: async (key: string) => {
    try {
      delete memoryStorage[key];
      if (Platform.OS === "web") {
        if (typeof localStorage !== "undefined") {
          localStorage.removeItem(key);
        }
        return;
      }
      if (SecureStore && typeof SecureStore.deleteItemAsync === "function") {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.warn("Storage removeItem failed");
    }
  }
};

import { api } from '@/convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';

interface AuthContextType {
  userId: Id<"users"> | null;
  user: any | null;
  isLoading: boolean;
  isAnonymous: boolean;
  language: string;
  notificationsEnabled: boolean;
  userName: string | null;
  userEmail: string | null;
  signIn: (id: Id<"users">) => Promise<void>;
  signOut: () => Promise<void>;
  linkAccount: (id: Id<"users">) => Promise<void>;
  setLanguage: (lang: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingLanguage, setPendingLanguage] = useState<string | null>(null);
  
  const createAnonMutation = useMutation(api.auth.createAnonymousUser);
  const updateSettingsMutation = useMutation(api.auth.updateSettings);
  const isLocalGuest = typeof userId === 'string' && userId.startsWith('guest_');
  const user = useQuery(api.auth.getUserSettings, (userId && !isLocalGuest) ? { userId } : "skip");

  useEffect(() => {
    const initAuth = async () => {
      try {
        const id = await safeStorage.getItem("userId");
        if (id && !id.startsWith("guest_")) {
          setUserId(id as Id<"users">);
        } else {
          // If no ID or if ID is a temporary local guest ID, attempt silent guest auth on Convex
          try {
            const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 3000));
            const newAnonId = await Promise.race([createAnonMutation(), timeoutPromise]);
            setUserId(newAnonId);
            await safeStorage.setItem("userId", newAnonId);
          } catch (netErr) {
            // Offline fallback: keep existing guest ID or generate a new local anonymous ID
            const localAnonId = (id && id.startsWith("guest_") ? id : `guest_${Date.now()}_${Math.floor(Math.random() * 10000)}`) as Id<"users">;
            setUserId(localAnonId);
            await safeStorage.setItem("userId", localAnonId);
          }
        }
      } catch (error) {
        console.warn("Auth initialization failed", error);
        const fallbackId = (`guest_${Date.now()}`) as Id<"users">;
        setUserId(fallbackId);
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();
  }, []);

  // Background auto-upgrade: whenever connected and userId is a temporary guest ID, upgrade to real Convex user
  useEffect(() => {
    if (userId && typeof userId === 'string' && userId.startsWith('guest_')) {
      createAnonMutation()
        .then(async (newAnonId) => {
          console.log('Successfully upgraded guest session to Convex user:', newAnonId);
          setUserId(newAnonId);
          await safeStorage.setItem("userId", newAnonId);
        })
        .catch((err) => {
          // Will retry next launch or when network is available
          console.log('Guest upgrade deferred (offline / waiting):', err?.message || err);
        });
    }
  }, [userId]);

  const signIn = async (id: Id<"users">) => {
    setUserId(id);
    await safeStorage.setItem("userId", id);
  };

  const signOut = async () => {
    try {
      // Create a fresh anonymous account so app stays functional without restart
      const newAnonId = await createAnonMutation();
      setUserId(newAnonId);
      await safeStorage.setItem("userId", newAnonId);
    } catch (error) {
      console.warn("Sign out failed to create new anonymous session:", error);
      // Clear storage so next app launch creates a fresh anon session
      setUserId(null);
      await safeStorage.removeItem("userId");
    }
  };

  const linkAccount = async (id: Id<"users">) => {
    setUserId(id);
    await safeStorage.setItem("userId", id);
  };

  const setLanguage = async (lang: string) => {
    setPendingLanguage(lang);
    if (userId) {
      try {
        await updateSettingsMutation({ userId, language: lang });
      } catch (e) {
        console.warn('Failed to update language', e);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      userId, 
      user,
      isLoading, 
      isAnonymous: user ? (user.isAnonymous ?? false) : true,
      language: user?.language ?? pendingLanguage ?? "en",
      notificationsEnabled: user?.notificationsEnabled ?? true,
      userName: user?.name ?? null,
      userEmail: user?.email ?? null,
      signIn, 
      signOut,
      linkAccount,
      setLanguage,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
