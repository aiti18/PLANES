"use client";

import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CircleDot,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSortableList } from "@/components/ui/use-sortable-list";
import { capitalizeFirstLetter } from "@/lib/utils";

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
const weekDayShort = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const monthNamesShort = monthNames.map((month) => month.toLowerCase());
const storageKey = "planes:day-page:v1";
const defaultMonthDate = new Date(2026, 0, 1);
const tasksPerDay = 3;

type DayTask = {
  id: string;
  title: string;
  done: boolean;
};

type DayTasksByDate = Record<string, DayTask[]>;

type StoredDayPage = {
  monthDate: string;
  tasksByDate: DayTasksByDate;
};

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getDateFromMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);

  return new Date(year, month - 1, 1);
}

function clampMonthDate(date: Date) {
  return date < defaultMonthDate ? defaultMonthDate : date;
}

function getDaysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getDays(date: Date) {
  return Array.from({ length: getDaysInMonth(date) }, (_, index) => {
    return new Date(date.getFullYear(), date.getMonth(), index + 1);
  });
}

function getMonthTitle(date: Date) {
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function getWeekdayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

function createEmptyDayTasks() {
  return Array.from({ length: tasksPerDay }, (_, index) => ({
    id: `default-${index}`,
    title: "",
    done: false,
  }));
}

function normalizeDayTasks(tasks: unknown): DayTask[] {
  if (!Array.isArray(tasks)) {
    return createEmptyDayTasks();
  }

  return Array.from(
    { length: Math.max(tasks.length, tasksPerDay) },
    (_, index) => {
      const task = tasks[index];

      if (!task || typeof task !== "object") {
        return { id: `default-${index}`, title: "", done: false };
      }

      return {
        id:
          "id" in task && typeof task.id === "string"
            ? task.id
            : `legacy-${index}`,
        title:
          "title" in task && typeof task.title === "string"
            ? capitalizeFirstLetter(task.title)
            : "",
        done: "done" in task && typeof task.done === "boolean" ? task.done : false,
      };
    },
  );
}

function isRemovableDayTask(task: DayTask) {
  return (
    task.id.startsWith("added-") ||
    (task.id.startsWith("legacy-") &&
      Number(task.id.slice("legacy-".length)) >= tasksPerDay)
  );
}

export default function DayPage() {
  const hasLoadedStorage = useRef(false);
  const [monthDate, setMonthDate] = useState(defaultMonthDate);
  const [tasksByDate, setTasksByDate] = useState<DayTasksByDate>({});
  const [activeAddDateKeys, setActiveAddDateKeys] = useState<Record<string, boolean>>({});
  const [taskDraftsByDate, setTaskDraftsByDate] = useState<Record<string, string>>({});
  const [isStorageReady, setIsStorageReady] = useState(false);

  const monthTitle = getMonthTitle(monthDate);
  const monthKey = getMonthKey(monthDate);
  const isMinMonth = monthDate <= defaultMonthDate;
  const days = useMemo(() => getDays(monthDate), [monthDate]);
  const completedTasks = days.reduce((sum, day) => {
    const dayTasks = tasksByDate[getDateKey(day)] ?? createEmptyDayTasks();

    return sum + dayTasks.filter((task) => task.title.trim() && task.done).length;
  }, 0);
  const totalTasks = days.reduce((sum, day) => {
    const dayTasks = tasksByDate[getDateKey(day)] ?? createEmptyDayTasks();

    return sum + dayTasks.filter((task) => task.title.trim()).length;
  }, 0);

  const sortableTasks = useSortableList((sourceId, targetId) => {
    const [sourceDateKey, sourceTaskId] = sourceId.split("|");
    const [targetDateKey, targetTaskId] = targetId.split("|");

    if (sourceDateKey !== targetDateKey) return;

    setTasksByDate((currentTasksByDate) => {
      const dayTasks = normalizeDayTasks(currentTasksByDate[sourceDateKey]);
      const sourceIndex = dayTasks.findIndex((task) => task.id === sourceTaskId);
      const targetIndex = dayTasks.findIndex((task) => task.id === targetTaskId);

      if (sourceIndex < 0 || targetIndex < 0) return currentTasksByDate;

      const nextDayTasks = [...dayTasks];
      const [movedTask] = nextDayTasks.splice(sourceIndex, 1);
      nextDayTasks.splice(targetIndex, 0, movedTask);

      return { ...currentTasksByDate, [sourceDateKey]: nextDayTasks };
    });
  });

  useEffect(() => {
    const storedValue = window.localStorage.getItem(storageKey);

    if (!storedValue) {
      hasLoadedStorage.current = true;
      setIsStorageReady(true);
      return;
    }

    try {
      const storedData = JSON.parse(storedValue) as Partial<StoredDayPage>;

      if (
        typeof storedData.monthDate === "string" &&
        /^\d{4}-\d{2}$/.test(storedData.monthDate)
      ) {
        setMonthDate(clampMonthDate(getDateFromMonthKey(storedData.monthDate)));
      }

      if (storedData.tasksByDate && typeof storedData.tasksByDate === "object") {
        setTasksByDate(
          Object.fromEntries(
            Object.entries(storedData.tasksByDate).map(([dateKey, tasks]) => [
              dateKey,
              normalizeDayTasks(tasks),
            ]),
          ),
        );
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

    const data: StoredDayPage = {
      monthDate: monthKey,
      tasksByDate,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(data));
  }, [isStorageReady, monthKey, tasksByDate]);

  function moveMonth(direction: -1 | 1) {
    setMonthDate((currentDate) => {
      return clampMonthDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1),
      );
    });
  }

  function updateTaskTitle(dateKey: string, taskIndex: number, title: string) {
    setTasksByDate((currentTasksByDate) => {
      const dayTasks = normalizeDayTasks(currentTasksByDate[dateKey]);
      const nextDayTasks = dayTasks.map((task, index) =>
        index === taskIndex
          ? { ...task, title: capitalizeFirstLetter(title) }
          : task,
      );

      return {
        ...currentTasksByDate,
        [dateKey]: nextDayTasks,
      };
    });
  }

  function toggleTaskDone(dateKey: string, taskIndex: number) {
    setTasksByDate((currentTasksByDate) => {
      const dayTasks = normalizeDayTasks(currentTasksByDate[dateKey]);
      const nextDayTasks = dayTasks.map((task, index) =>
        index === taskIndex ? { ...task, done: !task.done } : task,
      );

      return {
        ...currentTasksByDate,
        [dateKey]: nextDayTasks,
      };
    });
  }

  function deleteTask(dateKey: string, taskIndex: number) {
    setTasksByDate((currentTasksByDate) => {
      const dayTasks = normalizeDayTasks(currentTasksByDate[dateKey]);
      const task = dayTasks[taskIndex];

      if (!task || !isRemovableDayTask(task)) return currentTasksByDate;

      return {
        ...currentTasksByDate,
        [dateKey]: dayTasks.filter((_, index) => index !== taskIndex),
      };
    });
  }

  function showAddTaskInput(dateKey: string) {
    setActiveAddDateKeys((currentDates) => ({
      ...currentDates,
      [dateKey]: true,
    }));
  }

  function updateTaskDraft(dateKey: string, title: string) {
    setTaskDraftsByDate((currentDrafts) => ({
      ...currentDrafts,
      [dateKey]: title,
    }));
  }

  function addTask(dateKey: string) {
    const title = capitalizeFirstLetter(
      taskDraftsByDate[dateKey]?.trim() ?? "",
    );

    if (!title) {
      return;
    }

    setTasksByDate((currentTasksByDate) => {
      const dayTasks = normalizeDayTasks(currentTasksByDate[dateKey]);

      return {
        ...currentTasksByDate,
        [dateKey]: [
          ...dayTasks,
          { id: `added-${Date.now()}`, title, done: false },
        ],
      };
    });
    setTaskDraftsByDate((currentDrafts) => ({
      ...currentDrafts,
      [dateKey]: "",
    }));
    setActiveAddDateKeys((currentDates) => ({
      ...currentDates,
      [dateKey]: false,
    }));
  }

  function handleTaskDraftKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
    dateKey: string,
  ) {
    if (event.key === "Enter") {
      event.preventDefault();
      addTask(dateKey);
    }
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
              Топ-3 задачи на день
            </div>
            <h1 className="text-3xl font-black uppercase leading-none text-emerald-950 sm:text-4xl">
              День
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Заполняйте три главные задачи для каждого дня месяца и отмечайте
              выполнение.
            </p>
          </div>

          <div className="grid grid-cols-[36px_160px_36px] items-center gap-2">
            <button
              aria-label="Предыдущий месяц"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-900/20 bg-white text-emerald-900 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={isMinMonth}
              onClick={() => moveMonth(-1)}
              title="Предыдущий месяц"
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="w-40 text-center">
              <p className="text-xs font-black uppercase text-emerald-900">
                {monthTitle}
              </p>
              <p className="text-xs font-bold text-slate-500">
                {completedTasks} / {totalTasks || 0} выполнено
              </p>
            </div>
            <button
              aria-label="Следующий месяц"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-900/20 bg-white text-emerald-900 transition hover:bg-emerald-50"
              onClick={() => moveMonth(1)}
              title="Следующий месяц"
              type="button"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </header>

        <section className="rounded-md border border-emerald-900/15 bg-white p-3 shadow-sm sm:p-4">
          <div className="mb-3 rounded-md bg-emerald-950 px-3 py-3 text-center text-sm font-black uppercase text-white">
            Топ-3 задачи на день
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {days.map((day) => {
              const dateKey = getDateKey(day);
              const dayTasks = normalizeDayTasks(tasksByDate[dateKey]);
              const isAddInputActive = activeAddDateKeys[dateKey];

              return (
                <article
                  className="overflow-hidden rounded-md border border-emerald-900/15 bg-[#f8faf5] text-slate-800 shadow-sm"
                  key={dateKey}
                >
                  <div className="flex items-center gap-2 border-b border-emerald-900/15 bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-950">
                    <div className="min-w-0 flex-1 text-center">
                      <span>{day.getDate()}-день</span>
                      <span className="ml-2 text-xs font-bold text-emerald-700">
                        {day.getDate()}-{monthNamesShort[day.getMonth()]}{" "}
                        {weekDayShort[getWeekdayIndex(day)].toLowerCase()}
                      </span>
                    </div>
                    <button
                      aria-label={`Добавить задачу, ${day.getDate()} день`}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-900/15 bg-white text-emerald-800 transition hover:bg-emerald-100"
                      onClick={() => showAddTaskInput(dateKey)}
                      title="Добавить задачу"
                      type="button"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-emerald-900/10">
                    {dayTasks.map((task, taskIndex) => (
                      <div
                        className={
                          isRemovableDayTask(task)
                            ? "grid min-h-9 grid-cols-[32px_minmax(0,1fr)_44px_44px] items-center"
                            : "grid min-h-9 grid-cols-[32px_minmax(0,1fr)_44px] items-center"
                        }
                        key={`${dateKey}-${task.id}`}
                        {...sortableTasks.getItemProps(`${dateKey}|${task.id}`)}
                      >
                        <button
                          aria-label={`Изменить порядок задачи ${taskIndex + 1}, ${day.getDate()} день`}
                          className="flex h-9 touch-none cursor-grab items-center justify-center text-slate-400 active:cursor-grabbing active:text-emerald-800"
                          title="Перетащите, чтобы изменить порядок"
                          type="button"
                          {...sortableTasks.getHandleProps(`${dateKey}|${task.id}`)}
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                        <input
                          aria-label={`Задача ${taskIndex + 1}, ${day.getDate()} день`}
                          className="h-9 min-w-0 bg-transparent px-3 text-center text-xs font-semibold text-slate-700 outline-none placeholder:text-slate-400 focus:bg-emerald-50"
                          onChange={(event) =>
                            updateTaskTitle(dateKey, taskIndex, event.target.value)
                          }
                          placeholder="Задача"
                          value={task.title}
                        />
                        {isRemovableDayTask(task) && (
                          <button
                            aria-label={`Удалить задачу ${taskIndex + 1}, ${day.getDate()} день`}
                            className="flex h-9 items-center justify-center border-l border-emerald-900/10 bg-white/70 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            onClick={() => deleteTask(dateKey, taskIndex)}
                            title="Удалить задачу"
                            type="button"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        <label className="flex h-9 items-center justify-center border-l border-emerald-900/10 bg-white/70">
                          <input
                            aria-label={`Выполнено: задача ${taskIndex + 1}, ${day.getDate()} день`}
                            checked={task.done}
                            className="h-4 w-4 accent-emerald-700"
                            onChange={() => toggleTaskDone(dateKey, taskIndex)}
                            type="checkbox"
                          />
                        </label>
                      </div>
                    ))}
                    {isAddInputActive ? (
                      <div className="grid min-h-9 grid-cols-[minmax(0,1fr)_44px] items-center bg-white/70">
                        <input
                          aria-label={`Новая задача, ${day.getDate()} день`}
                          autoFocus
                          className="h-9 min-w-0 bg-transparent px-3 text-center text-xs font-semibold text-slate-700 outline-none placeholder:text-slate-400 focus:bg-emerald-50"
                          onBlur={() => {
                            if (!taskDraftsByDate[dateKey]?.trim()) {
                              setActiveAddDateKeys((currentDates) => ({
                                ...currentDates,
                                [dateKey]: false,
                              }));
                            }
                          }}
                          onChange={(event) =>
                            updateTaskDraft(dateKey, event.target.value)
                          }
                          onKeyDown={(event) =>
                            handleTaskDraftKeyDown(event, dateKey)
                          }
                          placeholder="Название задачи"
                          value={taskDraftsByDate[dateKey] ?? ""}
                        />
                        <button
                          aria-label={`Сохранить новую задачу, ${day.getDate()} день`}
                          className="flex h-9 items-center justify-center border-l border-emerald-900/10 bg-white/80 text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={!taskDraftsByDate[dateKey]?.trim()}
                          onClick={() => addTask(dateKey)}
                          title="Сохранить задачу"
                          type="button"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
