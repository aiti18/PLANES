"use client";

import { KeyboardEvent, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { capitalizeFirstLetter } from "@/lib/utils";
import {
  loadFinanceRecords,
  replaceFinanceRecords,
} from "@/lib/supabase-data";

const CURRENCY_STORAGE_KEY = "planes-expenses-currency";
const SELECTED_MONTH_STORAGE_KEY = "planes-expenses-selected-month";

type EntryKind = "income" | "expense";
type CurrencyCode =
  | "KGS"
  | "USD"
  | "EUR"
  | "CNY"
  | "RUB"
  | "AED"
  | "JPY"
  | "KRW"
  | "KZT"
  | "UZS"
  | "TJS"
  | "TMT"
  | "AZN"
  | "AMD"
  | "BYN"
  | "MDL";

type FinanceEntry = {
  id: string;
  amount: number;
  checked: boolean;
  date: string;
  monthKey?: string;
  note: string;
  title: string;
  type: EntryKind;
};

type NewFinanceEntry = Omit<FinanceEntry, "id" | "date" | "monthKey">;

type CurrencyOption = {
  code: CurrencyCode;
  label: string;
  rateToKgs: number;
};

const initialEntries: FinanceEntry[] = [
  {
    id: "income-friend-1000",
    amount: 1000,
    checked: false,
    date: "сегодня",
    note: "от друга",
    title: "Поступление",
    type: "income",
  },
  {
    id: "expense-shampoo-500",
    amount: 500,
    checked: false,
    date: "сегодня",
    note: "бытовые покупки",
    title: "Купил шампунь",
    type: "expense",
  },
];

const emptyRows = Array.from({ length: 7 }, (_, index) => index);

const currencyOptions: CurrencyOption[] = [
  { code: "KGS", label: "KGS - Кыргызстан", rateToKgs: 1 },
  { code: "USD", label: "USD - США", rateToKgs: 87.45 },
  { code: "EUR", label: "EUR - Евро", rateToKgs: 99.2 },
  { code: "CNY", label: "CNY - Китай", rateToKgs: 12.1 },
  { code: "RUB", label: "RUB - Россия", rateToKgs: 1.09 },
  { code: "AED", label: "AED - Дубай", rateToKgs: 23.8 },
  { code: "JPY", label: "JPY - Япония", rateToKgs: 0.6 },
  { code: "KRW", label: "KRW - Корея", rateToKgs: 0.064 },
  { code: "KZT", label: "KZT - Казахстан", rateToKgs: 0.17 },
  { code: "UZS", label: "UZS - Узбекистан", rateToKgs: 0.0069 },
  { code: "TJS", label: "TJS - Таджикистан", rateToKgs: 8.25 },
  { code: "TMT", label: "TMT - Туркменистан", rateToKgs: 25 },
  { code: "AZN", label: "AZN - Азербайджан", rateToKgs: 51.45 },
  { code: "AMD", label: "AMD - Армения", rateToKgs: 0.23 },
  { code: "BYN", label: "BYN - Беларусь", rateToKgs: 29.2 },
  { code: "MDL", label: "MDL - Молдова", rateToKgs: 5.12 },
];

function getCurrencyOption(code: CurrencyCode) {
  return (
    currencyOptions.find((currencyOption) => currencyOption.code === code) ??
    currencyOptions[0]
  );
}

function formatMoney(amount: number, currency: CurrencyOption) {
  const convertedAmount = amount / currency.rateToKgs;

  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: currency.code === "KGS" ? 0 : 2,
    style: "currency",
    currency: currency.code,
  }).format(convertedAmount);
}

function getTodayLabel() {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    weekday: "short",
  }).format(new Date());
}

function getCurrentMonthKey() {
  return new Intl.DateTimeFormat("sv-SE", {
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}

function getMonthKey(monthIndex: number, year = new Date().getFullYear()) {
  const date = new Date(year, monthIndex, 1);

  return new Intl.DateTimeFormat("sv-SE", {
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getMonthName(monthIndex: number, year = new Date().getFullYear()) {
  const date = new Date(year, monthIndex, 1);

  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
  }).format(date);
}

function getDisplayMonthName(monthIndex: number, year = new Date().getFullYear()) {
  const monthName = getMonthName(monthIndex, year);

  return `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${year}`;
}

function getMonthIndexFromKey(monthKey: string) {
  const [, month] = monthKey.split("-");
  const monthIndex = Number(month) - 1;

  return Number.isInteger(monthIndex) && monthIndex >= 0 && monthIndex <= 11
    ? monthIndex
    : new Date().getMonth();
}

function getYearFromKey(monthKey: string) {
  const [year] = monthKey.split("-");
  const parsedYear = Number(year);

  return Number.isInteger(parsedYear) ? parsedYear : new Date().getFullYear();
}

function MonthSwitcher({
  monthKey,
  onChange,
}: {
  monthKey: string;
  onChange: (monthKey: string) => void;
}) {
  const monthIndex = getMonthIndexFromKey(monthKey);
  const year = getYearFromKey(monthKey);

  function changeMonth(direction: -1 | 1) {
    const nextDate = new Date(year, monthIndex + direction, 1);

    onChange(getMonthKey(nextDate.getMonth(), nextDate.getFullYear()));
  }

  return (
    <div className="grid grid-cols-[36px_180px_36px] items-center gap-3">
      <button
        aria-label="Предыдущий месяц"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-900/20 bg-white text-lg leading-none text-emerald-900 transition hover:bg-emerald-50"
        onClick={() => changeMonth(-1)}
        type="button"
      >
        ‹
      </button>
      <div className="w-[180px]">
        <p className="text-2xl font-black leading-none text-slate-900">
          {getDisplayMonthName(monthIndex, year)}
        </p>
      </div>
      <button
        aria-label="Следующий месяц"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-900/20 bg-white text-lg leading-none text-emerald-900 transition hover:bg-emerald-50"
        onClick={() => changeMonth(1)}
        type="button"
      >
        ›
      </button>
    </div>
  );
}

function SummaryCard({
  label,
  onCurrencyChange,
  tone,
  value,
  currency,
}: {
  label: string;
  onCurrencyChange?: (currencyCode: CurrencyCode) => void;
  tone: "income" | "expense" | "balance";
  value: number;
  currency: CurrencyOption;
}) {
  const toneClassName =
    tone === "income"
      ? "text-emerald-700"
      : tone === "expense"
        ? "text-rose-700"
        : value >= 0
          ? "text-emerald-800"
          : "text-rose-700";

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className={`mt-2 text-2xl font-semibold ${toneClassName}`}>
          {formatMoney(value, currency)}
        </p>
        {onCurrencyChange && (
          <select
            aria-label="Валюта"
            className="mt-3 h-9 w-full rounded-sm border border-emerald-900/20 bg-white px-2 text-sm font-semibold text-emerald-950 outline-none transition focus:border-emerald-700"
            onChange={(event) =>
              onCurrencyChange(event.target.value as CurrencyCode)
            }
            value={currency.code}
          >
            {currencyOptions.map((currencyOption) => (
              <option key={currencyOption.code} value={currencyOption.code}>
                {currencyOption.label}
              </option>
            ))}
          </select>
        )}
      </CardContent>
    </Card>
  );
}

function EntriesTable({
  currency,
  entries,
  onAdd,
  onToggle,
  title,
  type,
}: {
  currency: CurrencyOption;
  entries: FinanceEntry[];
  onAdd: (entry: NewFinanceEntry) => void;
  onToggle: (id: string) => void;
  title: string;
  type: EntryKind;
}) {
  const isIncome = type === "income";
  const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const [draftAmount, setDraftAmount] = useState("");
  const [draftTitle, setDraftTitle] = useState("");

  function handleAddDraft() {
    const parsedAmount = Number(draftAmount.replace(",", "."));

    if (!draftTitle.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    onAdd({
      amount: parsedAmount * currency.rateToKgs,
      checked: true,
      note: "",
      title: capitalizeFirstLetter(draftTitle.trim()),
      type,
    });

    setDraftAmount("");
    setDraftTitle("");
  }

  function handleDraftKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      handleAddDraft();
    }
  }

  return (
    <Card className="min-w-0 flex-1 overflow-hidden">
      <CardHeader className="border-b border-emerald-900/10 bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              {isIncome ? "Доходы" : "Расходы"}
            </p>
            <CardTitle className="mt-1 text-lg text-emerald-950">
              {title}
            </CardTitle>
          </div>

          <div
            className={
              isIncome
                ? "rounded-md bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800"
                : "rounded-md bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700"
            }
          >
            {isIncome ? "+" : "-"}
            {formatMoney(total, currency)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="border-b border-emerald-900/10 bg-muted/30 p-4 sm:hidden">
          <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
            Новая запись
          </p>
          <div className="grid gap-3">
            <input
              aria-label={isIncome ? "Источник дохода" : "Покупка"}
              className="h-10 w-full rounded-sm border border-emerald-900/15 bg-white px-3 text-sm font-semibold text-emerald-950 outline-none placeholder:text-slate-400 focus:border-emerald-700 focus:bg-emerald-50"
              onChange={(event) => setDraftTitle(event.target.value)}
              onKeyDown={handleDraftKeyDown}
              placeholder={isIncome ? "Источник" : "Покупка"}
              value={draftTitle}
            />
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <input
                aria-label={isIncome ? "Сумма дохода" : "Сумма траты"}
                className={
                  isIncome
                    ? "h-10 min-w-0 rounded-sm border border-emerald-900/20 bg-white px-3 text-right text-sm font-semibold text-emerald-700 outline-none placeholder:text-slate-400 focus:border-emerald-700 focus:bg-emerald-50"
                    : "h-10 min-w-0 rounded-sm border border-emerald-900/20 bg-white px-3 text-right text-sm font-semibold text-rose-700 outline-none placeholder:text-slate-400 focus:border-rose-500 focus:bg-rose-50"
                }
                inputMode="decimal"
                min="0"
                onChange={(event) => setDraftAmount(event.target.value)}
                onKeyDown={handleDraftKeyDown}
                placeholder="0"
                type="text"
                value={draftAmount}
              />
              <button
                className="h-10 rounded-sm bg-emerald-800 px-3 text-xs font-semibold uppercase text-white transition hover:bg-emerald-900"
                onClick={handleAddDraft}
                type="button"
              >
                Добавить
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-emerald-900/10 sm:hidden">
          {entries.map((entry) => (
            <div className="flex items-start gap-3 p-4" key={entry.id}>
              <input
                aria-label={`Отметить "${entry.title}"`}
                checked={entry.checked}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-border accent-emerald-700"
                onChange={() => onToggle(entry.id)}
                type="checkbox"
              />
              <div className="min-w-0 flex-1">
                <p
                  className={
                    entry.checked
                      ? "break-words font-semibold text-muted-foreground"
                      : "break-words font-semibold text-emerald-950"
                  }
                >
                  {entry.title}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase text-muted-foreground">
                  {entry.date}
                </p>
              </div>
              <p
                className={
                  isIncome
                    ? "shrink-0 text-right text-sm font-semibold text-emerald-700"
                    : "shrink-0 text-right text-sm font-semibold text-rose-700"
                }
              >
                {isIncome ? "+" : "-"}
                {formatMoney(entry.amount, currency)}
              </p>
            </div>
          ))}

          {entries.length === 0 && (
            <div className="p-4 text-sm font-semibold text-muted-foreground">
              Пока нет записей.
            </div>
          )}
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <table className="min-w-[640px] table-fixed border-collapse text-sm lg:min-w-full">
          <colgroup>
            <col className="w-[12%]" />
            <col className="w-[10%]" />
            <col className="w-[38%]" />
            <col className="w-[18%]" />
            <col className="w-[22%]" />
          </colgroup>
          <thead>
            <tr className="h-11 border-b border-emerald-900/10 bg-muted/45 text-xs uppercase text-muted-foreground">
              <th className="px-4 text-left font-semibold">Готово</th>
              <th className="px-4 text-left font-semibold">Дата</th>
              <th className="px-4 text-left font-semibold">
                {isIncome ? "Статья поступлений" : "Статья расходов"}
              </th>
              <th className="px-4 text-right font-semibold">Сумма</th>
              <th className="px-4 text-left font-semibold" />
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-900/10">
            <tr className="h-12 align-middle text-emerald-950">
              <td className="px-4" />
              <td className="px-4 text-xs font-semibold uppercase text-muted-foreground">
                Новая
              </td>
              <td className="px-4">
                <input
                  aria-label={isIncome ? "Источник дохода" : "Покупка"}
                  className="h-8 w-full min-w-0 bg-transparent font-semibold outline-none placeholder:text-slate-400 focus:bg-emerald-50"
                  onChange={(event) => setDraftTitle(event.target.value)}
                  onKeyDown={handleDraftKeyDown}
                  placeholder={isIncome ? "Источник" : "Покупка"}
                  value={draftTitle}
                />
              </td>
              <td className="px-4">
                <input
                  aria-label={isIncome ? "Сумма дохода" : "Сумма траты"}
                  className={
                    isIncome
                      ? "h-8 w-full min-w-0 rounded-sm border border-emerald-900/20 bg-white px-2 text-right font-semibold text-emerald-700 outline-none placeholder:text-slate-400 focus:border-emerald-700 focus:bg-emerald-50"
                      : "h-8 w-full min-w-0 rounded-sm border border-emerald-900/20 bg-white px-2 text-right font-semibold text-rose-700 outline-none placeholder:text-slate-400 focus:border-rose-500 focus:bg-rose-50"
                  }
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => setDraftAmount(event.target.value)}
                  onKeyDown={handleDraftKeyDown}
                  placeholder="0"
                  type="text"
                  value={draftAmount}
                />
              </td>
              <td className="px-4">
                <button
                  className="h-8 rounded-sm bg-emerald-800 px-3 text-xs font-semibold uppercase text-white transition hover:bg-emerald-900"
                  onClick={handleAddDraft}
                  type="button"
                >
                  Добавить
                </button>
              </td>
            </tr>

            {entries.map((entry) => (
              <tr
                className="h-12 align-middle text-emerald-950"
                key={entry.id}
              >
                <td className="px-4">
                  <input
                    aria-label={`Отметить "${entry.title}"`}
                    checked={entry.checked}
                    className="h-5 w-5 rounded border-border accent-emerald-700"
                    onChange={() => onToggle(entry.id)}
                    type="checkbox"
                  />
                </td>
                <td className="px-4 text-muted-foreground">{entry.date}</td>
                <td
                  className={
                    entry.checked
                      ? "px-4 font-semibold text-muted-foreground"
                      : "px-4 font-semibold"
                  }
                >
                  {entry.title}
                </td>
                <td
                  className={
                    isIncome
                      ? "px-4 text-right font-semibold text-emerald-700"
                      : "px-4 text-right font-semibold text-rose-700"
                  }
                >
                  {isIncome ? "+" : "-"}
                  {formatMoney(entry.amount, currency)}
                </td>
                <td className="px-4" />
              </tr>
            ))}

            {emptyRows.map((row) => (
              <tr className="h-12" key={row}>
                <td className="px-4" />
                <td className="px-4" />
                <td className="px-4" />
                <td className="px-4" />
                <td className="px-4" />
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function ExpensesTracker() {
  const [entries, setEntries] = useState<FinanceEntry[]>(initialEntries);
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>("KGS");
  const [selectedMonthKey, setSelectedMonthKey] = useState(getCurrentMonthKey);
  const [isDataReady, setIsDataReady] = useState(false);

  useEffect(() => {
    const storedCurrencyCode = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    const storedSelectedMonthKey = window.localStorage.getItem(
      SELECTED_MONTH_STORAGE_KEY,
    );

    if (
      storedCurrencyCode &&
      currencyOptions.some(
        (currencyOption) => currencyOption.code === storedCurrencyCode,
      )
    ) {
      setCurrencyCode(storedCurrencyCode as CurrencyCode);
    }

    if (storedSelectedMonthKey) {
      setSelectedMonthKey(storedSelectedMonthKey);
    }

    let active = true;
    void loadFinanceRecords()
      .then((records) => {
        if (!active || !records.length) return;
        setEntries(
          records.map((record) => ({
            amount: Number(record.amount),
            checked: record.checked,
            date: record.record_date,
            id: record.record_id,
            monthKey: record.month_key ?? undefined,
            note: record.note,
            title: record.title,
            type: record.type,
          })),
        );
      })
      .catch((error) => console.error("Failed to load finance records", error))
      .finally(() => {
        if (active) setIsDataReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isDataReady) return;

    const timeoutId = window.setTimeout(() => {
      void replaceFinanceRecords(
        entries.map((entry) => ({
          amount: entry.amount,
          checked: entry.checked,
          month_key: entry.monthKey ?? null,
          note: entry.note,
          record_date: entry.date,
          record_id: entry.id,
          title: entry.title,
          type: entry.type,
        })),
      ).catch((error) => console.error("Failed to save finance records", error));
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [entries, isDataReady]);

  useEffect(() => {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, currencyCode);
  }, [currencyCode]);

  useEffect(() => {
    window.localStorage.setItem(SELECTED_MONTH_STORAGE_KEY, selectedMonthKey);
  }, [selectedMonthKey]);

  const currentMonthKey = getCurrentMonthKey();
  const selectedMonthEntries = entries.filter(
    (entry) => (entry.monthKey ?? currentMonthKey) === selectedMonthKey,
  );
  const incomeEntries = selectedMonthEntries.filter(
    (entry) => entry.type === "income",
  );
  const expenseEntries = selectedMonthEntries.filter(
    (entry) => entry.type === "expense",
  );
  const selectedCurrency = getCurrencyOption(currencyCode);

  const totals = useMemo(() => {
    const checkedEntries = selectedMonthEntries.filter((entry) => entry.checked);
    const income = checkedEntries
      .filter((entry) => entry.type === "income")
      .reduce((sum, entry) => sum + entry.amount, 0);
    const expense = checkedEntries
      .filter((entry) => entry.type === "expense")
      .reduce((sum, entry) => sum + entry.amount, 0);

    return {
      balance: income - expense,
      expense,
      income,
    };
  }, [selectedMonthEntries]);

  function handleAdd(entry: NewFinanceEntry) {
    setEntries((currentEntries) => [
      {
        ...entry,
        date: getTodayLabel(),
        id: crypto.randomUUID(),
        monthKey: selectedMonthKey,
      },
      ...currentEntries,
    ]);
  }

  function handleToggle(id: string) {
    setEntries((currentEntries) =>
      currentEntries.map((entry) =>
        entry.id === id ? { ...entry, checked: !entry.checked } : entry,
      ),
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <MonthSwitcher
          monthKey={selectedMonthKey}
          onChange={setSelectedMonthKey}
        />
        <p className="mt-1 text-sm text-muted-foreground">
          Добавляйте поступления и траты, а чекбоксом отмечайте то, что уже
          произошло.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          currency={selectedCurrency}
          label="Отмеченные доходы"
          tone="income"
          value={totals.income}
        />
        <SummaryCard
          currency={selectedCurrency}
          label="Баланс"
          onCurrencyChange={setCurrencyCode}
          tone="balance"
          value={totals.balance}
        />
        <SummaryCard
          currency={selectedCurrency}
          label="Отмеченные траты"
          tone="expense"
          value={totals.expense}
        />
      </div>

      <div className="pb-2">
        <div className="grid gap-5 xl:grid-cols-2">
          <EntriesTable
            currency={selectedCurrency}
            entries={incomeEntries}
            onAdd={handleAdd}
            onToggle={handleToggle}
            title="Поступления"
            type="income"
          />

          <EntriesTable
            currency={selectedCurrency}
            entries={expenseEntries}
            onAdd={handleAdd}
            onToggle={handleToggle}
            title="Траты"
            type="expense"
          />
        </div>
      </div>
    </div>
  );
}
