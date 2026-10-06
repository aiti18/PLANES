"use client";

import { Toaster } from "sonner";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/contexts/AuthContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <QueryProvider>
        <AppStateProvider>{children}</AppStateProvider>
        <Toaster
          closeButton
          duration={2500}
          richColors
          position="top-right"
        />
      </QueryProvider>
    </AuthProvider>
  );
}
