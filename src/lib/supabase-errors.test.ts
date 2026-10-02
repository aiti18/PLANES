import { describe, expect, it } from "vitest";
import { getAuthErrorMessage } from "@/lib/supabase-errors";

describe("Supabase authentication error messages", () => {
  it("maps technical authentication errors to user-facing messages", () => {
    expect(getAuthErrorMessage("User already registered")).toBe(
      "Пользователь с таким email уже существует",
    );
    expect(getAuthErrorMessage("Invalid login credentials")).toBe(
      "Неверный email или пароль",
    );
    expect(getAuthErrorMessage("Email not confirmed")).toBe(
      "Email ещё не подтверждён. Откройте письмо от Supabase и перейдите по ссылке",
    );
    expect(getAuthErrorMessage("Password should be at least 6 characters")).toBe(
      "Пароль не соответствует требованиям безопасности",
    );
    expect(getAuthErrorMessage("Failed to fetch")).toBe(
      "Нет соединения с сервером. Проверьте интернет и попробуйте снова",
    );
  });
});
