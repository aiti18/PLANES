"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  createAvatarUrl,
  loadProfile,
  removeAvatar,
  updateProfileName,
  uploadAvatar,
} from "@/lib/supabase-profile";
import { loadUserSettings, saveUserSettings } from "@/lib/supabase-data";

export type AppSettings = {
  accentColor: "green" | "blue" | "graphite";
  autoSave: boolean;
  compactMode: boolean;
  currency: string;
  darkMode: boolean;
  emailNotifications: boolean;
  language: "en" | "ru";
  monthlyReport: boolean;
  name: string;
  photo: string;
  privateMode: boolean;
  pushNotifications: boolean;
};

export const defaultAppSettings: AppSettings = {
  accentColor: "green",
  autoSave: true,
  compactMode: false,
  currency: "KGS",
  darkMode: false,
  emailNotifications: true,
  language: "ru",
  monthlyReport: true,
  name: "Пользователь Planes",
  photo: "",
  privateMode: false,
  pushNotifications: false,
};

type AppStateContextValue = {
  avatarPath: string | null;
  isReady: boolean;
  refreshProfile: () => Promise<void>;
  removeProfileAvatar: () => Promise<void>;
  settings: AppSettings;
  updateSettings: (nextSettings: Partial<AppSettings>) => void;
  uploadProfileAvatar: (file: File) => Promise<void>;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState(defaultAppSettings);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const loadedUserId = useRef<string | null>(null);

  const refreshProfile = useCallback(async () => {
    const profile = await loadProfile();
    const photo = profile.avatar_path
      ? await createAvatarUrl(profile.avatar_path)
      : "";

    setAvatarPath(profile.avatar_path);
    setSettings((current) => ({
      ...current,
      name: profile.name || defaultAppSettings.name,
      photo,
    }));
  }, []);

  useEffect(() => {
    let active = true;

    if (!user) {
      loadedUserId.current = null;
      setSettings(defaultAppSettings);
      setAvatarPath(null);
      setIsReady(false);
      return () => {
        active = false;
      };
    }

    setIsReady(false);
    void Promise.all([loadUserSettings<Partial<AppSettings>>(), loadProfile()])
      .then(async ([storedSettings, profile]) => {
        const photo = profile.avatar_path
          ? await createAvatarUrl(profile.avatar_path)
          : "";

        if (!active) return;

        setAvatarPath(profile.avatar_path);
        setSettings({
          ...defaultAppSettings,
          ...(storedSettings ?? {}),
          language: storedSettings?.language === "en" ? "en" : "ru",
          darkMode: storedSettings?.darkMode === true,
          name: profile.name || defaultAppSettings.name,
          photo,
        });
        loadedUserId.current = user.id;
      })
      .catch((error) => {
        console.error("Failed to load user settings", error);
      })
      .finally(() => {
        if (active) setIsReady(true);
      });

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !isReady || loadedUserId.current !== user.id) return;

    const timeoutId = window.setTimeout(() => {
      const { name, photo: _photo, ...storedSettings } = settings;

      void Promise.all([
        saveUserSettings(storedSettings),
        updateProfileName(name),
      ]).catch((error) => {
        console.error("Failed to save user settings", error);
      });
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [isReady, settings, user]);

  const updateSettings = useCallback((nextSettings: Partial<AppSettings>) => {
    setSettings((current) => ({ ...current, ...nextSettings }));
  }, []);

  const uploadProfileAvatar = useCallback(
    async (file: File) => {
      await uploadAvatar(file);
      await refreshProfile();
    },
    [refreshProfile],
  );

  const removeProfileAvatar = useCallback(async () => {
    if (avatarPath) await removeAvatar(avatarPath);
    setAvatarPath(null);
    setSettings((current) => ({ ...current, photo: "" }));
  }, [avatarPath]);

  const value = useMemo<AppStateContextValue>(
    () => ({
      avatarPath,
      isReady,
      refreshProfile,
      removeProfileAvatar,
      settings,
      updateSettings,
      uploadProfileAvatar,
    }),
    [
      avatarPath,
      isReady,
      refreshProfile,
      removeProfileAvatar,
      settings,
      updateSettings,
      uploadProfileAvatar,
    ],
  );

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) throw new Error("useAppState must be used inside AppStateProvider");

  return context;
}
