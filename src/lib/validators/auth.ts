import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email обязателен")
    .email("Введите корректный email"),
  password: z.string().min(6, "Пароль должен быть минимум 6 символов"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Имя обязательно"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email обязателен")
    .email("Введите корректный email"),
  password: z.string().min(6, "Пароль должен быть минимум 6 символов"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
