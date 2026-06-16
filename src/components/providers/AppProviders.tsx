"use client";

import { Toaster } from "sonner";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AppStateProvider>{children}</AppStateProvider>
      <Toaster richColors position="top-right" />
    </QueryProvider>
  );
}
