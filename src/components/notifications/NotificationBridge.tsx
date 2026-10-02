"use client";

import { useEffect } from "react";
import { useAppState } from "@/components/providers/AppStateProvider";
import {
  loadFinanceRecords,
  loadSavingsDebtRecords,
} from "@/lib/supabase-data";

const emailDigestSentKey = "planes-notifications-email-digest-sent";
const pushDigestSentKey = "planes-notifications-push-digest-sent";

type FinanceEntry = {
  amount: number;
  checked: boolean;
  monthKey?: string;
  title: string;
  type: "expense" | "income";
};

type SavingsDebtEntry = {
  amount: number;
  checked: boolean;
  closed?: boolean;
  monthKey?: string;
  title: string;
  type: "debt" | "saving";
};

function getCurrentMonthKey() {
  return new Intl.DateTimeFormat("sv-SE", {
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}

function getDisplayMonth() {
  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  }).format(new Date());
}

async function createDigest() {
  const monthKey = getCurrentMonthKey();
  const [storedFinanceEntries, storedSavingsDebtEntries] = await Promise.all([
    loadFinanceRecords(),
    loadSavingsDebtRecords(),
  ]);
  const financeEntries: FinanceEntry[] = storedFinanceEntries.map((entry) => ({
    amount: Number(entry.amount),
    checked: entry.checked,
    monthKey: entry.month_key ?? undefined,
    title: entry.title,
    type: entry.type,
  }));
  const savingsDebtEntries: SavingsDebtEntry[] = storedSavingsDebtEntries.map(
    (entry) => ({
      amount: Number(entry.amount),
      checked: entry.checked,
      closed: entry.closed,
      monthKey: entry.month_key ?? undefined,
      title: entry.title,
      type: entry.type,
    }),
  );
  const currentFinanceEntries = financeEntries.filter(
    (entry) => (entry.monthKey ?? monthKey) === monthKey && entry.checked,
  );
  const currentSavingsDebtEntries = savingsDebtEntries.filter(
    (entry) => (entry.monthKey ?? monthKey) === monthKey && entry.checked,
  );
  const income = currentFinanceEntries
    .filter((entry) => entry.type === "income")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const expenses = currentFinanceEntries
    .filter((entry) => entry.type === "expense")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const savings = currentSavingsDebtEntries
    .filter((entry) => entry.type === "saving")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const openDebtEntries = currentSavingsDebtEntries.filter(
    (entry) => entry.type === "debt" && !entry.closed,
  );
  const debts = openDebtEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const balance = income - expenses;
  const lines = [
    debts > 0 ? `Есть открытые долги: ${debts.toLocaleString("ru-RU")} KGS.` : "",
    expenses > income
      ? "Траты выше доходов за текущий месяц. Стоит проверить расходы."
      : "",
    savings > 0 ? `Накопления за месяц: ${savings.toLocaleString("ru-RU")} KGS.` : "",
    openDebtEntries.length
      ? `Открытые долги: ${openDebtEntries
          .slice(0, 5)
          .map((entry) => entry.title)
          .join(", ")}.`
      : "",
    balance > 0
      ? `Баланс положительный: ${balance.toLocaleString("ru-RU")} KGS.`
      : "",
  ].filter(Boolean);

  return {
    balance,
    debts,
    expenses,
    income,
    lines,
    month: getDisplayMonth(),
    savings,
  };
}

function getTodayKey(prefix: string) {
  return `${prefix}:${new Date().toISOString().slice(0, 10)}`;
}

function markEmailDigestLocally() {
  const todayKey = getTodayKey(emailDigestSentKey);

  if (window.localStorage.getItem(todayKey)) {
    return;
  }

  window.localStorage.setItem(todayKey, "true");
}

async function sendPushDigest() {
  const todayKey = getTodayKey(pushDigestSentKey);

  if (
    !("Notification" in window) ||
    Notification.permission !== "granted" ||
    window.localStorage.getItem(todayKey)
  ) {
    return;
  }

  const digest = await createDigest();
  const body =
    digest.lines[0] ??
    `Баланс: ${digest.balance.toLocaleString("ru-RU")} KGS, долги: ${digest.debts.toLocaleString("ru-RU")} KGS.`;

  new Notification("Planes: финансовая сводка", {
    body,
  });
  window.localStorage.setItem(todayKey, "true");
}

export function NotificationBridge() {
  const { isReady, settings } = useAppState();

  useEffect(() => {
    async function runNotifications() {
      if (!isReady) return;
      if (settings.emailNotifications) {
        markEmailDigestLocally();
      }

      if (settings.pushNotifications) {
        await sendPushDigest();
      }
    }

    void runNotifications().catch((error) =>
      console.error("Failed to create notification digest", error),
    );
  }, [isReady, settings.emailNotifications, settings.pushNotifications]);

  return null;
}
