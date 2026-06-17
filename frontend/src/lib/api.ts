export const authStorageKey = "planes:auth:v1";

export type AuthUser = {
  email?: string;
  id?: string;
  name?: string;
  profilePhoto?: string;
};

export type AuthSession = {
  token?: string;
  user?: AuthUser;
};

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
}

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const baseUrl = getApiBaseUrl();

  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
}

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedValue = window.localStorage.getItem(authStorageKey);

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as AuthSession;
  } catch {
    window.localStorage.removeItem(authStorageKey);
    return null;
  }
}

export function writeAuthSession(session: AuthSession | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(authStorageKey);
    window.dispatchEvent(new Event("planes:auth-updated"));
    return;
  }

  window.localStorage.setItem(authStorageKey, JSON.stringify(session));
  window.dispatchEvent(new Event("planes:auth-updated"));
}

export function getAuthToken() {
  return readAuthSession()?.token ?? "";
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = getAuthToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(apiUrl(path), {
    ...init,
    credentials: "include",
    headers,
  });
}
