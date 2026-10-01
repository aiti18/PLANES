"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RegisterInput, registerSchema } from "@/lib/validators/auth";
import { registerLocalUser } from "@/lib/client-auth";
import { Link } from "@/lib/router";

type Language = "en" | "ru";

const copy = {
  en: {
    title: "Sign up",
    signIn: "Sign in",
    name: "Name",
    namePlaceholder: "Enter your name",
    email: "Email",
    emailPlaceholder: "Enter your email address",
    password: "Password",
    passwordPlaceholder: "Create your password",
    submit: "Create account",
    submitting: "Creating...",
    success: "Account created. Please sign in",
    retry: "Could not create account. Try again",
    loginHint: "Already have an account?",
  },
  ru: {
    title: "Регистрация",
    signIn: "Войти",
    name: "Имя",
    namePlaceholder: "Введите имя",
    email: "Email",
    emailPlaceholder: "Введите email",
    password: "Пароль",
    passwordPlaceholder: "Создайте пароль",
    submit: "Создать аккаунт",
    submitting: "Создаем...",
    success: "Аккаунт создан. Войдите в систему",
    retry: "Не удалось создать аккаунт. Попробуйте еще раз",
    loginHint: "Уже есть аккаунт?",
  },
} satisfies Record<Language, Record<string, string>>;

export function RegisterForm() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [language, setLanguage] = useState<Language>("ru");
  const t = copy[language];
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(values: RegisterInput) {
    setIsSubmitting(true);

    try {
      const result = await registerLocalUser(values);

      if (result.error) {
        toast.error(result.error);
        setIsSubmitting(false);
        return;
      }

      toast.success(t.success);
      navigate("/login", { replace: true });
    } catch {
      toast.error(t.retry);
      setIsSubmitting(false);
    }
  }

  return (
    <section className="relative isolate flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#0b3425] px-0 py-0 text-white">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(180deg,rgba(32,94,65,0.52),rgba(6,34,23,0.98)_64%,#071d14_100%)]" />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[420px] flex-col rounded-[30px] border-[5px] border-white/70 bg-transparent px-9 pb-7 pt-8 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] sm:min-h-[650px]">
        <div className="relative z-10">
          <h1 className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-2 text-[34px] font-extrabold leading-none tracking-normal text-emerald-50 sm:text-[36px]">
            <span>{t.title}</span>
            <span className="pb-1 text-2xl font-semibold text-emerald-50/35">
              /
            </span>
            <Link
              className="pb-0.5 text-xl font-bold text-emerald-50/90 transition hover:text-[#6fff8f]"
              href="/login"
            >
              {t.signIn}
            </Link>
            <span className="mb-0.5 ml-auto inline-flex rounded-full border border-white/20 bg-white/[0.04] p-0.5 text-[10px] font-extrabold leading-none">
              {(["ru", "en"] as const).map((item) => (
                <button
                  aria-pressed={language === item}
                  className={`rounded-full px-2 py-1 transition ${
                    language === item
                      ? "bg-[#32e75d] text-[#07361e]"
                      : "text-emerald-50/58 hover:text-[#7dff92]"
                  }`}
                  key={item}
                  onClick={() => setLanguage(item)}
                  type="button"
                >
                  {item.toUpperCase()}
                </button>
              ))}
            </span>
          </h1>
        </div>

        <form
          className="relative z-10 mt-8 space-y-5"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="space-y-2">
            <div className="relative pt-3">
              <Label
                className="absolute left-6 top-0 z-10 bg-[#0b3425] px-2 text-xs font-extrabold text-[#63f279]"
                htmlFor="name"
              >
                {t.name}
              </Label>
              <Input
                className="h-16 rounded-[18px] border-2 border-emerald-100/20 bg-white/[0.03] px-5 text-[15px] font-medium text-emerald-50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.025)] placeholder:text-emerald-50/44 focus:border-[#63f279] focus:ring-[#63f279]/20"
                id="name"
                placeholder={t.namePlaceholder}
                type="text"
                {...register("name")}
              />
            </div>
            {errors.name && (
              <p className="pl-2 text-xs font-semibold text-red-200">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="relative pt-3">
              <Label
                className="absolute left-6 top-0 z-10 bg-[#0b3425] px-2 text-xs font-extrabold text-[#63f279]"
                htmlFor="email"
              >
                {t.email}
              </Label>
              <Input
                className="h-16 rounded-[18px] border-2 border-emerald-100/20 bg-white/[0.03] px-5 text-[15px] font-medium text-emerald-50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.025)] placeholder:text-emerald-50/44 focus:border-[#63f279] focus:ring-[#63f279]/20"
                id="email"
                placeholder={t.emailPlaceholder}
                type="email"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="pl-2 text-xs font-semibold text-red-200">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="relative pt-3">
              <Label
                className="absolute left-6 top-0 z-10 bg-[#0b3425] px-2 text-xs font-extrabold text-[#63f279]"
                htmlFor="password"
              >
                {t.password}
              </Label>
              <Input
                className="h-16 rounded-[18px] border-2 border-emerald-100/20 bg-white/[0.03] px-5 text-[15px] font-medium text-emerald-50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.025)] placeholder:text-emerald-50/44 focus:border-[#63f279] focus:ring-[#63f279]/20"
                id="password"
                placeholder={t.passwordPlaceholder}
                type="password"
                {...register("password")}
              />
            </div>
            {errors.password && (
              <p className="pl-2 text-xs font-semibold text-red-200">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            className="h-16 w-full rounded-[18px] border-0 bg-[#32e75d] text-base font-extrabold text-[#07361e] shadow-[0_18px_34px_rgba(42,236,97,0.28)] transition hover:bg-[#43f26b] focus-visible:ring-[#63f279]/45"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? t.submitting : t.submit}
          </Button>

          <div className="pt-2 text-center text-xs font-bold text-emerald-50/62">
            <span>{t.loginHint}</span>{" "}
            <Link
              className="text-[#63f279] transition hover:text-[#9dffab]"
              href="/login"
            >
              {t.signIn}
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
