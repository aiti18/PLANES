"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { capitalizeFirstLetter } from "@/lib/utils";

const storageKey = "planes:year-goals:v1";
const rowsPerCategory = 20;

const categories = ["Финансы"];

type YearGoalsData = {
  goals: string[];
  goalChecks: boolean[];
};

function createInitialData(): YearGoalsData {
  const rowCount = categories.length * rowsPerCategory;
  const emptyRows = Array.from({ length: rowCount }, () => "");
  const emptyChecks = Array.from({ length: rowCount }, () => false);

  return {
    goals: ["Цели", ...emptyRows.slice(1)],
    goalChecks: [...emptyChecks],
  };
}

function normalizeRows(rows: unknown, fallbackRows: string[]) {
  const sourceRows = Array.isArray(rows) ? rows : fallbackRows;
  const rowCount = Math.max(sourceRows.length, fallbackRows.length);

  return Array.from({ length: rowCount }, (_, index) => {
    const fallbackRow = fallbackRows[index] ?? "";
    const row = sourceRows[index];

    return typeof row === "string" ? row : fallbackRow;
  });
}

function normalizeChecks(checks: unknown, fallbackChecks: boolean[]) {
  const sourceChecks = Array.isArray(checks) ? checks : fallbackChecks;
  const checkCount = Math.max(sourceChecks.length, fallbackChecks.length);

  return Array.from({ length: checkCount }, (_, index) => {
    const fallbackCheck = fallbackChecks[index] ?? false;
    const check = sourceChecks[index];

    return typeof check === "boolean" ? check : fallbackCheck;
  });
}

function normalizeData(data: unknown): YearGoalsData {
  const initialData = createInitialData();

  if (!data || typeof data !== "object") {
    return initialData;
  }

  const storedData = data as Partial<YearGoalsData>;

  return {
    goals: normalizeRows(storedData.goals, initialData.goals).map((goal, index) => {
      if (index === 0 && goal === "Накопить 300к к концу года") {
        return "Цели";
      }

      return goal;
    }),
    goalChecks: normalizeChecks(storedData.goalChecks, initialData.goalChecks),
  };
}

export default function YearGoalsPage() {
  const hasLoadedStorage = useRef(false);
  const [data, setData] = useState<YearGoalsData>(() => createInitialData());

  useEffect(() => {
    const storedValue = window.localStorage.getItem(storageKey);

    if (storedValue) {
      try {
        setData(normalizeData(JSON.parse(storedValue)));
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }

    hasLoadedStorage.current = true;
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage.current) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(data));
  }, [data]);

  function updateGoal(rowIndex: number, value: string) {
    setData((currentData) => ({
      ...currentData,
      goals: currentData.goals.map((goal, index) =>
        index === rowIndex ? capitalizeFirstLetter(value) : goal,
      ),
    }));
  }

  function toggleGoalCheck(rowIndex: number) {
    setData((currentData) => ({
      ...currentData,
      goalChecks: currentData.goalChecks.map((checked, index) =>
        index === rowIndex ? !checked : checked,
      ),
    }));
  }

  function addGoalInput() {
    setData((currentData) => ({
      ...currentData,
      goals: [...currentData.goals, ""],
      goalChecks: [...currentData.goalChecks, false],
    }));
  }

  function deleteGoalInput(rowIndex: number) {
    if (rowIndex === 0) {
      return;
    }

    setData((currentData) => ({
      ...currentData,
      goals: currentData.goals.filter((_, index) => index !== rowIndex),
      goalChecks: currentData.goalChecks.filter((_, index) => index !== rowIndex),
    }));
  }

  const visibleRowsCount = Math.max(data.goals.length, data.goalChecks.length);

  return (
    <AppLayout>
      <section className="w-full overflow-hidden rounded-md border border-emerald-900/20 bg-[#f5f7f2] p-3 text-slate-900 shadow-xl shadow-emerald-950/10 sm:p-4 lg:p-5">
        <header className="mb-4 border-b-4 border-emerald-800 pb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
            Годовой план
          </p>
          <h1 className="mt-1 text-3xl font-black uppercase leading-none text-emerald-950 sm:text-4xl">
            Цели на год
          </h1>
        </header>

        <div className="overflow-hidden sm:overflow-x-auto">
          <div className="w-full sm:min-w-[520px]">
            <div className="grid grid-cols-[minmax(0,1fr)_40px] overflow-hidden rounded-md border-l border-t border-emerald-900/15 bg-white shadow-sm sm:grid-cols-[128px_minmax(240px,1fr)_56px]">
              <div className="col-span-2 flex h-12 items-center justify-center border-b border-r border-emerald-900/15 bg-emerald-950 text-base font-black uppercase text-white sm:col-span-3">
                Цели на год
              </div>

              <div className="col-span-2 h-8 border-b border-r border-emerald-900/15 bg-emerald-50 sm:col-span-3" />

              {categories.map((category, categoryIndex) =>
                Array.from({ length: visibleRowsCount }, (_, rowIndex) => {
                  const globalRowIndex = categoryIndex * visibleRowsCount + rowIndex;
                  const isTitleRow = globalRowIndex === 0;

                  return (
                    <div className="contents" key={`${category}-${rowIndex}`}>
                      {rowIndex === 0 && (
                        <div
                          className="hidden items-center justify-center border-b border-r border-emerald-900/15 bg-emerald-50 px-3 text-center text-xs font-black uppercase text-emerald-950 sm:flex"
                          style={{ gridRow: `span ${visibleRowsCount}` }}
                        >
                          {category}
                        </div>
                      )}

                      <input
                        aria-label={`${category}, цель ${rowIndex + 1}`}
                        className={
                          isTitleRow
                            ? "h-8 min-w-0 border-b border-r-2 border-emerald-900/25 bg-emerald-50 px-2 text-center text-xs font-black uppercase text-emerald-950 outline-none transition focus:bg-emerald-100"
                            : "h-8 min-w-0 border-b border-r-2 border-emerald-900/25 bg-[#f8faf5] px-2 text-center text-[11px] font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:bg-emerald-50"
                        }
                        onChange={(event) =>
                          updateGoal(globalRowIndex, event.target.value)
                        }
                        placeholder={
                          isTitleRow ? undefined : "Напишите что-нибудь"
                        }
                        value={data.goals[globalRowIndex]}
                      />
                      <div className="relative flex h-8 items-center justify-center border-b border-r border-emerald-900/15 bg-white">
                        {isTitleRow ? (
                          <button
                            aria-label="Добавить пустое поле цели"
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-emerald-900/15 bg-white text-emerald-800 transition hover:bg-emerald-100"
                            onClick={addGoalInput}
                            title="Добавить поле"
                            type="button"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <>
                            {data.goals[globalRowIndex]?.trim() ? (
                              <button
                                aria-label={`Удалить поле цели ${rowIndex + 1}`}
                                className="absolute left-1 flex h-6 w-6 items-center justify-center text-slate-400 transition hover:text-red-600"
                                onClick={() => deleteGoalInput(globalRowIndex)}
                                title="Удалить поле"
                                type="button"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            ) : null}
                            <button
                              aria-label={`Отметить цель: ${category}, цель ${rowIndex + 1}`}
                              aria-pressed={data.goalChecks[globalRowIndex]}
                              className={
                                data.goalChecks[globalRowIndex]
                                  ? "flex h-6 w-6 items-center justify-center rounded-full border border-emerald-700 bg-emerald-700 text-white transition focus:outline-none focus:ring-2 focus:ring-emerald-700/25"
                                  : "flex h-6 w-6 items-center justify-center rounded-full border-2 border-emerald-900/25 bg-white text-white transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-700/25"
                              }
                              onClick={() => toggleGoalCheck(globalRowIndex)}
                              type="button"
                            >
                              {data.goalChecks[globalRowIndex] && (
                                <Check className="h-3.5 w-3.5" strokeWidth={3} />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                }),
              )}
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
