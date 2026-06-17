"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Boxes,
  CheckSquare,
  Database,
  Layers3,
  Lock,
  PiggyBank,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  { title: "Планирование задач", icon: CheckSquare },
  { title: "Финансовый контроль", icon: PiggyBank },
  { title: "Аналитика", icon: BarChart3 },
  { title: "Гибкость", icon: Layers3 },
  { title: "Простота", icon: Sparkles },
  { title: "Безопасность", icon: ShieldCheck },
];

const reasons = [
  "минимализм без лишнего шума",
  "быстрая ежедневная работа",
  "удобная финансовая аналитика",
  "mobile-friendly интерфейс",
  "единый центр задач и денег",
];

const stack = [
  "Next.js",
  "React",
  "TypeScript",
  "PostgreSQL",
  "Prisma",
  "Docker",
];

export default function AboutPage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-[1400px] space-y-6 px-4 pb-8 sm:px-6">
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[18px] bg-gradient-to-br from-white via-[#f3f5f4] to-emerald-50 p-8 shadow-sm shadow-emerald-950/10 sm:p-10 lg:p-14"
          initial={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.45 }}
        >
          <p className="text-sm font-black uppercase text-[#1d5b4d]">
            О продукте
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight text-[#123c33] sm:text-5xl">
            Planes — контроль жизни и финансов
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            Минималистичный сервис, который помогает держать задачи, цели,
            доходы, расходы, накопления и долги в одной спокойной системе.
          </p>
        </motion.section>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-[18px] border-0 bg-white shadow-sm shadow-emerald-950/10">
            <CardContent className="p-7">
              <h2 className="text-2xl font-black text-[#123c33]">
                Что такое Planes
              </h2>
              <p className="mt-4 leading-8 text-slate-600">
                Planes — это персональный сервис для планирования жизни и
                финансов. Приложение объединяет задачи, цели, доходы, расходы,
                накопления, долги и аналитику в единой системе.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 14 }}
                key={feature.title}
                transition={{ delay: index * 0.04, duration: 0.35 }}
              >
                <Card className="h-full rounded-[18px] border-0 bg-white shadow-sm shadow-emerald-950/10 transition hover:-translate-y-1 hover:shadow-md">
                  <CardContent className="p-5">
                    <feature.icon className="h-7 w-7 text-[#123c33]" />
                    <p className="mt-4 font-black text-[#123c33]">
                      {feature.title}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="grid overflow-hidden rounded-[18px] bg-white shadow-sm shadow-emerald-950/10 lg:grid-cols-2">
          <div className="bg-[#123c33] p-7 text-white sm:p-9">
            <p className="text-sm font-black uppercase text-emerald-100">
              Dashboard
            </p>
            <div className="mt-8 rounded-[18px] bg-white/10 p-5">
              <div className="mb-5 flex items-center justify-between">
                <Rocket className="h-8 w-8" />
                <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-black">
                  92%
                </span>
              </div>
              <div className="space-y-3">
                {["Планы", "Финансы", "Цели"].map((item, index) => (
                  <div className="rounded-2xl bg-white/10 p-4" key={item}>
                    <div className="flex justify-between text-sm font-bold">
                      <span>{item}</span>
                      <span>{[84, 76, 92][index]}%</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/15">
                      <div
                        className="h-full rounded-full bg-white"
                        style={{ width: `${[84, 76, 92][index]}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-7 sm:p-9">
            <h2 className="text-2xl font-black text-[#123c33]">Почему мы</h2>
            <div className="mt-6 space-y-4">
              {reasons.map((reason) => (
                <div className="flex items-center gap-3" key={reason}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-[#123c33]">
                    <Lock className="h-4 w-4" />
                  </span>
                  <p className="font-bold text-slate-700">{reason}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-black text-[#123c33]">
            Технологии
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {stack.map((item) => (
              <Card
                className="rounded-[18px] border-0 bg-white shadow-sm shadow-emerald-950/10"
                key={item}
              >
                <CardContent className="flex min-h-28 flex-col justify-between p-5">
                  {item === "Docker" ? (
                    <Boxes className="h-6 w-6 text-[#123c33]" />
                  ) : item === "PostgreSQL" ? (
                    <Database className="h-6 w-6 text-[#123c33]" />
                  ) : (
                    <Smartphone className="h-6 w-6 text-[#123c33]" />
                  )}
                  <p className="font-black text-[#123c33]">{item}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
