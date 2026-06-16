"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  PiggyBank,
  Plus,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";

const stats = [
  {
    label: "Доходы месяца",
    value: "124 000 KGS",
    change: "+12%",
    icon: TrendingUp,
    tone: "text-emerald-700",
  },
  {
    label: "Расходы месяца",
    value: "48 500 KGS",
    change: "-8%",
    icon: TrendingDown,
    tone: "text-rose-600",
  },
  {
    label: "Выполненные задачи",
    value: "37",
    change: "+18%",
    icon: CheckCircle2,
    tone: "text-sky-600",
  },
  {
    label: "Баланс",
    value: "75 500 KGS",
    change: "+24%",
    icon: PiggyBank,
    tone: "text-[#123c33]",
  },
];

const actions = [
  { label: "Добавить задачу", href: "/day", icon: Plus },
  { label: "Добавить доход", href: "/expenses", icon: TrendingUp },
  { label: "Добавить расход", href: "/expenses", icon: CircleDollarSign },
  { label: "Добавить цель", href: "/year-goals", icon: Target },
];

const tasks = [
  { title: "Финансовый учет", date: "Сегодня", status: "в процессе" },
  { title: "План недели", date: "Завтра", status: "выполнено" },
  { title: "Обновить цели", date: "25 мая", status: "просрочено" },
];

const statusClassNames: Record<string, string> = {
  выполнено: "bg-emerald-50 text-emerald-700",
  "в процессе": "bg-sky-50 text-sky-700",
  просрочено: "bg-rose-50 text-rose-700",
};

export default function HomePage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-[1400px] space-y-6 px-4 pb-8 sm:px-6">
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="grid min-h-[340px] overflow-hidden rounded-[18px] bg-white shadow-sm shadow-emerald-950/10 lg:grid-cols-[1.1fr_0.9fr]"
          initial={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.45 }}
        >
          <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12">
            <p className="text-sm font-black uppercase text-[#1d5b4d]">
              Premium productivity app
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-[#123c33] sm:text-5xl">
              Добро пожаловать в Planes
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Контролируйте задачи, деньги и цели в одном месте.
            </p>
            <Link
              className="mt-8 inline-flex h-12 w-fit items-center gap-2 rounded-[16px] bg-[#123c33] px-6 text-sm font-black text-white transition hover:bg-[#1d5b4d]"
              href="/month"
            >
              Начать планирование
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative hidden items-center justify-center bg-[#f3f5f4] p-8 lg:flex">
            <div className="w-full max-w-md rounded-[18px] bg-white p-5 shadow-xl shadow-emerald-950/10">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase text-[#1d5b4d]">
                    Фокус
                  </p>
                  <p className="text-2xl font-black text-[#123c33]">Май 2026</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">
                  76%
                </div>
              </div>
              <div className="space-y-3">
                {["Доходы", "Задачи", "Цели"].map((item, index) => (
                  <div
                    className="rounded-2xl border border-emerald-950/10 p-4"
                    key={item}
                  >
                    <div className="flex items-center justify-between text-sm font-bold text-[#123c33]">
                      <span>{item}</span>
                      <span>{[82, 64, 71][index]}%</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-[#f3f5f4]">
                      <div
                        className="h-full rounded-full bg-[#123c33]"
                        style={{ width: `${[82, 64, 71][index]}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.35 }}
              key={stat.label}
            >
              <Card className="rounded-[18px] border-0 bg-white shadow-sm shadow-emerald-950/10 transition hover:-translate-y-1 hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">
                        {stat.label}
                      </p>
                      <p className="mt-3 text-2xl font-black text-[#123c33]">
                        {stat.value}
                      </p>
                      <p className="mt-2 text-sm font-bold text-emerald-700">
                        {stat.change} за месяц
                      </p>
                    </div>
                    <stat.icon className={`h-7 w-7 ${stat.tone}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {actions.map((action) => (
            <Link
              className="flex min-h-28 items-center justify-between rounded-[18px] bg-white p-5 font-black text-[#123c33] shadow-sm shadow-emerald-950/10 transition hover:-translate-y-1 hover:bg-[#123c33] hover:text-white hover:shadow-md"
              href={action.href}
              key={action.label}
            >
              <span>{action.label}</span>
              <action.icon className="h-6 w-6" />
            </Link>
          ))}
        </section>

        <section className="grid min-w-0 gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="min-w-0 overflow-hidden rounded-[18px] border-0 bg-white shadow-sm shadow-emerald-950/10">
            <CardContent className="min-w-0 p-5 sm:p-6">
              <p className="text-sm font-black uppercase text-[#1d5b4d]">
                Фокус месяца
              </p>
              <h2 className="mt-3 break-words text-xl font-black leading-tight text-[#123c33] sm:text-2xl">
                Закрыть главные финансовые цели
              </h2>
              <div className="mt-6 h-3 rounded-full bg-[#f3f5f4]">
                <motion.div
                  animate={{ width: "68%" }}
                  className="h-full rounded-full bg-[#123c33]"
                  initial={{ width: 0 }}
                  transition={{ duration: 0.8 }}
                />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-500">
                68% выполнения
              </p>
            </CardContent>
          </Card>

          <Card className="min-w-0 overflow-hidden rounded-[18px] border-0 bg-white shadow-sm shadow-emerald-950/10">
            <CardContent className="p-0">
              <div className="border-b border-emerald-950/10 p-5">
                <h2 className="text-xl font-black text-[#123c33]">
                  Последние задачи
                </h2>
              </div>
              <div className="grid gap-3 p-4 sm:hidden">
                {tasks.map((task) => (
                  <div
                    className="rounded-md border border-emerald-950/10 bg-[#f8faf5] p-4"
                    key={task.title}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-bold text-[#123c33]">
                          {task.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{task.date}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${statusClassNames[task.status]}`}
                      >
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Задача</th>
                      <th className="px-5 py-3">Дата</th>
                      <th className="px-5 py-3">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-950/10">
                    {tasks.map((task) => (
                      <tr key={task.title}>
                        <td className="px-5 py-4 font-bold text-[#123c33]">
                          {task.title}
                        </td>
                        <td className="px-5 py-4 text-slate-500">{task.date}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${statusClassNames[task.status]}`}
                          >
                            {task.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-[18px] bg-[#123c33] p-6 text-center text-white shadow-sm shadow-emerald-950/10">
          <p className="text-lg font-black">
            Маленькие действия каждый день создают большое будущее.
          </p>
        </section>
      </div>
    </AppLayout>
  );
}
