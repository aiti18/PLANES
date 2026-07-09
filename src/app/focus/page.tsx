"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  Clock3,
  Maximize2,
  Pause,
  Play,
  Target,
  X,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { capitalizeFirstLetter, cn } from "@/lib/utils";

const storageKey = "planes:focus-page:v1";
const maxHistoryItems = 20;
const maxDurationHours = 24;
const maxDurationMinutes = maxDurationHours * 60;

type FocusStatus = "idle" | "paused" | "running" | "finished";

type FocusSession = {
  completedAt: string;
  durationSeconds: number;
  id: string;
  title: string;
};

type FocusState = {
  customMinutes: number;
  durationMinutes: number;
  focusText: string;
  lastTickAt: number | null;
  remainingSeconds: number;
  sessions: FocusSession[];
  status: FocusStatus;
};

const initialState: FocusState = {
  customMinutes: 30,
  durationMinutes: 30,
  focusText: "",
  lastTickAt: null,
  remainingSeconds: 30 * 60,
  sessions: [],
  status: "idle",
};

function clampMinutes(minutes: number) {
  if (!Number.isFinite(minutes)) {
    return 30;
  }

  return Math.min(maxDurationMinutes, Math.max(1, Math.round(minutes)));
}

function getDurationSeconds(minutes: number) {
  return clampMinutes(minutes) * 60;
}

function formatTimer(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const nextSeconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      nextSeconds,
    ).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(nextSeconds).padStart(
    2,
    "0",
  )}`;
}

function formatMinutes(seconds: number) {
  return Math.round(seconds / 60).toLocaleString("ru-RU");
}

function pluralizeRu(value: number, forms: [string, string, string]) {
  const absValue = Math.abs(value) % 100;
  const lastDigit = absValue % 10;

  if (absValue > 10 && absValue < 20) {
    return forms[2];
  }

  if (lastDigit === 1) {
    return forms[0];
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return forms[1];
  }

  return forms[2];
}

function formatDurationChoice(minutes: number) {
  const safeMinutes = clampMinutes(minutes);
  const hours = Math.floor(safeMinutes / 60);
  const restMinutes = safeMinutes % 60;

  if (hours === 0) {
    return `${safeMinutes} ${pluralizeRu(safeMinutes, [
      "минута",
      "минуты",
      "минут",
    ])}`;
  }

  const hourLabel = `${hours} ${pluralizeRu(hours, [
    "час",
    "часа",
    "часов",
  ])}`;

  if (restMinutes === 0) {
    return hourLabel;
  }

  return `${hourLabel} ${restMinutes} ${pluralizeRu(restMinutes, [
    "минута",
    "минуты",
    "минут",
  ])}`;
}

function normalizeState(value: unknown): FocusState {
  if (!value || typeof value !== "object") {
    return initialState;
  }

  const storedState = value as Partial<FocusState>;
  const durationMinutes = clampMinutes(
    Number(storedState.durationMinutes ?? initialState.durationMinutes),
  );
  const durationSeconds = getDurationSeconds(durationMinutes);
  const remainingSeconds =
    typeof storedState.remainingSeconds === "number"
      ? Math.min(durationSeconds, Math.max(0, Math.round(storedState.remainingSeconds)))
      : durationSeconds;
  const status: FocusStatus = ["idle", "paused", "running", "finished"].includes(
    String(storedState.status),
  )
    ? (storedState.status as FocusStatus)
    : "idle";
  const sessions = Array.isArray(storedState.sessions)
    ? storedState.sessions
        .filter(
          (session): session is FocusSession =>
            Boolean(session) &&
            typeof session.id === "string" &&
            typeof session.title === "string" &&
            typeof session.completedAt === "string" &&
            typeof session.durationSeconds === "number",
        )
        .slice(0, maxHistoryItems)
    : [];

  return {
    customMinutes: clampMinutes(
      Number(storedState.customMinutes ?? initialState.customMinutes),
    ),
    durationMinutes,
    focusText:
      typeof storedState.focusText === "string" ? storedState.focusText : "",
    lastTickAt:
      typeof storedState.lastTickAt === "number" ? storedState.lastTickAt : null,
    remainingSeconds,
    sessions,
    status,
  };
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function AnalogTimer({
  progress,
  remainingSeconds,
}: {
  progress: number;
  remainingSeconds: number;
}) {
  const dots = Array.from({ length: 12 }, (_, index) => index);
  const angle = progress * 360 - 90;

  return (
    <div className="relative mx-auto h-56 w-56 rounded-full bg-emerald-950 shadow-inner shadow-emerald-950/40">
      {dots.map((dot) => {
        const dotAngle = (dot / dots.length) * Math.PI * 2;
        const radius = 82;
        const x = Math.cos(dotAngle - Math.PI / 2) * radius;
        const y = Math.sin(dotAngle - Math.PI / 2) * radius;

        return (
          <span
            className={cn(
              "absolute left-1/2 top-1/2 h-3 w-3 rounded-full bg-white/45",
              dot % 3 === 0 && "h-4 w-4 bg-white/65",
            )}
            key={dot}
            style={{
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
            }}
          />
        );
      })}

      <span className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
      <span
        className="absolute left-1/2 top-1/2 h-0.5 w-20 origin-left bg-lime-100 shadow-sm shadow-lime-100/70"
        style={{ transform: `rotate(${angle}deg)` }}
      />
      <div className="absolute inset-x-0 bottom-9 text-center font-mono text-sm font-black text-white/75">
        {formatTimer(remainingSeconds)}
      </div>
    </div>
  );
}

export default function FocusPage() {
  const [durationInput, setDurationInput] = useState("");
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [isTimerFullscreen, setIsTimerFullscreen] = useState(false);
  const [state, setState] = useState<FocusState>(initialState);

  const durationSeconds = getDurationSeconds(state.durationMinutes);
  const progress =
    durationSeconds === 0
      ? 0
      : (durationSeconds - state.remainingSeconds) / durationSeconds;
  const isRunning = state.status === "running";
  const completedToday = useMemo(() => {
    const todayKey = getTodayKey();

    return state.sessions.filter((session) =>
      session.completedAt.startsWith(todayKey),
    );
  }, [state.sessions]);
  const totalTodaySeconds = completedToday.reduce(
    (sum, session) => sum + session.durationSeconds,
    0,
  );

  useEffect(() => {
    const storedValue = window.localStorage.getItem(storageKey);

    if (storedValue) {
      try {
        const restoredState = normalizeState(JSON.parse(storedValue));

        if (
          restoredState.status === "idle" &&
          restoredState.customMinutes === 1 &&
          restoredState.durationMinutes === 1 &&
          restoredState.remainingSeconds === 60
        ) {
          restoredState.customMinutes = initialState.customMinutes;
          restoredState.durationMinutes = initialState.durationMinutes;
          restoredState.remainingSeconds = initialState.remainingSeconds;
        }

        if (restoredState.status === "running" && restoredState.lastTickAt) {
          const elapsedSeconds = Math.floor(
            (Date.now() - restoredState.lastTickAt) / 1000,
          );
          restoredState.remainingSeconds = Math.max(
            0,
            restoredState.remainingSeconds - elapsedSeconds,
          );
          restoredState.lastTickAt = Date.now();

          if (restoredState.remainingSeconds === 0) {
            restoredState.status = "finished";
          }
        }

        setState(restoredState);
        setDurationInput("");
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }

    setHasLoadedStorage(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [hasLoadedStorage, state]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const timerId = window.setInterval(() => {
      setState((currentState) => {
        if (currentState.status !== "running") {
          return currentState;
        }

        const nextRemainingSeconds = Math.max(
          0,
          currentState.remainingSeconds - 1,
        );

        if (nextRemainingSeconds === 0) {
          return finishSession({
            ...currentState,
            remainingSeconds: nextRemainingSeconds,
          });
        }

        return {
          ...currentState,
          lastTickAt: Date.now(),
          remainingSeconds: nextRemainingSeconds,
        };
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [isRunning]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsTimerFullscreen(false);
      }
    }

    if (!isTimerFullscreen) {
      return;
    }

    const htmlElement = document.documentElement;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyBackground = document.body.style.background;
    const previousHtmlOverflow = htmlElement.style.overflow;
    const previousHtmlBackground = htmlElement.style.background;

    htmlElement.style.overflow = "hidden";
    htmlElement.style.background = "#123c33";
    document.body.style.overflow = "hidden";
    document.body.style.background = "#123c33";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      htmlElement.style.overflow = previousHtmlOverflow;
      htmlElement.style.background = previousHtmlBackground;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.background = previousBodyBackground;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isTimerFullscreen]);

  function getDurationInputAmount(unit: "hours" | "minutes") {
    const parsedValue = Number(durationInput);
    const maxAmount = unit === "hours" ? maxDurationHours : maxDurationMinutes;

    if (!durationInput.trim() || !Number.isFinite(parsedValue)) {
      return null;
    }

    return Math.min(maxAmount, Math.max(1, Math.round(parsedValue)));
  }

  function getDurationInputMinutes(unit: "hours" | "minutes") {
    const customAmount = getDurationInputAmount(unit);

    if (customAmount === null) {
      return null;
    }

    return unit === "hours" ? customAmount * 60 : customAmount;
  }

  function updateDurationFromCustom(unit: "hours" | "minutes") {
    const customAmount = getDurationInputAmount(unit);
    const nextMinutes = getDurationInputMinutes(unit);

    if (customAmount === null || nextMinutes === null) {
      return;
    }

    setDurationInput(String(customAmount));

    setState((currentState) => ({
      ...currentState,
      customMinutes: customAmount,
      durationMinutes: nextMinutes,
      remainingSeconds:
        currentState.status === "idle" || currentState.status === "finished"
          ? getDurationSeconds(nextMinutes)
          : currentState.remainingSeconds,
      status: currentState.status === "finished" ? "idle" : currentState.status,
    }));
  }

  function finishSession(currentState: FocusState): FocusState {
    const title =
      capitalizeFirstLetter(currentState.focusText.trim()) || "Фокус-сессия";
    const duration = getDurationSeconds(currentState.durationMinutes);
    const elapsedSeconds = Math.max(
      0,
      Math.min(duration, duration - currentState.remainingSeconds),
    );
    const session: FocusSession = {
      completedAt: new Date().toISOString(),
      durationSeconds: elapsedSeconds,
      id: crypto.randomUUID(),
      title,
    };

    return {
      ...currentState,
      lastTickAt: null,
      remainingSeconds: 0,
      sessions: [session, ...currentState.sessions].slice(0, maxHistoryItems),
      status: "finished",
    };
  }

  function startSession() {
    setState((currentState) => ({
      ...currentState,
      lastTickAt: Date.now(),
      remainingSeconds:
        currentState.remainingSeconds > 0
          ? currentState.remainingSeconds
          : getDurationSeconds(currentState.durationMinutes),
      status: "running",
    }));
  }

  function pauseSession() {
    setState((currentState) => ({
      ...currentState,
      lastTickAt: null,
      status: "paused",
    }));
  }

  function completeNow() {
    setState((currentState) => finishSession(currentState));
  }

  const hasDurationInput = durationInput.trim().length > 0;
  const customMinutesDuration = hasDurationInput
    ? getDurationInputMinutes("minutes")
    : null;
  const customHoursDuration = hasDurationInput
    ? getDurationInputMinutes("hours")
    : null;

  const timerFullscreenLayer =
    typeof document !== "undefined" && isTimerFullscreen
      ? createPortal(
          <div className="fixed inset-0 z-[9999] flex h-[100dvh] w-screen flex-col items-center justify-center overflow-hidden bg-[#123c33] px-5 text-white">
            <button
              aria-label="Закрыть полноэкранный таймер"
              className="fixed right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
              onClick={() => setIsTimerFullscreen(false)}
              title="Закрыть"
              type="button"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="w-full max-w-5xl text-center">
              <p className="font-mono text-[clamp(4.5rem,19vw,13rem)] font-black leading-none text-lime-200 [text-shadow:0_0_32px_rgba(190,242,100,0.75)]">
                {formatTimer(state.remainingSeconds)}
              </p>
              <p className="mt-6 text-sm font-black uppercase tracking-[0.28em] text-emerald-50/80 sm:text-base">
                {state.status === "running"
                  ? "Фокус активен"
                  : state.status === "paused"
                    ? "Пауза"
                    : state.status === "finished"
                      ? "Готово"
                      : "Готов к старту"}
              </p>
              <p className="mx-auto mt-8 max-w-3xl break-words text-xl font-black leading-8 text-white/90 sm:text-3xl sm:leading-10">
                {state.focusText.trim() || "Фокус-сессия"}
              </p>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <AppLayout>
      <div className="mx-auto w-full max-w-[1400px] space-y-5">
        <header className="rounded-md border border-emerald-900/15 bg-white p-5 shadow-sm shadow-emerald-950/5 sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-emerald-800">
                <Target className="h-4 w-4" />
                Режим концентрации
              </div>
              <h1 className="text-3xl font-black leading-tight text-emerald-950 sm:text-4xl">
                Концентрация
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Выберите время, напишите одну конкретную задачу и держите фокус
                до конца сессии.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex">
              <div className="rounded-md border border-emerald-900/10 bg-[#f8faf5] px-4 py-3">
                <p className="text-xs font-black uppercase text-slate-500">
                  Сегодня
                </p>
                <p className="mt-1 text-xl font-black text-emerald-950">
                  {formatMinutes(totalTodaySeconds)} мин
                </p>
              </div>
              <div className="rounded-md border border-emerald-900/10 bg-[#f8faf5] px-4 py-3">
                <p className="text-xs font-black uppercase text-slate-500">
                  Сессии
                </p>
                <p className="mt-1 text-xl font-black text-emerald-950">
                  {completedToday.length}
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(360px,0.72fr)]">
          <Card className="overflow-hidden border-emerald-900/15 bg-white shadow-sm shadow-emerald-950/5">
            <CardContent className="grid gap-5 p-5 sm:p-6">
              <div className="rounded-md border border-emerald-900/10 bg-[#f8faf5] p-4">
                <label
                  className="text-sm font-black text-emerald-950"
                  htmlFor="focus-task"
                >
                  В чем сконцентрироваться?
                </label>
                <textarea
                  className="mt-3 min-h-28 w-full resize-none rounded-md border border-emerald-900/15 bg-white px-3 py-3 text-sm font-semibold text-emerald-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/15"
                  id="focus-task"
                  onChange={(event) =>
                    setState((currentState) => ({
                      ...currentState,
                      focusText: event.target.value,
                    }))
                  }
                  placeholder="Например: 30 минут разобрать расходы за месяц"
                  value={state.focusText}
                />
              </div>

              <div className="rounded-md border border-emerald-900/10 bg-[#f8faf5] p-4">
                <div className="flex items-center gap-2 text-sm font-black text-emerald-950">
                  <Clock3 className="h-4 w-4" />
                  Длительность
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_140px_140px]">
                  <input
                    aria-label="Число для длительности"
                    className="col-span-2 h-11 min-w-0 rounded-md border border-emerald-900/15 bg-white px-3 text-center text-base font-black text-emerald-950 outline-none focus:border-emerald-800 sm:col-span-1"
                    inputMode="numeric"
                    max={maxDurationMinutes}
                    min={1}
                    onChange={(event) => {
                      const nextValue = event.target.value.replace(/\D/g, "");

                      setDurationInput(nextValue);

                      if (!nextValue) {
                        return;
                      }

                      setState((currentState) => ({
                        ...currentState,
                        customMinutes: clampMinutes(Number(nextValue)),
                      }));
                    }}
                    pattern="[0-9]*"
                    type="number"
                    value={durationInput}
                  />
                  <button
                    className={cn(
                      "h-11 rounded-md border px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50",
                      state.durationMinutes === customMinutesDuration
                        ? "border-emerald-900 bg-emerald-900 text-white"
                        : "border-emerald-900/15 bg-white text-emerald-950 hover:bg-emerald-50",
                    )}
                    disabled={!hasDurationInput}
                    onClick={() => updateDurationFromCustom("minutes")}
                    type="button"
                  >
                    Минуты
                  </button>
                  <button
                    className={cn(
                      "h-11 rounded-md border px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50",
                      state.durationMinutes === customHoursDuration
                        ? "border-emerald-900 bg-emerald-900 text-white"
                        : "border-emerald-900/15 bg-white text-emerald-950 hover:bg-emerald-50",
                    )}
                    disabled={!hasDurationInput}
                    onClick={() => updateDurationFromCustom("hours")}
                    type="button"
                  >
                    Часы
                  </button>
                </div>

                <p className="mt-3 rounded-md bg-white px-3 py-2 text-sm font-black text-emerald-950">
                  Выбрано: {formatDurationChoice(state.durationMinutes)}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  className="h-12 rounded-md bg-emerald-900 font-black text-white hover:bg-emerald-800"
                  disabled={isRunning}
                  onClick={startSession}
                >
                  <Play className="h-4 w-4" />
                  Старт
                </Button>
                <Button
                  className="h-12 rounded-md border-emerald-900/20 font-black text-emerald-950 hover:bg-emerald-50"
                  disabled={!isRunning}
                  onClick={pauseSession}
                  variant="outline"
                >
                  <Pause className="h-4 w-4" />
                  Пауза
                </Button>
              </div>

              {state.status === "finished" && (
                <div className="rounded-md border border-emerald-900/10 bg-emerald-50 p-4 text-sm font-black text-emerald-900">
                  Сессия завершена. Можно выбрать следующую задачу или запустить
                  ещё один круг.
                </div>
              )}
            </CardContent>
          </Card>

	          <Card className="overflow-hidden border-0 bg-[#123c33] text-white shadow-sm shadow-emerald-950/10">
	            <CardContent className="grid gap-6 p-5 sm:p-7">
	              <div className="relative rounded-md border border-emerald-50/15 bg-emerald-950/30 p-5 text-center">
	                <p className="font-mono text-6xl font-black leading-none text-lime-200 [text-shadow:0_0_18px_rgba(190,242,100,0.75)] sm:text-7xl">
	                  {formatTimer(state.remainingSeconds)}
	                </p>
	                <div className="mt-3 flex items-center justify-center gap-3">
	                  <p className="text-xs font-black uppercase tracking-wide text-emerald-50/80">
	                    {state.status === "running"
	                      ? "Фокус активен"
	                      : state.status === "paused"
	                        ? "Пауза"
	                        : state.status === "finished"
	                          ? "Готово"
	                          : "Готов к старту"}
	                  </p>
	                  <button
	                    aria-label="Открыть таймер на весь экран"
	                    className="flex h-8 w-16 items-center justify-center rounded-full border-4 border-lime-200 text-lime-100 shadow-[0_0_14px_rgba(190,242,100,0.75)] transition hover:bg-lime-200/10 sm:absolute sm:right-4 sm:top-1/2 sm:-translate-y-1/2"
	                    onClick={() => setIsTimerFullscreen(true)}
	                    title="Во весь экран"
	                    type="button"
	                  >
	                    <Maximize2 className="h-4 w-4" />
	                  </button>
	                </div>
	              </div>

              <AnalogTimer
                progress={Math.max(0, Math.min(1, progress))}
                remainingSeconds={state.remainingSeconds}
              />

              <div className="rounded-md border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-black uppercase text-white/50">
                  Текущий фокус
                </p>
                <p className="mt-2 break-words text-lg font-black">
                  {state.focusText.trim() || "Фокус-сессия"}
                </p>
                <button
                  className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/15 px-4 text-sm font-black text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={
                    state.status === "idle" ||
                    state.status === "finished"
                  }
                  onClick={completeNow}
                  type="button"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Завершить сейчас
                </button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="overflow-hidden border-emerald-900/15 bg-white shadow-sm shadow-emerald-950/5">
            <CardContent className="p-0">
              <div className="border-b border-emerald-900/10 p-5">
                <h2 className="text-xl font-black text-emerald-950">
                  Последние фокус-сессии
                </h2>
              </div>
              <div className="divide-y divide-emerald-900/10">
                {state.sessions.length === 0 ? (
                  <div className="p-5 text-sm font-semibold text-slate-500">
                    Завершённые сессии появятся здесь.
                  </div>
                ) : (
                  state.sessions.slice(0, 8).map((session) => (
                    <div
                      className="grid gap-2 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                      key={session.id}
                    >
                      <div className="min-w-0">
                        <p className="break-words font-black text-emerald-950">
                          {session.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {new Intl.DateTimeFormat("ru-RU", {
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            month: "short",
                          }).format(new Date(session.completedAt))}
                        </p>
                      </div>
                      <span className="w-fit rounded-md bg-emerald-50 px-3 py-1.5 text-sm font-black text-emerald-800">
                        {formatMinutes(session.durationSeconds)} мин
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-900/15 bg-white shadow-sm shadow-emerald-950/5">
            <CardContent className="p-5">
              <h2 className="text-lg font-black text-emerald-950">
                Правило одной задачи
              </h2>
              <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-slate-600">
                <p>1. Напишите только один фокус.</p>
                <p>2. Поставьте время, например 30 минут.</p>
                <p>3. Не меняйте задачу до конца таймера.</p>
                <p>4. После завершения выберите следующий фокус.</p>
              </div>
            </CardContent>
          </Card>
        </section>
        </div>
      </AppLayout>
      {timerFullscreenLayer}
    </>
  );
}
