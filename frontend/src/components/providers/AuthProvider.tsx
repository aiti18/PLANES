"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  apiFetch,
  type AuthSession,
  type AuthUser,
  readAuthSession,
  writeAuthSession,
} from "@/lib/api";
import type { LoginInput, RegisterInput } from "@/lib/validators/auth";

type AuthContextValue = {
  isAuthenticated: boolean;
  isReady: boolean;
  login: (values: LoginInput) => Promise<void>;
  logout: () => void;
  register: (values: RegisterInput) => Promise<void>;
  session: AuthSession | null;
  user: AuthUser | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const publicRoutes = new Set(["/login", "/register"]);

function readPayloadSession(payload: unknown): AuthSession {
  const data = payload as {
    accessToken?: string;
    jwt?: string;
    session?: AuthSession;
    token?: string;
    user?: AuthUser;
  };
  const token =
    data.token ?? data.accessToken ?? data.jwt ?? data.session?.token ?? "";
  const user = data.user ?? data.session?.user;

  if (!token && !user) {
    throw new Error("Auth response did not include a session");
  }

  return { token, user };
}

async function readJson(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setSession(readAuthSession());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const isPublicRoute = publicRoutes.has(pathname);

    if (!session && !isPublicRoute) {
      router.replace("/login");
      return;
    }

    if (session && isPublicRoute) {
      router.replace("/");
    }
  }, [isReady, pathname, router, session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(session),
      isReady,
      async login(values) {
        const response = await apiFetch("/api/auth/login", {
          body: JSON.stringify(values),
          method: "POST",
        });
        const payload = await readJson(response);

        if (!response.ok) {
          const message =
            (payload as { message?: string } | null)?.message ??
            "Could not sign in";
          throw new Error(message);
        }

        const nextSession = readPayloadSession(payload);

        writeAuthSession(nextSession);
        setSession(nextSession);
      },
      logout() {
        writeAuthSession(null);
        setSession(null);
        router.replace("/login");
      },
      async register(values) {
        const response = await apiFetch("/api/register", {
          body: JSON.stringify(values),
          method: "POST",
        });
        const payload = await readJson(response);

        if (!response.ok) {
          const message =
            (payload as { message?: string } | null)?.message ??
            "Could not create account";
          throw new Error(message);
        }

        const loginResponse = await apiFetch("/api/auth/login", {
          body: JSON.stringify({
            email: values.email,
            password: values.password,
          }),
          method: "POST",
        });
        const loginPayload = await readJson(loginResponse);

        if (!loginResponse.ok) {
          const message =
            (loginPayload as { message?: string } | null)?.message ??
            "Account created. Please sign in.";
          throw new Error(message);
        }

        const nextSession = readPayloadSession(loginPayload);

        writeAuthSession(nextSession);
        setSession(nextSession);
      },
      session,
      user: session?.user ?? null,
    }),
    [isReady, router, session],
  );

  if (!isReady) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
