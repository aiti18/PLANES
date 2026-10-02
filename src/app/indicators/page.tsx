"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  loadFinanceRecords,
  loadSavingsDebtRecords,
} from "@/lib/supabase-data";

const SELECTED_MONTH_STORAGE_KEY = "planes-indicators-selected-month";

type CashFlowEntry = {
  amount: number;
  checked: boolean;
  monthKey?: string;
  title: string;
  type: "income" | "expense";
};

type SavingsDebtEntry = {
  amount: number;
  checked: boolean;
  closed?: boolean;
  monthKey?: string;
  title: string;
  type: "saving" | "debt";
};

type SummaryRow = {
  actual: number;
  category: string;
};

const chartColors = [
  "#047857",
  "#38bdf8",
  "#f59e0b",
  "#fb7185",
  "#8b5cf6",
  "#14b8a6",
  "#84cc16",
];

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
        <p className="text-[11px] font-black uppercase tracking-wide text-emerald-800">
          Трекер по дням
        </p>
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

function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    currency: "KGS",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function getTotal(rows: SummaryRow[]) {
  return rows.reduce((sum, row) => sum + row.actual, 0);
}

function aggregateByTitle(entries: { amount: number; title: string }[]) {
  const totals = new Map<string, number>();

  entries.forEach((entry) => {
    const title = entry.title.trim() || "Без названия";
    totals.set(title, (totals.get(title) ?? 0) + entry.amount);
  });

  return Array.from(totals, ([category, actual]) => ({
    actual,
    category,
  })).sort((firstRow, secondRow) => secondRow.actual - firstRow.actual);
}

function MoneyTable({
  accentClassName,
  emptyLabel,
  rows,
  title,
}: {
  accentClassName: string;
  emptyLabel: string;
  rows: SummaryRow[];
  title: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className={`px-4 py-3 ${accentClassName}`}>
        <CardTitle className="text-sm font-black uppercase text-white">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full table-fixed border-collapse text-xs">
          <thead>
            <tr className="h-9 border-b border-emerald-900/10 bg-emerald-50 text-muted-foreground">
              <th className="w-[60%] px-3 text-left font-bold">Категория</th>
              <th className="w-[40%] px-3 text-right font-bold">Факт</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-900/10">
            {rows.length === 0 ? (
              <tr className="h-12">
                <td className="px-3 text-muted-foreground" colSpan={2}>
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr className="h-9" key={row.category}>
                  <td className="truncate px-3 font-semibold text-emerald-950">
                    {row.category}
                  </td>
                  <td className="px-3 text-right font-semibold text-emerald-950">
                    {formatMoney(row.actual)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="h-9 bg-white text-xs font-black text-emerald-950">
              <td className="px-3">Итого</td>
              <td className="px-3 text-right">{formatMoney(getTotal(rows))}</td>
            </tr>
          </tfoot>
        </table>
      </CardContent>
    </Card>
  );
}

function ChartCard({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-emerald-900/10 bg-white px-4 py-3">
        <CardTitle className="text-sm font-black uppercase text-emerald-950">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-72 p-4">{children}</CardContent>
    </Card>
  );
}

function MetricCard({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "income" | "expense" | "savings";
  value: number;
}) {
  const toneClassName =
    tone === "expense"
      ? "text-rose-700"
      : tone === "savings"
        ? "text-sky-700"
        : "text-emerald-700";

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-black uppercase text-muted-foreground">
          {label}
        </p>
        <p className={`mt-2 text-2xl font-black ${toneClassName}`}>
          {formatMoney(value)}
        </p>
      </CardContent>
    </Card>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center text-sm font-semibold text-muted-foreground">
      Нет отмеченных данных за выбранный месяц
    </div>
  );
}

export default function IndicatorsPage() {
  const [cashFlowEntries, setCashFlowEntries] = useState<CashFlowEntry[]>([]);
  const [monthKey, setMonthKey] = useState(getCurrentMonthKey);
  const [savingsDebtEntries, setSavingsDebtEntries] = useState<SavingsDebtEntry[]>([]);

  useEffect(() => {
    let active = true;
    void Promise.all([loadFinanceRecords(), loadSavingsDebtRecords()])
      .then(([financeRecords, savingsDebtRecords]) => {
        if (!active) return;
        setCashFlowEntries(
          financeRecords.map((record) => ({
            amount: Number(record.amount),
            checked: record.checked,
            monthKey: record.month_key ?? undefined,
            title: record.title,
            type: record.type,
          })),
        );
        setSavingsDebtEntries(
          savingsDebtRecords.map((record) => ({
            amount: Number(record.amount),
            checked: record.checked,
            closed: record.closed,
            monthKey: record.month_key ?? undefined,
            title: record.title,
            type: record.type,
          })),
        );
      })
      .catch((error) => console.error("Failed to load indicator data", error));

    const storedMonthKey = window.localStorage.getItem(SELECTED_MONTH_STORAGE_KEY);
    if (storedMonthKey) {
      setMonthKey(storedMonthKey);
    }

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SELECTED_MONTH_STORAGE_KEY, monthKey);
  }, [monthKey]);

  const currentMonthKey = getCurrentMonthKey();

  const {
    balance,
    debtRows,
    expenseRows,
    incomeRows,
    overviewRows,
    savingsRows,
    totalDebt,
    totalExpense,
    totalIncome,
    totalSavings,
  } = useMemo(() => {
    const checkedCashFlowEntries = cashFlowEntries.filter(
      (entry) => entry.checked && (entry.monthKey ?? currentMonthKey) === monthKey,
    );
    const checkedSavingsDebtEntries = savingsDebtEntries.filter(
      (entry) => entry.checked && (entry.monthKey ?? currentMonthKey) === monthKey,
    );

    const income = aggregateByTitle(
      checkedCashFlowEntries.filter((entry) => entry.type === "income"),
    );
    const expense = aggregateByTitle(
      checkedCashFlowEntries.filter((entry) => entry.type === "expense"),
    );
    const savings = aggregateByTitle(
      checkedSavingsDebtEntries.filter((entry) => entry.type === "saving"),
    );
    const debt = aggregateByTitle(
      checkedSavingsDebtEntries.filter(
        (entry) => entry.type === "debt" && !entry.closed,
      ),
    );

    const incomeTotal = getTotal(income);
    const expenseTotal = getTotal(expense);
    const savingsTotal = getTotal(savings);
    const debtTotal = getTotal(debt);

    return {
      balance: incomeTotal - expenseTotal,
      debtRows: debt,
      expenseRows: expense,
      incomeRows: income,
      overviewRows: [
        { actual: incomeTotal, category: "Доход" },
        { actual: expenseTotal, category: "Расход" },
        { actual: savingsTotal, category: "Накопление" },
        { actual: debtTotal, category: "Долги" },
      ],
      savingsRows: savings,
      totalDebt: debtTotal,
      totalExpense: expenseTotal,
      totalIncome: incomeTotal,
      totalSavings: savingsTotal,
    };
  }, [cashFlowEntries, currentMonthKey, monthKey, savingsDebtEntries]);

  return (
    <AppLayout>
      <div className="space-y-5">
        <header>
          <div>
            <MonthSwitcher monthKey={monthKey} onChange={setMonthKey} />
            <p className="mt-1 text-sm text-muted-foreground">
              Сводка по страницам Доходы - Расходы и Накопление - Долги.
            </p>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <MetricCard
            label="Накопилось за месяц"
            tone="savings"
            value={totalSavings}
          />
          <MetricCard label="Долги за месяц" tone="expense" value={totalDebt} />
          <MetricCard label="Доход состоялся" tone="income" value={totalIncome} />
          <MetricCard label="Траты были" tone="expense" value={totalExpense} />
          <MetricCard
            label="Баланс доходов"
            tone={balance >= 0 ? "income" : "expense"}
            value={balance}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
          <div className="space-y-4">
            <ChartCard title="Общий результат месяца">
              {overviewRows.some((row) => row.actual > 0) ? (
                <ResponsiveContainer height="100%" width="100%">
                  <BarChart data={overviewRows}>
                    <CartesianGrid stroke="#d7e4d8" vertical={false} />
                    <XAxis dataKey="category" fontSize={11} tickLine={false} />
                    <YAxis
                      fontSize={10}
                      tickFormatter={(value) => `${Number(value) / 1000}к`}
                    />
                    <Tooltip formatter={(value) => formatMoney(Number(value))} />
                    <Bar dataKey="actual" name="Факт" radius={[4, 4, 0, 0]}>
                      {overviewRows.map((row, index) => (
                        <Cell
                          fill={chartColors[index % chartColors.length]}
                          key={row.category}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            <ChartCard title="Доходы и траты">
              {incomeRows.length || expenseRows.length ? (
                <ResponsiveContainer height="100%" width="100%">
                  <BarChart
                    data={[
                      { actual: totalIncome, category: "Доход" },
                      { actual: totalExpense, category: "Расход" },
                    ]}
                  >
                    <CartesianGrid stroke="#d7e4d8" vertical={false} />
                    <XAxis dataKey="category" fontSize={11} tickLine={false} />
                    <YAxis
                      fontSize={10}
                      tickFormatter={(value) => `${Number(value) / 1000}к`}
                    />
                    <Tooltip formatter={(value) => formatMoney(Number(value))} />
                    <Bar dataKey="actual" radius={[4, 4, 0, 0]}>
                      <Cell fill="#059669" />
                      <Cell fill="#e11d48" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>
          </div>

          <div className="space-y-4">
            <MoneyTable
              accentClassName="bg-emerald-700"
              emptyLabel="На странице Доходы - Расходы нет отмеченных доходов."
              rows={incomeRows}
              title="Доходы"
            />
            <ChartCard title="Структура доходов">
              {incomeRows.length ? (
                <ResponsiveContainer height="100%" width="100%">
                  <PieChart>
                    <Pie
                      data={incomeRows}
                      dataKey="actual"
                      innerRadius={45}
                      nameKey="category"
                      outerRadius={90}
                    >
                      {incomeRows.map((row, index) => (
                        <Cell
                          fill={chartColors[index % chartColors.length]}
                          key={row.category}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatMoney(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>
            <MoneyTable
              accentClassName="bg-sky-600"
              emptyLabel="На странице Накопление - Долги нет отмеченных накоплений."
              rows={savingsRows}
              title="Накопления"
            />
          </div>

          <div className="space-y-4">
            <MoneyTable
              accentClassName="bg-rose-600"
              emptyLabel="На странице Доходы - Расходы нет отмеченных трат."
              rows={expenseRows}
              title="Расходы"
            />
            <ChartCard title="Структура расходов">
              {expenseRows.length ? (
                <ResponsiveContainer height="100%" width="100%">
                  <PieChart>
                    <Pie
                      data={expenseRows}
                      dataKey="actual"
                      innerRadius={0}
                      nameKey="category"
                      outerRadius={92}
                    >
                      {expenseRows.map((row, index) => (
                        <Cell
                          fill={chartColors[index % chartColors.length]}
                          key={row.category}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatMoney(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>
            <MoneyTable
              accentClassName="bg-violet-600"
              emptyLabel="На странице Накопление - Долги нет отмеченных долгов."
              rows={debtRows}
              title="Долги"
            />
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
