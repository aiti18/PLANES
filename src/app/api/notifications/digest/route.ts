import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const digestSchema = z.object({
  balance: z.number(),
  debts: z.number(),
  expenses: z.number(),
  income: z.number(),
  lines: z.array(z.string()).max(20),
  month: z.string(),
  savings: z.number(),
});

function formatMoney(amount: number) {
  return new Intl.NumberFormat("ru-RU", {
    currency: "KGS",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Некорректный JSON" },
      { status: 400 },
    );
  }

  const parsedBody = digestSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json({ message: "Некорректная сводка" }, { status: 400 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM ?? "Planes <onboarding@resend.dev>";
  const user = await prisma.user.findUnique({
    select: { email: true },
    where: { id: session.user.id },
  });

  if (!user?.email) {
    return NextResponse.json(
      { message: "Email пользователя не найден" },
      { status: 404 },
    );
  }

  if (!resendApiKey) {
    return NextResponse.json({
      message: "Email provider is not configured",
      skipped: true,
    });
  }

  const digest = parsedBody.data;
  const escapedMonth = escapeHtml(digest.month);
  const details = digest.lines.length
    ? digest.lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")
    : "<li>Критичных напоминаний нет.</li>";

  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: emailFrom,
      html: `
        <div style="font-family: Arial, sans-serif; color: #123c33;">
          <h1>Финансовая сводка Planes</h1>
          <p>Месяц: <strong>${escapedMonth}</strong></p>
          <ul>
            <li>Доходы: <strong>${formatMoney(digest.income)}</strong></li>
            <li>Траты: <strong>${formatMoney(digest.expenses)}</strong></li>
            <li>Баланс: <strong>${formatMoney(digest.balance)}</strong></li>
            <li>Накопления: <strong>${formatMoney(digest.savings)}</strong></li>
            <li>Открытые долги: <strong>${formatMoney(digest.debts)}</strong></li>
          </ul>
          <h2>Что важно знать</h2>
          <ul>${details}</ul>
        </div>
      `,
      subject: `Planes: финансовая сводка за ${digest.month}`,
      text: [
        `Финансовая сводка Planes за ${digest.month}`,
        `Доходы: ${formatMoney(digest.income)}`,
        `Траты: ${formatMoney(digest.expenses)}`,
        `Баланс: ${formatMoney(digest.balance)}`,
        `Накопления: ${formatMoney(digest.savings)}`,
        `Открытые долги: ${formatMoney(digest.debts)}`,
        "",
        ...digest.lines,
      ].join("\n"),
      to: user.email,
    }),
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    return NextResponse.json(
      { message: "Не удалось отправить письмо" },
      { status: 502 },
    );
  }

  return NextResponse.json({ message: "Письмо отправлено" });
}
