import type { LoginInput, RegisterInput } from "@/lib/validators/auth";

const usersStorageKey = "planes:users:v1";
const sessionStorageKey = "planes:session:v1";

type LocalUser = {
  email: string;
  name: string;
  passwordHash: string;
};

function readUsers(): LocalUser[] {
  try {
    return JSON.parse(window.localStorage.getItem(usersStorageKey) ?? "[]") as LocalUser[];
  } catch {
    return [];
  }
}

async function hashPassword(email: string, password: string) {
  const value = new TextEncoder().encode(`${email}:${password}`);
  const digest = await window.crypto.subtle.digest("SHA-256", value);

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function isAuthenticated() {
  return Boolean(window.localStorage.getItem(sessionStorageKey));
}

export async function registerLocalUser(values: RegisterInput) {
  const email = values.email.trim().toLowerCase();
  const users = readUsers();

  if (users.some((user) => user.email === email)) {
    return { error: "Пользователь с таким email уже существует" };
  }

  users.push({
    email,
    name: values.name.trim(),
    passwordHash: await hashPassword(email, values.password),
  });
  window.localStorage.setItem(usersStorageKey, JSON.stringify(users));

  return { error: null };
}

export async function signInLocal(values: LoginInput) {
  const email = values.email.trim().toLowerCase();
  const passwordHash = await hashPassword(email, values.password);
  const user = readUsers().find(
    (candidate) =>
      candidate.email === email && candidate.passwordHash === passwordHash,
  );

  if (!user) {
    return { error: "CredentialsSignin" };
  }

  window.localStorage.setItem(
    sessionStorageKey,
    JSON.stringify({ email: user.email, name: user.name }),
  );

  return { error: null };
}

export function signOutLocal() {
  window.localStorage.removeItem(sessionStorageKey);
}
