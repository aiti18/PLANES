"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  GripVertical,
  Plus,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSortableList } from "@/components/ui/use-sortable-list";
import { capitalizeFirstLetter, cn } from "@/lib/utils";
import { loadPlannerDocument, savePlannerDocument } from "@/lib/supabase-data";

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

const minWeekDate = new Date(2026, 0, 1);
const defaultFocus =
  "Что нужно сделать на этой неделе:\n- выбрать главный фокус\n- закрыть важные задачи\n- сохранить ритм";
const defaultNotes = "Итоги недели, идеи, что перенести, что усилить дальше.";

type WeekTask = {
  id: string;
  title: string;
  completed: boolean;
  createdWeekKey: string;
};

type StoredWeekPage = {
  weekDate: string;
  tasks: WeekTask[];
  marks: string[];
  hiddenTaskIdsByWeek?: Record<string, string[]>;
  focus: string;
  notes: string;
};

function getDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getWeekKey(date: Date) {
  return getDateKey(date);
}

function getDateFromKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function clampWeekDate(date: Date) {
  return date < minWeekDate ? minWeekDate : date;
}

function getWeekDays(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function formatDay(date: Date) {
  return `${date.getDate()} ${monthGenitives[date.getMonth()]}`;
}

function getWeekTitle(days: Date[]) {
  const firstDay = days[0];
  const lastDay = days[days.length - 1];

  return `${formatDay(firstDay)} - ${formatDay(lastDay)} ${lastDay.getFullYear()}`;
}

function normalizeTitle(title: string) {
  return title.trim().replace(/\s+/g, " ").toLowerCase();
}

function isWeekTaskCreatedInWeek(task: WeekTask, weekKey: string) {
  return task.createdWeekKey === weekKey;
}

function getMarkKey(weekKey: string, taskId: string, dayIndex: number) {
  return `${weekKey}:${taskId}:${dayIndex}`;
}

const defaultWeekKey = getWeekKey(minWeekDate);

const initialTasks: WeekTask[] = [
  {
    id: "weekly-focus",
    title: "Главный фокус недели",
    completed: false,
    createdWeekKey: defaultWeekKey,
  },
  {
    id: "work-sprint",
    title: "Рабочий спринт",
    completed: false,
    createdWeekKey: defaultWeekKey,
  },
  {
    id: "health-rhythm",
    title: "Режим и здоровье",
    completed: false,
    createdWeekKey: defaultWeekKey,
  },
];

function createInitialMarks() {
  return new Set<string>();
}

export default function WeekPage() {
  const hasLoadedStorage = useRef(false);
  const [weekDate, setWeekDate] = useState(() => minWeekDate);
  const [tasks, setTasks] = useState(initialTasks);
  const [marks, setMarks] = useState(() => createInitialMarks());
  const [hiddenTaskIdsByWeek, setHiddenTaskIdsByWeek] = useState<
    Record<string, string[]>
  >({});
  const [focus, setFocus] = useState(defaultFocus);
  const [notes, setNotes] = useState(defaultNotes);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [taskIdPendingDelete, setTaskIdPendingDelete] = useState<string | null>(null);
  const [isStorageReady, setIsStorageReady] = useState(false);

  const weekKey = getWeekKey(weekDate);
  const weekDays = useMemo(() => getWeekDays(weekDate), [weekDate]);
  const weekTitle = getWeekTitle(weekDays);
  const hiddenTaskIds = hiddenTaskIdsByWeek[weekKey] ?? [];
  const isMinWeek = weekDate <= minWeekDate;
  const visibleTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          isWeekTaskCreatedInWeek(task, weekKey) && !hiddenTaskIds.includes(task.id),
      ),
    [hiddenTaskIds, tasks, weekKey],
  );
  const taskPendingDelete = taskIdPendingDelete
    ? tasks.find((task) => task.id === taskIdPendingDelete)
    : null;

  const sortableTasks = useSortableList((sourceId, targetId) => {
    setTasks((currentTasks) => {
      const sourceIndex = currentTasks.findIndex((task) => task.id === sourceId);
      const targetIndex = currentTasks.findIndex((task) => task.id === targetId);

      if (sourceIndex < 0 || targetIndex < 0) return currentTasks;

      const nextTasks = [...currentTasks];
      const [movedTask] = nextTasks.splice(sourceIndex, 1);
      nextTasks.splice(targetIndex, 0, movedTask);
      return nextTasks;
    });
  });

  const completedMarks = visibleTasks.reduce(
    (sum, task) =>
      sum +
      weekDays.filter((_, dayIndex) =>
        marks.has(getMarkKey(weekKey, task.id, dayIndex)),
      ).length,
    0,
  );
  const totalMarks = visibleTasks.length * weekDays.length;
  const weekProgress = totalMarks ? Math.round((completedMarks / totalMarks) * 100) : 0;

  const taskProgressItems = useMemo(
    () =>
      visibleTasks.map((task) => {
        const done = weekDays.filter((_, dayIndex) =>
          marks.has(getMarkKey(weekKey, task.id, dayIndex)),
        ).length;

        return {
          id: task.id,
          title: task.title,
          progress: weekDays.length ? Math.round((done / weekDays.length) * 100) : 0,
        };
      }),
    [marks, visibleTasks, weekDays, weekKey],
  );

  useEffect(() => {
    let active = true;
    void loadPlannerDocument<Partial<StoredWeekPage>>("week")
      .then((storedData) => {
        if (!active || !storedData) return;
      const storedDate =
        typeof storedData.weekDate === "string"
          ? getDateFromKey(storedData.weekDate)
          : null;

      if (storedDate && !Number.isNaN(storedDate.getTime())) {
        setWeekDate(clampWeekDate(storedDate));
      }

      if (Array.isArray(storedData.tasks)) {
        const fallbackWeekKey =
          typeof storedData.weekDate === "string" ? storedData.weekDate : defaultWeekKey;

        setTasks(
          storedData.tasks
            .filter(
              (task): task is WeekTask =>
                typeof task?.id === "string" &&
                typeof task.title === "string" &&
                typeof task.completed === "boolean",
            )
            .map((task) => ({
              ...task,
              title: capitalizeFirstLetter(task.title),
              createdWeekKey:
                typeof task.createdWeekKey === "string"
                  ? task.createdWeekKey
                  : fallbackWeekKey,
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
        storedData.hiddenTaskIdsByWeek &&
        typeof storedData.hiddenTaskIdsByWeek === "object"
      ) {
        setHiddenTaskIdsByWeek(
          Object.fromEntries(
            Object.entries(storedData.hiddenTaskIdsByWeek).map(([key, value]) => [
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
      })
      .catch((error) => console.error("Failed to load week planner", error))
      .finally(() => {
        if (!active) return;
        hasLoadedStorage.current = true;
        setIsStorageReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage.current || !isStorageReady) {
      return;
    }

    const data: StoredWeekPage = {
      weekDate: getDateKey(weekDate),
      tasks,
      marks: Array.from(marks),
      hiddenTaskIdsByWeek,
      focus,
      notes,
    };

    const timeoutId = window.setTimeout(() => {
      void savePlannerDocument("week", data).catch((error) =>
        console.error("Failed to save week planner", error),
      );
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [focus, hiddenTaskIdsByWeek, isStorageReady, marks, notes, tasks, weekDate]);

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = capitalizeFirstLetter(newTaskTitle.trim());

    if (!title) {
      return;
    }

    const normalizedTitle = normalizeTitle(title);
    const existingTask = tasks.find(
      (task) =>
        normalizeTitle(task.title) === normalizedTitle &&
        isWeekTaskCreatedInWeek(task, weekKey),
    );

    if (existingTask) {
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === existingTask.id ? { ...task, title } : task,
        ),
      );
      setHiddenTaskIdsByWeek((currentHiddenTaskIdsByWeek) => ({
        ...currentHiddenTaskIdsByWeek,
        [weekKey]: (currentHiddenTaskIdsByWeek[weekKey] ?? []).filter(
          (taskId) => taskId !== existingTask.id,
        ),
      }));
      setNewTaskTitle("");
      return;
    }

    setTasks((currentTasks) => [
      ...currentTasks,
      {
        id: `week-task-${Date.now()}`,
        title,
        completed: false,
        createdWeekKey: weekKey,
      },
    ]);
    setNewTaskTitle("");
  }

  function hideTaskForWeek(taskId: string) {
    setHiddenTaskIdsByWeek((currentHiddenTaskIdsByWeek) => {
      const currentHiddenTaskIds = currentHiddenTaskIdsByWeek[weekKey] ?? [];

      if (currentHiddenTaskIds.includes(taskId)) {
        return currentHiddenTaskIdsByWeek;
      }

      return {
        ...currentHiddenTaskIdsByWeek,
        [weekKey]: [...currentHiddenTaskIds, taskId],
      };
    });
    setTaskIdPendingDelete(null);
  }

  function toggleDayMark(taskId: string, dayIndex: number) {
    const key = getMarkKey(weekKey, taskId, dayIndex);

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

  function moveWeek(direction: -1 | 1) {
    setWeekDate((currentDate) => {
      const nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + direction * 7);
      return clampWeekDate(nextDate);
    });
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
              Еженедельный план
            </div>
            <h1 className="text-3xl font-black uppercase leading-none text-emerald-950 sm:text-4xl">
              Неделя
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Добавляйте пункты, отмечайте дни и смотрите прогресс недели.
            </p>
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_250px]">
          <aside className="space-y-4">
            <section className="rounded-md border border-emerald-900/15 bg-white p-4 shadow-sm">
              <div className="mb-3">
                <p className="text-xs font-black uppercase text-emerald-900">
                  Пункты недели
                </p>
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
                    {...sortableTasks.getItemProps(task.id)}
                  >
                    <button
                      aria-label={`Изменить порядок пункта "${task.title}"`}
                      className="flex h-8 w-6 shrink-0 touch-none cursor-grab items-center justify-center text-slate-400 active:cursor-grabbing active:text-emerald-800"
                      title="Перетащите, чтобы изменить порядок"
                      type="button"
                      {...sortableTasks.getHandleProps(task.id)}
                    >
                      <GripVertical className="h-5 w-5" />
                    </button>
                    <span className="min-w-0 flex-1 px-1">{task.title}</span>
                    <button
                      aria-label={`Удалить пункт "${task.title}" только из недели ${weekTitle}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-900/10 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      onClick={() => setTaskIdPendingDelete(task.id)}
                      title="Удалить только из этой недели"
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {visibleTasks.length === 0 && (
                  <p className="rounded-md border border-dashed border-emerald-900/15 bg-[#f8faf5] px-3 py-3 text-sm font-medium text-slate-500">
                    В этой неделе нет пунктов.
                  </p>
                )}
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

          <section className="min-w-0 rounded-md border border-emerald-900/15 bg-white p-3 shadow-sm sm:p-4">
            <div className="mb-4 flex flex-col gap-3 border-b border-emerald-900/15 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <button
                  aria-label="Предыдущая неделя"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-900/20 bg-white text-emerald-900 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={isMinWeek}
                  onClick={() => moveWeek(-1)}
                  title="Предыдущая неделя"
                  type="button"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div>
                  <p className="text-xs font-black uppercase text-emerald-900">
                    Трекер по дням
                  </p>
                  <h2 className="text-xl font-black text-slate-900">{weekTitle}</h2>
                </div>
                <button
                  aria-label="Следующая неделя"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-900/20 bg-white text-emerald-900 transition hover:bg-emerald-50"
                  onClick={() => moveWeek(1)}
                  title="Следующая неделя"
                  type="button"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                <span className="h-3 w-3 rounded-full border-2 border-emerald-700 bg-emerald-700" />
                выполнено
                <span className="ml-2 h-3 w-3 rounded-full border-2 border-emerald-700 bg-white" />
                пусто
              </div>
            </div>

            <div className="overflow-x-auto pb-2">
              <div style={{ minWidth: 560 }}>
                <div
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: "minmax(170px, 220px) repeat(7, minmax(54px, 1fr))",
                  }}
                >
                  <div className="rounded-md bg-emerald-950 px-3 py-2 text-xs font-black uppercase text-white">
                    Действие
                  </div>
                  {weekDays.map((day, index) => (
                    <div
                      className="flex h-12 flex-col items-center justify-center rounded-md bg-emerald-950 text-white"
                      key={getDateKey(day)}
                      title={`${formatDay(day)} - ${weekDayLong[index]}`}
                    >
                      <span className="text-xs font-black uppercase leading-none text-emerald-100">
                        {weekDayShort[index]}
                      </span>
                      <span className="mt-1 text-xs font-black leading-none">
                        {day.getDate()}
                      </span>
                    </div>
                  ))}

                  {visibleTasks.map((task) => (
                    <div className="contents" key={task.id}>
                      <div className="flex min-h-12 items-center rounded-md bg-emerald-50 px-3 text-xs font-bold text-slate-700">
                        {task.title}
                      </div>
                      {weekDays.map((day, dayIndex) => {
                        const marked = marks.has(getMarkKey(weekKey, task.id, dayIndex));

                        return (
                          <button
                            aria-label={`${marked ? "Снять" : "Поставить"} отметку: ${task.title}, ${formatDay(day)}`}
                            className="flex min-h-12 items-center justify-center rounded-md bg-[#f8faf5] transition hover:bg-emerald-50"
                            key={`${task.id}-${getDateKey(day)}`}
                            onClick={() => toggleDayMark(task.id, dayIndex)}
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

          <aside className="space-y-4">
            <section className="rounded-md border border-emerald-900/15 bg-emerald-950 p-4 text-white shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-black uppercase">Прогресс</p>
                <TrendingUp className="h-5 w-5 text-lime-300" />
              </div>
              <p className="text-3xl font-black">
                {completedMarks} / {totalMarks}
              </p>
              <p className="mt-1 text-xs text-emerald-100">
                {weekProgress}% отметок закрыто за неделю
              </p>
            </section>

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
                    В этой неделе нет пунктов.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-md border border-emerald-900/15 bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase text-emerald-900">
                Заметки
              </p>
              <textarea
                className="mt-3 min-h-32 w-full resize-none rounded-md border border-emerald-900/20 bg-[#f8faf5] p-3 text-sm text-slate-700 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
                onChange={(event) => setNotes(event.target.value)}
                value={notes}
              />
            </section>
          </aside>
        </div>
      </div>

      {taskPendingDelete && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-sm rounded-md border border-emerald-900/15 bg-white p-5 text-slate-900 shadow-xl">
            <p className="text-sm font-black uppercase text-emerald-900">
              Подтвердить удаление
            </p>
            <p className="mt-3 text-sm font-medium text-slate-700">
              Удалить пункт “{taskPendingDelete.title}” только из недели{" "}
              {weekTitle}?
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
                onClick={() => hideTaskForWeek(taskPendingDelete.id)}
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
