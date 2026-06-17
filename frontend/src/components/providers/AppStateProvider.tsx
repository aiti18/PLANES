"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";

const internalUserIdKey = "planes:app-state-user-id";
const hydratedEvent = "planes:app-state-hydrated";
const settingsUpdatedEvent = "planes:settings-updated";

type AppStateEntry = {
  key: string;
  value: string;
};

type AppStateResponse = {
  entries: AppStateEntry[];
  userId: string;
};

function isTrackedStorageKey(key: string) {
  return (
    key !== internalUserIdKey &&
    (key.startsWith("planes:") || key.startsWith("planes-"))
  );
}

function readTrackedLocalEntries() {
  const entries: AppStateEntry[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (!key || !isTrackedStorageKey(key)) {
      continue;
    }

    const value = window.localStorage.getItem(key);

    if (value !== null) {
      entries.push({ key, value });
    }
  }

  return entries;
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const isRestoringRef = useRef(false);
  const pendingEntriesRef = useRef(new Map<string, string | null>());
  const flushTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let isDisposed = false;
    const storagePrototype = Object.getPrototypeOf(window.localStorage) as Storage;
    const originalSetItem = storagePrototype.setItem;
    const originalRemoveItem = storagePrototype.removeItem;

    function queueEntry(key: string, value: string | null) {
      if (isRestoringRef.current || !isTrackedStorageKey(key)) {
        return;
      }

      pendingEntriesRef.current.set(key, value);
      scheduleFlush();
    }

    function restorePending(entries: Array<[string, string | null]>) {
      entries.forEach(([key, value]) => {
        pendingEntriesRef.current.set(key, value);
      });
    }

    async function flushEntries() {
      if (flushTimerRef.current) {
        window.clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }

      const entries = Array.from(pendingEntriesRef.current.entries());

      if (entries.length === 0) {
        return;
      }

      pendingEntriesRef.current.clear();

      try {
        const response = await apiFetch("/api/app-state", {
          body: JSON.stringify({
            entries: entries.map(([key, value]) => ({ key, value })),
          }),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        });

        if (!response.ok && response.status !== 401) {
          restorePending(entries);
        }
      } catch {
        restorePending(entries);
      }
    }

    function flushEntriesWithBeacon() {
      const entries = Array.from(pendingEntriesRef.current.entries());

      if (entries.length === 0) {
        return;
      }

      pendingEntriesRef.current.clear();
      const body = JSON.stringify({
        entries: entries.map(([key, value]) => ({ key, value })),
      });
      void apiFetch("/api/app-state", {
        body,
        keepalive: true,
        method: "PATCH",
      }).catch(() => restorePending(entries));
    }

    function scheduleFlush() {
      if (flushTimerRef.current) {
        window.clearTimeout(flushTimerRef.current);
      }

      flushTimerRef.current = window.setTimeout(() => {
        void flushEntries();
      }, 500);
    }

    function patchedSetItem(this: Storage, key: string, value: string) {
      originalSetItem.call(this, key, value);

      if (this === window.localStorage) {
        queueEntry(key, value);
      }
    }

    function patchedRemoveItem(this: Storage, key: string) {
      originalRemoveItem.call(this, key);

      if (this === window.localStorage) {
        queueEntry(key, null);
      }
    }

    Object.defineProperty(storagePrototype, "setItem", {
      configurable: true,
      value: patchedSetItem,
    });
    Object.defineProperty(storagePrototype, "removeItem", {
      configurable: true,
      value: patchedRemoveItem,
    });

    async function hydrateAppState() {
      try {
        const response = await apiFetch("/api/app-state", { cache: "no-store" });

        if (response.status === 401) {
          return;
        }

        if (!response.ok) {
          throw new Error("Could not load app state");
        }

        const appState = (await response.json()) as AppStateResponse;
        const previousUserId = window.localStorage.getItem(internalUserIdKey);
        const localEntriesBeforeHydration = readTrackedLocalEntries();
        const remoteKeys = new Set(appState.entries.map((entry) => entry.key));

        isRestoringRef.current = true;

        if (previousUserId && previousUserId !== appState.userId) {
          localEntriesBeforeHydration.forEach((entry) => {
            window.localStorage.removeItem(entry.key);
          });
        }

        appState.entries.forEach((entry) => {
          window.localStorage.setItem(entry.key, entry.value);
        });
        window.localStorage.setItem(internalUserIdKey, appState.userId);

        isRestoringRef.current = false;

        if (!previousUserId || previousUserId === appState.userId) {
          localEntriesBeforeHydration.forEach((entry) => {
            if (!remoteKeys.has(entry.key)) {
              pendingEntriesRef.current.set(entry.key, entry.value);
            }
          });

          if (pendingEntriesRef.current.size > 0) {
            scheduleFlush();
          }
        }

        window.dispatchEvent(new Event(hydratedEvent));
        window.dispatchEvent(new Event(settingsUpdatedEvent));
      } catch {
        isRestoringRef.current = false;
      } finally {
        if (!isDisposed) {
          setIsReady(true);
        }
      }
    }

    function handlePageHide() {
      flushEntriesWithBeacon();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        flushEntriesWithBeacon();
      }
    }

    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    void hydrateAppState();

    return () => {
      isDisposed = true;

      if (flushTimerRef.current) {
        window.clearTimeout(flushTimerRef.current);
      }

      Object.defineProperty(storagePrototype, "setItem", {
        configurable: true,
        value: originalSetItem,
      });
      Object.defineProperty(storagePrototype, "removeItem", {
        configurable: true,
        value: originalRemoveItem,
      });
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}
