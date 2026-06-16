"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Plus,
  RotateCcw,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";

const weekDayShort = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const weekDayLong = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];
const monthNames = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];
const monthGenitives = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

const storageKey = "planes:month-page:v1";
const minMonthKey = "2026-01";
const firstTaskMonthKey = minMonthKey;
const defaultMonthKey = minMonthKey;
const defaultFocus =
  "Что нужно сделать в этом месяце:\n- закрыть важные задачи\n- держать режим\n- не терять фокус";
const defaultNotes =
  "Итоги месяца, идеи, что перенести, что усилить в следующем месяце.";

type MonthTask = {
  id: string;
  title: string;
  completed: boolean;
  createdMonthKey: string;
};

type StoredMonthPage = {
  monthDate: string;
  tasks: MonthTask[];
  marks: string[];
  hiddenTaskIdsByMonth?: Record<string, string[]>;
  focus: string;
  notes: string;
};

const initialTasks: MonthTask[] = [
  {
    id: "morning",
    title: "Утренняя рутина и план на день",
    completed: true,
    createdMonthKey: defaultMonthKey,
  },
  {
    id: "work",
    title: "Рабочий фокус 4-5 часов",
    completed: true,
    createdMonthKey: defaultMonthKey,
  },
  {
    id: "sport",
    title: "Спорт или прогулка",
    completed: true,
    createdMonthKey: defaultMonthKey,
  },
  {
    id: "study",
    title: "Обучение / чтение",
    completed: false,
    createdMonthKey: defaultMonthKey,
  },
  {
    id: "finance",
    title: "Финансовый учет",
    completed: false,
    createdMonthKey: defaultMonthKey,
  },
  {
    id: "review",
    title: "Вечерний обзор",
    completed: false,
    createdMonthKey: defaultMonthKey,
  },
];

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthTitle(date: Date) {
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function getDaysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getDays(date: Date) {
  return Array.from({ length: getDaysInMonth(date) }, (_, index) => index + 1);
}

function getMarkKey(monthKey: string, taskId: string, day: number) {
  return `${monthKey}:${taskId}:${day}`;
}

function normalizeTitle(title: string) {
  return title.trim().replace(/\s+/g, " ").toLowerCase();
}

function isMonthKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value);
}

function isTaskCreatedInMonth(task: MonthTask, monthKey: string) {
  return task.createdMonthKey === monthKey;
}

function getDateFromMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);

  return new Date(year, month - 1, 1);
}

function clampMonthDate(date: Date) {
  const minMonthDate = getDateFromMonthKey(minMonthKey);

  return date < minMonthDate ? minMonthDate : date;
}

function getStoredTaskCreatedMonthKey(value: unknown) {
  if (!isMonthKey(value)) {
    return firstTaskMonthKey;
  }

  return value < firstTaskMonthKey ? firstTaskMonthKey : value;
}

function getWeekdayIndex(date: Date, day: number) {
  return (new Date(date.getFullYear(), date.getMonth(), day).getDay() + 6) % 7;
}

function getWeekdayShort(date: Date, day: number) {
  return weekDayShort[getWeekdayIndex(date, day)];
}

function getWeekdayLong(date: Date, day: number) {
  return weekDayLong[getWeekdayIndex(date, day)];
}

function createInitialMarks(date: Date) {
  const marks = new Set<string>();
  const monthKey = getMonthKey(date);

  initialTasks.forEach((task, rowIndex) => {
    getDays(date).forEach((day) => {
      const marked =
        (day + rowIndex) % 5 !== 0 && (day * (rowIndex + 2)) % 7 !== 0;

      if (marked) {
        marks.add(getMarkKey(monthKey, task.id, day));
      }
    });
  });

  return marks;
}

export default function MonthPage() {
  const hasLoadedStorage = useRef(false);
  const [monthDate, setMonthDate] = useState(() => getDateFromMonthKey(defaultMonthKey));
  const [tasks, setTasks] = useState(initialTasks);
  const [marks, setMarks] = useState(() =>
    createInitialMarks(getDateFromMonthKey(defaultMonthKey)),
  );
  const [hiddenTaskIdsByMonth, setHiddenTaskIdsByMonth] = useState<
    Record<string, string[]>
  >({});
  const [focus, setFocus] = useState(defaultFocus);
  const [notes, setNotes] = useState(defaultNotes);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [taskIdPendingDelete, setTaskIdPendingDelete] = useState<string | null>(null);
  const [isStorageReady, setIsStorageReady] = useState(false);

  const monthKey = getMonthKey(monthDate);
  const monthTitle = getMonthTitle(monthDate);
  const monthGenitive = monthGenitives[monthDate.getMonth()];
  const days = useMemo(() => getDays(monthDate), [monthDate]);
  const visibleDays = days;
  const isMinMonth = monthKey <= minMonthKey;
  const hiddenTaskIds = hiddenTaskIdsByMonth[monthKey] ?? [];
  const visibleTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          isTaskCreatedInMonth(task, monthKey) && !hiddenTaskIds.includes(task.id),
      ),
    [hiddenTaskIds, monthKey, tasks],
  );
  const taskPendingDelete = taskIdPendingDelete
    ? tasks.find((task) => task.id === taskIdPendingDelete)
    : null;

  const completedMarks = days.reduce(
    (sum, day) =>
      sum +
      visibleTasks.filter((task) => marks.has(getMarkKey(monthKey, task.id, day)))
        .length,
    0,
  );
  const totalMarks = visibleTasks.length * days.length;
  const monthProgress = totalMarks
    ? Math.round((completedMarks / totalMarks) * 100)
    : 0;

  const taskProgressItems = useMemo(
    () =>
      visibleTasks.map((task) => {
        const done = days.filter((day) =>
          marks.has(getMarkKey(monthKey, task.id, day)),
        ).length;

        return {
          id: task.id,
          title: task.title,
          progress: days.length ? Math.round((done / days.length) * 100) : 0,
        };
      }),
    [days, marks, monthKey, visibleTasks],
  );

  useEffect(() => {
    const storedValue = window.localStorage.getItem(storageKey);

    if (!storedValue) {
      hasLoadedStorage.current = true;
      setIsStorageReady(true);
      return;
    }

    try {
      const storedData = JSON.parse(storedValue) as Partial<StoredMonthPage>;
      const storedDate = storedData.monthDate
        ? new Date(`${storedData.monthDate}T00:00:00`)
        : null;

      if (storedDate && !Number.isNaN(storedDate.getTime())) {
        setMonthDate(clampMonthDate(storedDate));
      }

      if (Array.isArray(storedData.tasks)) {
        const fallbackCreatedMonthKey = isMonthKey(storedData.monthDate)
          ? storedData.monthDate
          : defaultMonthKey;

        setTasks(
          storedData.tasks
            .filter(
              (task): task is MonthTask =>
              typeof task?.id === "string" &&
              typeof task.title === "string" &&
              typeof task.completed === "boolean",
            )
            .map((task) => ({
              ...task,
              createdMonthKey: getStoredTaskCreatedMonthKey(
                isMonthKey(task.createdMonthKey)
                  ? task.createdMonthKey
                  : fallbackCreatedMonthKey,
              ),
            })),
        );
      }

      if (Array.isArray(storedData.marks)) {
        setMarks(
          new Set(
            storedData.marks.filter((mark): mark is string => typeof mark === "string"),
          ),
        );
      }

      if (
        storedData.hiddenTaskIdsByMonth &&
        typeof storedData.hiddenTaskIdsByMonth === "object"
      ) {
        setHiddenTaskIdsByMonth(
          Object.fromEntries(
            Object.entries(storedData.hiddenTaskIdsByMonth).map(([key, value]) => [
              key,
              Array.isArray(value)
                ? value.filter((taskId): taskId is string => typeof taskId === "string")
                : [],
            ]),
          ),
        );
      }

      if (typeof storedData.focus === "string") {
        setFocus(storedData.focus);
      }

      if (typeof storedData.notes === "string") {
        setNotes(storedData.notes);
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    } finally {
      hasLoadedStorage.current = true;
      setIsStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage.current || !isStorageReady) {
      return;
    }

    const data: StoredMonthPage = {
      monthDate: getMonthKey(monthDate),
      tasks,
      marks: Array.from(marks),
      hiddenTaskIdsByMonth,
      focus,
      notes,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(data));
  }, [focus, hiddenTaskIdsByMonth, isStorageReady, marks, monthDate, notes, tasks]);

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = newTaskTitle.trim();

    if (!title) {
      return;
    }

    const normalizedTitle = normalizeTitle(title);
    const existingTask = tasks.find(
      (task) =>
        normalizeTitle(task.title) === normalizedTitle &&
        isTaskCreatedInMonth(task, monthKey),
    );

    if (existingTask) {
      setHiddenTaskIdsByMonth((currentHiddenTaskIdsByMonth) => ({
        ...currentHiddenTaskIdsByMonth,
        [monthKey]: (currentHiddenTaskIdsByMonth[monthKey] ?? []).filter(
          (taskId) => taskId !== existingTask.id,
        ),
      }));
      setNewTaskTitle("");
      return;
    }

    setTasks((currentTasks) => [
      ...currentTasks,
      {
        id: `task-${Date.now()}`,
        title,
        completed: false,
        createdMonthKey: monthKey,
      },
    ]);
    setNewTaskTitle("");
  }

  function hideTaskForMonth(taskId: string) {
    setHiddenTaskIdsByMonth((currentHiddenTaskIdsByMonth) => {
      const currentHiddenTaskIds = currentHiddenTaskIdsByMonth[monthKey] ?? [];

      if (currentHiddenTaskIds.includes(taskId)) {
        return currentHiddenTaskIdsByMonth;
      }

      return {
        ...currentHiddenTaskIdsByMonth,
        [monthKey]: [...currentHiddenTaskIds, taskId],
      };
    });
    setTaskIdPendingDelete(null);
  }

  function toggleDayMark(taskId: string, day: number) {
    const key = getMarkKey(monthKey, taskId, day);

    setMarks((currentMarks) => {
      const nextMarks = new Set(currentMarks);

      if (nextMarks.has(key)) {
        nextMarks.delete(key);
      } else {
        nextMarks.add(key);
      }

      return nextMarks;
    });
  }

  function moveMonth(direction: -1 | 1) {
    setMonthDate((currentDate) => {
      return clampMonthDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1),
      );
    });
  }

  function selectMonth(monthIndex: number) {
    const nextDate = new Date(monthDate.getFullYear(), monthIndex, 1);

    setMonthDate(clampMonthDate(nextDate));
  }

  function resetMonth() {
    setTasks(
      initialTasks.map((task) => ({
        ...task,
        createdMonthKey: firstTaskMonthKey,
      })),
    );
    setMarks(createInitialMarks(monthDate));
    setHiddenTaskIdsByMonth((currentHiddenTaskIdsByMonth) => {
      const nextHiddenTaskIdsByMonth = { ...currentHiddenTaskIdsByMonth };
      delete nextHiddenTaskIdsByMonth[monthKey];
      return nextHiddenTaskIdsByMonth;
    });
    setFocus(defaultFocus);
    setNotes(defaultNotes);
    setNewTaskTitle("");
  }

  if (!isStorageReady) {
    return (
      <AppLayout>
        <div className="w-full rounded-md border border-emerald-900/20 bg-[#f5f7f2] p-5 text-slate-900 shadow-xl shadow-emerald-950/10">
          <div className="h-[60dvh] rounded-md border border-emerald-900/15 bg-white" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="w-full rounded-md border border-emerald-900/20 bg-[#f5f7f2] p-3 text-slate-900 shadow-xl shadow-emerald-950/10 sm:p-4 lg:p-5">
        <header className="mb-4 flex flex-col gap-4 border-b-4 border-emerald-800 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-800">
              <CircleDot className="h-4 w-4 fill-emerald-700/20" />
              Ежемесячный план
            </div>
            <h1 className="text-3xl font-black uppercase leading-none text-emerald-950 sm:text-4xl">
              Месяц
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Добавляйте пункты, отмечайте дни и смотрите прогресс месяца.
            </p>
          </div>

          <div className="grid w-full max-w-6xl grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12">
            {monthNames.map((month, index) => {
              const isActive = monthDate.getMonth() === index;

              return (
                <button
                  className={cn(
                    "min-w-0 rounded-md border px-2 py-2 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md 2xl:px-3",
                    isActive
                      ? "border-emerald-800 bg-emerald-900 text-white"
                      : "border-emerald-900/15 bg-white text-slate-700",
                  )}
                  key={month}
                  onClick={() => selectMonth(index)}
                  type="button"
                >
                  <p
                    className={cn(
                      "whitespace-nowrap text-[11px] font-black uppercase xl:text-[10px] 2xl:text-xs",
                      isActive ? "text-white" : "text-emerald-800",
                    )}
                  >
                    {month}
                  </p>
                </button>
              );
            })}
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <section className="rounded-md border border-emerald-900/15 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase text-emerald-900">
                  Пункты месяца
                </p>
                <button
                  aria-label="Сбросить демо-данные"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-900/20 bg-white text-emerald-900 shadow-sm transition hover:bg-emerald-50"
                  onClick={resetMonth}
                  title="Сбросить демо-данные"
                  type="button"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              <form className="mb-3 flex gap-2" onSubmit={addTask}>
                <input
                  className="min-w-0 flex-1 rounded-md border border-emerald-900/20 bg-[#f8faf5] px-3 py-2 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
                  onChange={(event) => setNewTaskTitle(event.target.value)}
                  placeholder="Новый пункт"
                  value={newTaskTitle}
                />
                <button
                  aria-label="Добавить пункт"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={!newTaskTitle.trim()}
                  title="Добавить пункт"
                  type="submit"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>

              <div className="space-y-2">
                {visibleTasks.map((task) => (
                  <div
                    className="flex w-full items-center gap-2 rounded-md border border-emerald-900/10 bg-[#f8faf5] px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-700/40 hover:bg-emerald-50"
                    key={task.id}
                  >
                    <span className="min-w-0 flex-1 px-1">{task.title}</span>
                    <button
                      aria-label={`Удалить пункт "${task.title}" только из месяца ${monthTitle}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-900/10 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      onClick={() => setTaskIdPendingDelete(task.id)}
                      title="Удалить только из этого месяца"
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-md border border-emerald-900/15 bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase text-emerald-900">
                Главный фокус
              </p>
              <textarea
                className="mt-3 min-h-28 w-full resize-none rounded-md border border-emerald-900/20 bg-emerald-50/70 p-3 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
                onChange={(event) => setFocus(event.target.value)}
                value={focus}
              />
            </section>
          </aside>

          <div className="min-w-0 space-y-4">
            <section className="min-w-0 rounded-md border border-emerald-900/15 bg-white p-3 shadow-sm sm:p-4">
              <div className="mb-4 flex flex-col gap-3 border-b border-emerald-900/15 pb-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <button
                      aria-label="Предыдущий месяц"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-900/20 bg-white text-emerald-900 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={isMinMonth}
                      onClick={() => moveMonth(-1)}
                      title="Предыдущий месяц"
                      type="button"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div>
                      <p className="text-xs font-black uppercase text-emerald-900">
                        Трекер по дням
                      </p>
                      <h2 className="text-xl font-black text-slate-900">
                        {monthTitle}
                      </h2>
                    </div>
                    <button
                      aria-label="Следующий месяц"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-900/20 bg-white text-emerald-900 transition hover:bg-emerald-50"
                      onClick={() => moveMonth(1)}
                      title="Следующий месяц"
                      type="button"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                  <span className="h-3 w-3 rounded-full border-2 border-emerald-700 bg-emerald-700" />
                  выполнено
                  <span className="ml-2 h-3 w-3 rounded-full border-2 border-emerald-700 bg-white" />
                  пусто
                </div>
              </div>

              <div className="overflow-x-auto pb-2">
                <div style={{ minWidth: 900 }}>
                  <div
                    className="grid gap-1"
                    style={{
                      gridTemplateColumns: `minmax(150px, 180px) repeat(${visibleDays.length}, minmax(24px, 1fr))`,
                    }}
                  >
                    <div className="rounded-md bg-emerald-950 px-3 py-2 text-xs font-black uppercase text-white">
                      Действие
                    </div>
                    {visibleDays.map((day) => (
                      <div
                        className="flex h-10 flex-col items-center justify-center rounded-md bg-emerald-950 text-white"
                        key={day}
                        title={`${day} ${monthGenitive} - ${getWeekdayLong(monthDate, day)}`}
                      >
                        <span className="text-xs font-black leading-none">
                          {day}
                        </span>
                        <span className="mt-1 text-[9px] font-black uppercase leading-none text-emerald-100">
                          {getWeekdayShort(monthDate, day)}
                        </span>
                      </div>
                    ))}

                    {visibleTasks.map((task) => (
                      <div className="contents" key={task.id}>
                        <div className="flex min-h-10 items-center rounded-md bg-emerald-50 px-3 text-xs font-bold text-slate-700">
                          {task.title}
                        </div>
                        {visibleDays.map((day) => {
                          const marked = marks.has(getMarkKey(monthKey, task.id, day));

                          return (
                            <button
                              aria-label={`${marked ? "Снять" : "Поставить"} отметку: ${task.title}, ${day} число`}
                              className="flex min-h-10 items-center justify-center rounded-md bg-[#f8faf5] transition hover:bg-emerald-50"
                              key={`${task.id}-${day}`}
                              onClick={() => toggleDayMark(task.id, day)}
                              type="button"
                            >
                              <span
                                className={cn(
                                  "flex h-5 w-5 items-center justify-center rounded-full border-2 transition",
                                  marked
                                    ? "border-emerald-800 bg-emerald-700 text-white"
                                    : "border-emerald-700 bg-white",
                                )}
                              >
                                {marked && <Check className="h-3 w-3" />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <aside className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px_240px]">
              <section className="rounded-md border border-emerald-900/15 bg-white p-4 shadow-sm">
              <p className="mb-4 text-xs font-black uppercase text-emerald-900">
                Разделы
              </p>
              <div className="space-y-4">
                {taskProgressItems.map((item) => (
                  <div key={item.id}>
                    <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="min-w-0 pr-3">{item.title}</span>
                      <span>{item.progress}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-emerald-100">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-emerald-900 to-lime-500 transition-all"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
                {taskProgressItems.length === 0 && (
                  <p className="text-sm font-medium text-slate-500">
                    В этом месяце нет пунктов.
                  </p>
                )}
              </div>
              </section>

              <section className="rounded-md border border-emerald-900/15 bg-emerald-950 p-4 text-white shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-black uppercase">Прогресс</p>
                <TrendingUp className="h-5 w-5 text-lime-300" />
              </div>
              <p className="text-3xl font-black">
                {completedMarks} / {totalMarks}
              </p>
              <p className="mt-1 text-xs text-emerald-100">
                {monthProgress}% отметок закрыто за месяц
              </p>
              </section>

              <section className="rounded-md border border-emerald-900/15 bg-emerald-950 p-4 text-white shadow-sm">
              <p className="text-xs font-black uppercase text-white">
                Заметки
              </p>
              <textarea
                className="mt-3 min-h-32 w-full resize-none rounded-md border border-white/20 bg-white/10 p-3 text-sm text-white outline-none transition placeholder:text-emerald-100 focus:border-lime-300 focus:ring-2 focus:ring-lime-300/20"
                onChange={(event) => setNotes(event.target.value)}
                value={notes}
              />
              </section>
            </aside>
          </div>
        </div>
      </div>

      {taskPendingDelete && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-sm rounded-md border border-emerald-900/15 bg-white p-5 text-slate-900 shadow-xl">
            <p className="text-sm font-black uppercase text-emerald-900">
              Подтвердить удаление
            </p>
            <p className="mt-3 text-sm font-medium text-slate-700">
              Удалить пункт “{taskPendingDelete.title}” только из месяца{" "}
              {monthTitle}?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded-md border border-emerald-900/15 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-emerald-50"
                onClick={() => setTaskIdPendingDelete(null)}
                type="button"
              >
                Отмена
              </button>
              <button
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
                onClick={() => hideTaskForMonth(taskPendingDelete.id)}
                type="button"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
