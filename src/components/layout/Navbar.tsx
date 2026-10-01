"use client";

import { LogOut, Menu, Plane, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebar-store";
import { signOutLocal } from "@/lib/client-auth";
import { Link, usePathname } from "@/lib/router";

const navItems = [
  { href: "/", label: { en: "Home", ru: "Главная" } },
  { href: "/about", label: { en: "About", ru: "О нас" } },
  { href: "/contacts", label: { en: "Contacts", ru: "Контакты" } },
];

const settingsStorageKey = "planes:settings:v1";
const settingsUpdatedEvent = "planes:settings-updated";
const profileUpdatedEvent = "planes:profile-updated";

type NavbarSettings = {
  darkMode?: boolean;
  language?: string;
  name?: string;
  photo?: string;
};

function getNavbarSettings(): NavbarSettings {
  if (typeof window === "undefined") {
    return {};
  }

  const storedValue = window.localStorage.getItem(settingsStorageKey);

  if (!storedValue) {
    return {};
  }

  try {
    return JSON.parse(storedValue) as NavbarSettings;
  } catch {
    return {};
  }
}

export function Navbar() {
  const pathname = usePathname();
  const navigate = useNavigate();
  const { isSidebarOpen, toggleSidebar } = useSidebarStore();
  const [navbarSettings, setNavbarSettings] = useState<NavbarSettings>({});

  useEffect(() => {
    function syncSettings() {
      setNavbarSettings(getNavbarSettings());
    }

    syncSettings();
    window.addEventListener("storage", syncSettings);
    window.addEventListener(settingsUpdatedEvent, syncSettings);
    window.addEventListener(profileUpdatedEvent, syncSettings);

    return () => {
      window.removeEventListener("storage", syncSettings);
      window.removeEventListener(settingsUpdatedEvent, syncSettings);
      window.removeEventListener(profileUpdatedEvent, syncSettings);
    };
  }, []);

  const avatarLetter =
    navbarSettings.name?.trim().charAt(0).toUpperCase() || "P";
  const language = navbarSettings.language === "en" ? "en" : "ru";
  const isDarkMode = navbarSettings.darkMode === true;
  const text = {
    en: {
      darkMode: "Dark mode",
      logout: "Log out",
      menu: "Open menu",
      profilePhoto: "Profile photo",
    },
    ru: {
      darkMode: "Темный режим",
      logout: "Выйти",
      menu: "Открыть меню",
      profilePhoto: "Фото профиля",
    },
  }[language];

  function toggleDarkMode() {
    const nextSettings = {
      ...navbarSettings,
      darkMode: !isDarkMode,
    };

    window.localStorage.setItem(settingsStorageKey, JSON.stringify(nextSettings));
    setNavbarSettings(nextSettings);
    window.dispatchEvent(new Event(settingsUpdatedEvent));
  }

  return (
    <header className="fixed left-0 top-0 z-40 w-full border-b border-emerald-950/10 bg-white/95 shadow-sm shadow-emerald-950/5 backdrop-blur">
      <div className="mx-auto flex h-[70px] max-w-[1400px] items-center gap-3 px-4 sm:px-6">
        <Button
          aria-label={text.menu}
          className={cn(
            "rounded-2xl hover:bg-[#f3f5f4]",
            isDarkMode ? "text-white hover:bg-slate-800" : "text-[#123c33]",
          )}
          onClick={toggleSidebar}
          size="icon"
          title={text.menu}
          variant="ghost"
        >
          {isSidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>

        <Link
          className="mr-2 flex items-center gap-2 rounded-2xl px-2 py-2 text-lg font-black text-[#123c33] transition hover:bg-[#f3f5f4]"
          href="/"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#123c33] text-white">
            <Plane className="h-5 w-5" />
          </span>
          Planes
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {navItems.map((item) => (
            <Link
              className={cn(
                "rounded-2xl px-4 py-2 text-sm font-semibold text-[#123c33] transition-colors hover:bg-[#f3f5f4]",
                pathname === item.href && "bg-[#f3f5f4]",
              )}
              href={item.href}
              key={item.href}
            >
              {item.label[language]}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            aria-pressed={isDarkMode}
            aria-label={text.darkMode}
            className={cn(
              "flex h-8 w-16 items-center rounded-full border p-1 transition",
              isDarkMode
                ? "border-blue-300/60 bg-slate-950 shadow-[0_0_18px_rgba(59,130,246,0.55)]"
                : "border-[#123c33]/25 bg-white hover:bg-[#f3f5f4]",
            )}
            onClick={toggleDarkMode}
            title={text.darkMode}
            type="button"
          >
            <span
              className={cn(
                "h-6 w-6 rounded-full transition-transform",
                isDarkMode
                  ? "translate-x-8 bg-blue-400 shadow-[0_0_14px_rgba(96,165,250,0.9)]"
                  : "translate-x-0 bg-[#123c33]",
              )}
            />
          </button>

          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#f3f5f4] text-sm font-black text-[#123c33]">
            {navbarSettings.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={text.profilePhoto}
                className="h-full w-full object-cover"
                src={navbarSettings.photo}
              />
            ) : (
              avatarLetter
            )}
          </div>
          <Button
            className={cn(
              "hidden rounded-2xl border-[#123c33]/15 hover:bg-[#f3f5f4] sm:inline-flex",
              isDarkMode
                ? "border-white/20 text-white hover:bg-slate-800"
                : "text-[#123c33]",
            )}
            onClick={() => {
              signOutLocal();
              navigate("/login", { replace: true });
            }}
            variant="outline"
          >
            <LogOut className="h-4 w-4" />
            {text.logout}
          </Button>
        </div>
      </div>
    </header>
  );
}
