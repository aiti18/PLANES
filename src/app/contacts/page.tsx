"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { Github, Mail, MapPin, Send, SendHorizonal } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const contactCards = [
  { label: "Email", value: "support@planes.app", icon: Mail },
  { label: "Telegram", value: "@planes_support", icon: Send },
  { label: "GitHub", value: "github.com/planes", icon: Github },
  { label: "Location", value: "Bishkek, Kyrgyzstan", icon: MapPin },
];

const faq = [
  {
    question: "Где хранятся данные?",
    answer: "Аккаунты хранятся в PostgreSQL, рабочие записи сейчас сохраняются локально в браузере.",
  },
  {
    question: "Будет ли мобильная версия?",
    answer: "Интерфейс уже адаптируется под телефон, а отдельный мобильный формат можно развивать дальше.",
  },
  {
    question: "Можно ли менять валюту?",
    answer: "Да, финансовые страницы поддерживают смену валюты и пересчет сумм.",
  },
  {
    question: "Планируется ли синхронизация?",
    answer: "Да, синхронизация данных между устройствами логично ложится в следующую версию.",
  },
];

const contactSchema = z.object({
  name: z.string().min(2, "Введите имя"),
  email: z.string().email("Введите корректный email"),
  message: z.string().min(10, "Сообщение должно быть длиннее"),
});

export default function ContactsPage() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const result = contactSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message"),
    });

    if (!result.success) {
      setErrors(
        Object.fromEntries(
          result.error.issues.map((issue) => [
            issue.path.join("."),
            issue.message,
          ]),
        ),
      );
      return;
    }

    setErrors({});
    event.currentTarget.reset();
    toast.success("Сообщение готово к отправке");
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1400px] space-y-6 px-4 pb-8 sm:px-6">
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[18px] bg-white p-8 shadow-sm shadow-emerald-950/10 sm:p-10 lg:p-14"
          initial={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.45 }}
        >
          <p className="text-sm font-black uppercase text-[#1d5b4d]">
            Контакты
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight text-[#123c33] sm:text-5xl">
            Свяжитесь с нами
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            Есть вопросы, идеи или предложения? Мы всегда открыты к общению.
          </p>
        </motion.section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {contactCards.map((card, index) => (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 14 }}
              key={card.label}
              transition={{ delay: index * 0.05, duration: 0.35 }}
            >
              <Card className="h-full rounded-[18px] border-0 bg-white shadow-sm shadow-emerald-950/10 transition hover:-translate-y-1 hover:shadow-md">
                <CardContent className="p-5">
                  <card.icon className="h-7 w-7 text-[#123c33]" />
                  <p className="mt-4 text-sm font-black uppercase text-slate-500">
                    {card.label}
                  </p>
                  <p className="mt-2 font-black text-[#123c33]">{card.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="rounded-[18px] border-0 bg-white shadow-sm shadow-emerald-950/10">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-2xl font-black text-[#123c33]">
                Форма обратной связи
              </h2>
              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <Input
                    className="rounded-[16px] border-emerald-950/10 bg-[#f3f5f4] focus:border-[#123c33]"
                    name="name"
                    placeholder="Имя"
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm font-semibold text-rose-600">
                      {errors.name}
                    </p>
                  )}
                </div>
                <div>
                  <Input
                    className="rounded-[16px] border-emerald-950/10 bg-[#f3f5f4] focus:border-[#123c33]"
                    name="email"
                    placeholder="Email"
                    type="email"
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm font-semibold text-rose-600">
                      {errors.email}
                    </p>
                  )}
                </div>
                <div>
                  <textarea
                    className="min-h-36 w-full resize-none rounded-[16px] border border-emerald-950/10 bg-[#f3f5f4] px-3 py-3 text-sm text-[#123c33] outline-none transition focus:border-[#123c33] focus:ring-2 focus:ring-[#123c33]/20"
                    name="message"
                    placeholder="Сообщение"
                  />
                  {errors.message && (
                    <p className="mt-2 text-sm font-semibold text-rose-600">
                      {errors.message}
                    </p>
                  )}
                </div>
                <Button className="h-12 rounded-[16px] bg-[#123c33] px-6 font-black text-white hover:bg-[#1d5b4d]">
                  <SendHorizonal className="h-4 w-4" />
                  Отправить
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-[18px] border-0 bg-white shadow-sm shadow-emerald-950/10">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-2xl font-black text-[#123c33]">FAQ</h2>
              <div className="mt-6 space-y-4">
                {faq.map((item) => (
                  <div
                    className="rounded-[16px] bg-[#f3f5f4] p-4"
                    key={item.question}
                  >
                    <p className="font-black text-[#123c33]">{item.question}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}
