import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { LoginInput, RegisterInput } from "@/lib/validators/auth";
import {
  getAuthRedirectUrl,
  isSupabaseConfigured,
  supabase,
} from "@/lib/supabase";
import { getAuthErrorMessage } from "@/lib/supabase-errors";

type AuthResult = {
  confirmationRequired?: boolean;
  error: string | null;
};

type AuthContextValue = {
  configurationError: string | null;
  loading: boolean;
  session: Session | null;
  signIn: (values: LoginInput) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  signUp: (values: RegisterInput) => Promise<AuthResult>;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const configurationError = isSupabaseConfigured
    ? null
    : "Supabase не настроен";

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) {
        return;
      }

      setSession(error ? null : data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(
    async (values: RegisterInput): Promise<AuthResult> => {
      if (!supabase) {
        return { error: "Supabase ещё не настроен" };
      }

      const { data, error } = await supabase.auth.signUp({
        email: values.email.trim().toLowerCase(),
        password: values.password,
        options: {
          data: { name: values.name.trim() },
          emailRedirectTo: getAuthRedirectUrl(),
        },
      });

      if (error) {
        return { error: getAuthErrorMessage(error.message) };
      }

      return {
        confirmationRequired: Boolean(data.user && !data.session),
        error: null,
      };
    },
    [],
  );

  const signIn = useCallback(
    async (values: LoginInput): Promise<AuthResult> => {
      if (!supabase) {
        return { error: "Supabase ещё не настроен" };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });

      return { error: error ? getAuthErrorMessage(error.message) : null };
    },
    [],
  );

  const signOut = useCallback(async (): Promise<AuthResult> => {
    if (!supabase) {
      return { error: "Supabase ещё не настроен" };
    }

    const { error } = await supabase.auth.signOut();
    return { error: error ? getAuthErrorMessage(error.message) : null };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      configurationError,
      loading,
      session,
      signIn,
      signOut,
      signUp,
      user: session?.user ?? null,
    }),
    [configurationError, loading, session, signIn, signOut, signUp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
