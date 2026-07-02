import { addDays, dateKey, parseDateKey } from "./date";
import type { AppState, DayLevel, DayLog, DayMode, RoutineTask } from "../types";

const trainingTaskIds = new Set(["strength-training"]);
const recoveryTaskIds = new Set(["cardio-walk"]);
const movementTaskIds = new Set(["strength-training", "cardio-walk"]);

export function tasksForDate(
  tasks: RoutineTask[],
  date: Date,
  dayMode: DayMode = "auto",
  dayLevel: DayLevel = "p2"
): RoutineTask[] {
  const weekday = date.getDay();
  return tasks
    .filter((task) => {
      if (dayLevel === "p1" && !task.minimum) {
        return false;
      }

      if (dayMode === "training") {
        if (recoveryTaskIds.has(task.id)) {
          return false;
        }
        if (trainingTaskIds.has(task.id)) {
          return true;
        }
      }

      if (dayMode === "recovery") {
        if (trainingTaskIds.has(task.id)) {
          return false;
        }
        if (recoveryTaskIds.has(task.id)) {
          return true;
        }
      }

      return task.days.includes(weekday);
    })
    .sort((a, b) => a.start.localeCompare(b.start));
}

export function calculateScore(tasks: RoutineTask[], log: DayLog): number {
  const totalWeight = tasks.reduce((sum, task) => sum + task.weight, 0);
  if (totalWeight === 0) {
    return 0;
  }

  const completedWeight = tasks.reduce((sum, task) => {
    return log.completedTaskIds.includes(task.id) ? sum + task.weight : sum;
  }, 0);

  return Math.round((completedWeight / totalWeight) * 100);
}

export function criticalMisses(tasks: RoutineTask[], log: DayLog): number {
  return tasks.filter((task) => task.priority === "critical" && !log.completedTaskIds.includes(task.id)).length;
}

export function completionCount(tasks: RoutineTask[], log: DayLog): { completed: number; total: number } {
  return {
    completed: tasks.filter((task) => log.completedTaskIds.includes(task.id)).length,
    total: tasks.length
  };
}

/** Ruch zaliczony ręcznie albo przez ukończony blok treningowy. */
export function movementDone(log: DayLog): boolean {
  return log.nonNegotiables.movement || log.completedTaskIds.some((id) => movementTaskIds.has(id));
}

/**
 * Dzień "nie-zero": cokolwiek zostało zrobione.
 * To jedyny warunek streaka — reguła "nigdy dwa zera z rzędu".
 */
export function isNonZeroDay(log: DayLog | undefined): boolean {
  if (!log) {
    return false;
  }
  const nn = log.nonNegotiables;
  return log.completedTaskIds.length > 0 || nn.job || nn.project || nn.movement;
}

/**
 * Dzień "zaliczony": ≥1 działanie w stronę pieniędzy (praca LUB projekt) + ruch.
 * To jest odpowiednik "Money action = Y i MIT = Y" z protokołu.
 */
export function isDayWon(log: DayLog): boolean {
  const nn = log.nonNegotiables;
  return (nn.job || nn.project) && movementDone(log);
}

export type DayStatus = "zero" | "nonzero" | "won";

export function dayStatus(log: DayLog | undefined): DayStatus {
  if (!log || !isNonZeroDay(log)) {
    return "zero";
  }
  return isDayWon(log) ? "won" : "nonzero";
}

/**
 * Streak dni nie-zerowych. Jeśli dziś jeszcze pusto, liczymy od wczoraj —
 * dzisiejszy brak wpisu nie zeruje passy w trakcie dnia.
 */
export function calculateStreak(state: AppState, anchorDate: Date): number {
  let streak = 0;
  let offset = 0;

  const anchorLog = state.logs[dateKey(anchorDate)];
  if (!isNonZeroDay(anchorLog)) {
    offset = 1;
  }

  for (; offset < 366; offset += 1) {
    const key = dateKey(addDays(anchorDate, -offset));
    if (!isNonZeroDay(state.logs[key])) {
      break;
    }
    streak += 1;
  }

  return streak;
}

/** Liczba dni "zaliczonych" w ostatnich `days` dniach (wliczając anchor). */
export function wonDaysCount(state: AppState, anchorDate: Date, days: number): number {
  let count = 0;
  for (let offset = 0; offset < days; offset += 1) {
    const log = state.logs[dateKey(addDays(anchorDate, -offset))];
    if (log && isDayWon(log)) {
      count += 1;
    }
  }
  return count;
}

export function weeklyScores(state: AppState, anchorDate: Date): Array<{ date: string; score: number; status: DayStatus }> {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(anchorDate, index - 6);
    const key = dateKey(date);
    const log = state.logs[key];
    return {
      date: key,
      score: log ? calculateScore(tasksForDate(state.tasks, date, log.dayMode, log.dayLevel), log) : 0,
      status: dayStatus(log)
    };
  });
}

/** Klucz tygodnia ISO (poniedziałek jako start) — do przeglądów tygodniowych. */
export function weekKey(date: Date): string {
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = addDays(date, diffToMonday);
  return dateKey(monday);
}

export function parseWeekKey(key: string): Date {
  return parseDateKey(key);
}
