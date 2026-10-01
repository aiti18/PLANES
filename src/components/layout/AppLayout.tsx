"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { NotificationBridge } from "@/components/notifications/NotificationBridge";
import { usePathname } from "@/lib/router";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const settingsStorageKey = "planes:settings:v1";
const settingsUpdatedEvent = "planes:settings-updated";

function getDarkMode() {
  if (typeof window === "undefined") {
    return false;
  }

  const storedValue = window.localStorage.getItem(settingsStorageKey);

  if (!storedValue) {
    return false;
  }

  try {
    const settings = JSON.parse(storedValue) as { darkMode?: boolean };
    return settings.darkMode === true;
  } catch {
    return false;
  }
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isNavbarPage = pathname === "/" || pathname === "/about" || pathname === "/contacts";
  const layoutRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function syncDarkMode() {
      layoutRef.current?.classList.toggle("planes-dark", getDarkMode());
    }

    syncDarkMode();
    window.addEventListener("storage", syncDarkMode);
    window.addEventListener(settingsUpdatedEvent, syncDarkMode);

    return () => {
      window.removeEventListener("storage", syncDarkMode);
      window.removeEventListener(settingsUpdatedEvent, syncDarkMode);
    };
  }, []);

  return (
    <div
      className="min-h-dvh bg-background text-foreground"
      ref={layoutRef}
    >
      <Navbar />
      <Sidebar />
      <NotificationBridge />
      <main
        className={cn(
          "min-h-[calc(100dvh-70px)] pb-6 pt-[94px]",
          isNavbarPage
            ? "px-3 sm:px-5"
            : "px-3 sm:px-4 lg:pl-[45px] lg:pr-[5px]",
        )}
      >
        <div className="w-full">{children}</div>
      </main>
      {isNavbarPage && <Footer />}
    </div>
  );
}
