"use client";

import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <AppStateProvider>{children}</AppStateProvider>
      </AuthProvider>
      <Toaster richColors position="top-right" />
    </QueryProvider>
  );
}
