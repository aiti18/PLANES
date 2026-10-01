"use client";

import { Link } from "@/lib/router";
import { ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebar-store";

const sidebarItems = [
  { href: "/month", label: { en: "Month", ru: "Месяц" } },
  { href: "/week", label: { en: "Week", ru: "Неделя" } },
  { href: "/day", label: { en: "Day", ru: "День" } },
  { href: "/year-goals", label: { en: "Year Goals", ru: "Цели на год" } },
  { href: "/expenses", label: { en: "Income - Expenses", ru: "Доходы - Расходы" } },
  {
    href: "/savings-debts",
    label: { en: "Savings - Debts", ru: "Накопление - Долги" },
  },
  { href: "/indicators", label: { en: "Indicators", ru: "Показатели" } },
  { href: "/focus", label: { en: "Focus", ru: "Концентрация" } },
  { href: "/settings", label: { en: "Settings", ru: "Настройки" } },
];

const mobileNavbarItems = [
  { href: "/", label: { en: "Home", ru: "Главная" } },
  { href: "/about", label: { en: "About", ru: "О нас" } },
  { href: "/contacts", label: { en: "Contacts", ru: "Контакты" } },
];

const settingsStorageKey = "planes:settings:v1";
const settingsUpdatedEvent = "planes:settings-updated";

function getLanguage() {
  if (typeof window === "undefined") {
    return "ru";
  }

  const storedValue = window.localStorage.getItem(settingsStorageKey);

  if (!storedValue) {
    return "ru";
  }

  try {
    const settings = JSON.parse(storedValue) as { language?: string };
    return settings.language === "en" ? "en" : "ru";
  } catch {
    return "ru";
  }
}

export function Sidebar() {
  const { isSidebarOpen, openSidebar, closeSidebar } = useSidebarStore();
  const [language, setLanguage] = useState("ru");
  const sidebarRef = useRef<HTMLElement | null>(null);
  const openButtonRef = useRef<HTMLButtonElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const text = {
    en: {
      close: "Close menu",
      open: "Open side menu",
      planner: "Planner",
    },
    ru: {
      close: "Закрыть меню",
      open: "Открыть боковое меню",
      planner: "Планер",
    },
  }[language === "en" ? "en" : "ru"];

  useEffect(() => {
    function syncLanguage() {
      setLanguage(getLanguage());
    }

    syncLanguage();
    window.addEventListener("storage", syncLanguage);
    window.addEventListener(settingsUpdatedEvent, syncLanguage);

    return () => {
      window.removeEventListener("storage", syncLanguage);
      window.removeEventListener(settingsUpdatedEvent, syncLanguage);
    };
  }, []);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (
        !isSidebarOpen ||
        !(target instanceof Node) ||
        sidebarRef.current?.contains(target) ||
        openButtonRef.current?.contains(target)
      ) {
        return;
      }

      closeSidebar();
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [closeSidebar, isSidebarOpen]);

  useEffect(() => {
    function handleTouchStart(event: TouchEvent) {
      const touch = event.touches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
    }

    function handleTouchEnd(event: TouchEvent) {
      if (touchStartX.current === null || touchStartY.current === null) {
        return;
      }

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;

      if (Math.abs(deltaX) < 60 || Math.abs(deltaX) < Math.abs(deltaY)) {
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }

      if (!isSidebarOpen && touchStartX.current < 40 && deltaX > 0) {
        openSidebar();
      }

      if (isSidebarOpen && deltaX < 0) {
        closeSidebar();
      }

      touchStartX.current = null;
      touchStartY.current = null;
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [closeSidebar, isSidebarOpen, openSidebar]);

  return (
    <>
      <button
        aria-label={text.open}
        className={cn(
          "fixed left-0 top-[93px] z-30 hidden h-[650px] w-9 items-center justify-center rounded-r-md border border-l-0 border-emerald-900/20 bg-white text-emerald-950 shadow-sm transition-transform hover:bg-emerald-50 lg:flex",
          isSidebarOpen && "-translate-x-full",
        )}
        onClick={openSidebar}
        ref={openButtonRef}
        title={text.open}
        type="button"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/45 transition-opacity md:hidden",
          isSidebarOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={closeSidebar}
      />

      <aside
        className={cn(
          "fixed left-0 top-[70px] z-50 h-[calc(100dvh-70px)] w-72 border-r border-emerald-900/15 bg-white transition-transform duration-300 ease-in-out md:z-30",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
        ref={sidebarRef}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center justify-between border-b border-emerald-900/15 px-4">
            <p className="text-sm font-black uppercase text-emerald-950">
              {text.planner}
            </p>
            <Button
              aria-label={text.close}
              size="icon"
              variant="ghost"
              onClick={closeSidebar}
              title={text.close}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
            <div className="mb-2 border-b border-emerald-900/10 pb-2 sm:hidden">
              {mobileNavbarItems.map((item) => (
                <Link
                  className="block rounded-md border border-transparent px-3 py-2.5 text-sm font-semibold text-emerald-950 transition-colors hover:border-emerald-900/15 hover:bg-emerald-50"
                  href={item.href}
                  key={item.href}
                  onClick={closeSidebar}
                >
                  {item.label[language === "en" ? "en" : "ru"]}
                </Link>
              ))}
            </div>

            {sidebarItems.map((item) => (
              <Link
                className="rounded-md border border-transparent px-3 py-2.5 text-sm font-semibold text-emerald-950 transition-colors hover:border-emerald-900/15 hover:bg-emerald-50"
                href={item.href}
                key={item.href}
                onClick={closeSidebar}
              >
                {item.label[language === "en" ? "en" : "ru"]}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
