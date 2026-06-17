"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Apple, Chrome, Instagram, type LucideIcon } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoginInput, loginSchema } from "@/lib/validators/auth";

const socialActions: Array<{ label: string; Icon: LucideIcon }> = [
  { label: "Apple", Icon: Apple },
  { label: "Instagram", Icon: Instagram },
  { label: "Google", Icon: Chrome },
];

type Language = "en" | "ru";

const copy = {
  en: {
    title: "Sign in",
    signUp: "Sign up",
    subtitle: "Fill the form to sign into account",
    email: "Email",
    emailPlaceholder: "Enter your email address",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    remember: "Remember",
    forgot: "Forgot password",
    submit: "Sign In",
    submitting: "Signing in...",
    social: "Or continue with",
    forgotToast: "Password recovery is not available yet",
    socialToast: "sign in is not connected",
    error: "Invalid email or password",
    success: "You signed in",
    retry: "Could not sign in. Try again",
  },
  ru: {
    title: "Войти",
    signUp: "Регистрация",
    subtitle: "Заполните форму, чтобы войти в аккаунт",
    email: "Email",
    emailPlaceholder: "Введите email",
    password: "Пароль",
    passwordPlaceholder: "Введите пароль",
    remember: "Запомнить",
    forgot: "Забыли пароль",
    submit: "Войти",
    submitting: "Входим...",
    social: "Или продолжить через",
    forgotToast: "Восстановление пароля пока недоступно",
    socialToast: "вход пока не подключен",
    error: "Неверный email или пароль",
    success: "Вы вошли в аккаунт",
    retry: "Не удалось войти. Попробуйте еще раз",
  },
} satisfies Record<Language, Record<string, string>>;

export function LoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const t = copy[language];
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginInput) {
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        ...values,
        redirect: false,
        redirectTo: "/",
      });

      if (result?.error) {
        toast.error(t.error);
        return;
      }

      toast.success(t.success);
      window.location.assign("/");
    } catch {
      toast.error(t.retry);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="relative isolate flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#0b3425] px-0 py-0 text-white">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(180deg,rgba(32,94,65,0.52),rgba(6,34,23,0.98)_64%,#071d14_100%)]" />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[420px] flex-col rounded-[30px] border-[5px] border-white/70 bg-transparent px-9 pb-7 pt-8 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] sm:min-h-[650px]">
        <div className="relative z-10">
          <h1 className="flex flex-wrap items-end gap-x-3 gap-y-2 text-[34px] font-extrabold leading-none tracking-normal text-emerald-50 sm:text-[36px]">
            <span>{t.title}</span>
            <span className="pb-1 text-2xl font-semibold text-emerald-50/35">
              /
            </span>
            <Link
              className="pb-0.5 text-xl font-bold text-emerald-50/90 transition hover:text-[#6fff8f]"
              href="/register"
            >
              {t.signUp}
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
          <p className="mt-5 text-sm font-semibold text-emerald-50/68">
            {t.subtitle}
          </p>
        </div>

        <form
          className="relative z-10 mt-10 space-y-6"
          onSubmit={handleSubmit(onSubmit)}
        >
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

          <div className="flex items-center justify-between gap-3 pt-2">
            <label className="flex cursor-pointer items-center gap-3">
              <input className="peer sr-only" type="checkbox" />
              <span className="relative h-7 w-12 rounded-full bg-white/70 transition after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-emerald-900/55 after:shadow-sm after:transition after:content-[''] peer-checked:bg-[#62f878] peer-checked:after:translate-x-5 peer-checked:after:bg-[#082518]" />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-emerald-50/68">
                {t.remember}
              </span>
            </label>
            <button
              className="text-xs font-extrabold text-[#63f279] transition hover:text-[#9dffab] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#63f279]/45"
              onClick={() => toast.info(t.forgotToast)}
              type="button"
            >
              {t.forgot}
            </button>
          </div>

          <Button
            className="h-16 w-full rounded-[18px] border-0 bg-[#32e75d] text-base font-extrabold text-[#07361e] shadow-[0_18px_34px_rgba(42,236,97,0.28)] transition hover:bg-[#43f26b] focus-visible:ring-[#63f279]/45"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? t.submitting : t.submit}
          </Button>

          <div className="pt-3">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-emerald-50/13" />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.11em] text-emerald-50/74">
                {t.social}
              </span>
            </div>

            <div className="mt-7 flex items-center justify-center gap-6">
              {socialActions.map(({ label, Icon }) => (
                <button
                  aria-label={label}
                  className="flex h-[60px] w-[60px] items-center justify-center rounded-full border border-emerald-50/15 bg-white/[0.025] text-emerald-50/76 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.025)] transition hover:border-[#63f279]/65 hover:text-[#63f279] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#63f279]/45"
                  key={label}
                  onClick={() => toast.info(`${label} ${t.socialToast}`)}
                  title={label}
                  type="button"
                >
                  <Icon className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
