"use client";

import { useEffect } from "react";

const settingsStorageKey = "planes:settings:v1";
const expensesStorageKey = "planes-expenses-tracker";
const savingsDebtsStorageKey = "planes-savings-debts-tracker";
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

type Settings = {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
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

function readJson<T>(key: string, fallback: T): T {
  const value = window.localStorage.getItem(key);

  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function createDigest() {
  const monthKey = getCurrentMonthKey();
  const financeEntries = readJson<FinanceEntry[]>(expensesStorageKey, []);
  const savingsDebtEntries = readJson<SavingsDebtEntry[]>(savingsDebtsStorageKey, []);
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

function sendPushDigest() {
  const todayKey = getTodayKey(pushDigestSentKey);

  if (
    !("Notification" in window) ||
    Notification.permission !== "granted" ||
    window.localStorage.getItem(todayKey)
  ) {
    return;
  }

  const digest = createDigest();
  const body =
    digest.lines[0] ??
    `Баланс: ${digest.balance.toLocaleString("ru-RU")} KGS, долги: ${digest.debts.toLocaleString("ru-RU")} KGS.`;

  new Notification("Planes: финансовая сводка", {
    body,
  });
  window.localStorage.setItem(todayKey, "true");
}

export function NotificationBridge() {
  useEffect(() => {
    function runNotifications() {
      const settings = readJson<Settings>(settingsStorageKey, {});

      if (settings.emailNotifications) {
        markEmailDigestLocally();
      }

      if (settings.pushNotifications) {
        sendPushDigest();
      }
    }

    runNotifications();
    window.addEventListener("planes:settings-updated", runNotifications);

    return () => {
      window.removeEventListener("planes:settings-updated", runNotifications);
    };
  }, []);

  return null;
}
