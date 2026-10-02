"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Chrome, Instagram, Send, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoginInput, loginSchema } from "@/lib/validators/auth";
import { Link } from "@/lib/router";
import { useAuth } from "@/contexts/AuthContext";

function VkIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12.89 17.08c-5.3 0-8.32-3.63-8.45-9.68h2.66c.09 4.43 2.04 6.31 3.58 6.7V7.4h2.5v3.82c1.52-.16 3.11-1.91 3.65-3.82h2.5c-.41 2.35-2.16 4.1-3.4 4.82 1.24.58 3.23 2.11 3.98 4.86h-2.75c-.59-1.84-2.04-3.27-3.98-3.46v3.46h-.29Z" />
    </svg>
  );
}

const socialActions: Array<{ label: string; Icon: LucideIcon | typeof VkIcon }> = [
  { label: "Google", Icon: Chrome },
  { label: "Instagram", Icon: Instagram },
  { label: "Telegram", Icon: Send },
  { label: "VKontakte", Icon: VkIcon },
];

type Language = "en" | "ru";

const copy = {
  en: {
    title: "Sign in",
    signUp: "Sign up",
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
    registerHint: "No account yet?",
  },
  ru: {
    title: "Войти",
    signUp: "Регистрация",
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
    registerHint: "Нет аккаунта?",
  },
} satisfies Record<Language, Record<string, string>>;

export function LoginForm() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [language, setLanguage] = useState<Language>("ru");
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
      const result = await signIn(values);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(t.success);
      window.setTimeout(() => {
        navigate("/", { replace: true });
      }, 650);
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
          <h1 className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-2 text-[34px] font-extrabold leading-none tracking-normal text-emerald-50 sm:text-[36px]">
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

          <div className="pt-1 text-center text-xs font-bold text-emerald-50/62">
            <span>{t.registerHint}</span>{" "}
            <Link
              className="text-[#63f279] transition hover:text-[#9dffab]"
              href="/register"
            >
              {t.signUp}
            </Link>
          </div>

          <div className="pt-3">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-emerald-50/13" />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.11em] text-emerald-50/74">
                {t.social}
              </span>
            </div>

            <div className="mt-7 flex items-center justify-center gap-4">
              {socialActions.map((action) => (
                <button
                  aria-label={action.label}
                  className="flex h-[60px] w-[60px] items-center justify-center rounded-full border border-emerald-50/15 bg-white/[0.025] text-emerald-50/76 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.025)] transition hover:border-[#63f279]/65 hover:text-[#63f279] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#63f279]/45"
                  key={action.label}
                  onClick={() => toast.info(`${action.label} ${t.socialToast}`)}
                  title={action.label}
                  type="button"
                >
                  <action.Icon className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
