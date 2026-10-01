import { beforeEach, describe, expect, it } from "vitest";
import {
  isAuthenticated,
  registerLocalUser,
  signInLocal,
  signOutLocal,
} from "@/lib/client-auth";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const localStorage = new MemoryStorage();

Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: { crypto: globalThis.crypto, localStorage },
});

describe("local authentication", () => {
  beforeEach(() => localStorage.clear());

  it("registers, signs in, persists the session and signs out", async () => {
    const account = {
      email: "demo@example.com",
      name: "Demo",
      password: "secret123",
    };

    await expect(registerLocalUser(account)).resolves.toEqual({ error: null });
    await expect(registerLocalUser(account)).resolves.toEqual({
      error: "Пользователь с таким email уже существует",
    });
    await expect(
      signInLocal({ email: account.email, password: "incorrect" }),
    ).resolves.toEqual({ error: "CredentialsSignin" });
    await expect(signInLocal(account)).resolves.toEqual({ error: null });
    expect(isAuthenticated()).toBe(true);

    signOutLocal();
    expect(isAuthenticated()).toBe(false);
  });
});
