"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { NotificationBridge } from "@/components/notifications/NotificationBridge";
import { usePathname } from "@/lib/router";
import { cn } from "@/lib/utils";
import { useAppState } from "@/components/providers/AppStateProvider";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { settings } = useAppState();
  const isNavbarPage = pathname === "/" || pathname === "/about" || pathname === "/contacts";

  return (
    <div
      className={cn(
        "min-h-dvh bg-background text-foreground",
        settings.darkMode && "planes-dark",
      )}
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
