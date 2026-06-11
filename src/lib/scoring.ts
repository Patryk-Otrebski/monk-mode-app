import { addDays, dateKey, parseDateKey } from "./date";
import type { AppState, DayLog, DayMode, RoutineTask } from "../types";

const trainingTaskIds = new Set(["reset-strength", "dinner-admin-training", "training-study-lite"]);
const recoveryTaskIds = new Set(["reset-recovery", "dinner-admin-regular", "study-evening"]);

export function tasksForDate(tasks: RoutineTask[], date: Date, dayMode: DayMode = "auto"): RoutineTask[] {
  const weekday = date.getDay();
  return tasks
    .filter((task) => {
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

export function calculateStreak(state: AppState, anchorDate: Date): number {
  let streak = 0;

  for (let offset = 0; offset < 366; offset += 1) {
    const date = addDays(anchorDate, -offset);
    const key = dateKey(date);
    const log = state.logs[key];
    if (!log) {
      break;
    }

    const score = calculateScore(tasksForDate(state.tasks, parseDateKey(key), log.dayMode), log);
    if (score < state.settings.scoreTarget) {
      break;
    }

    streak += 1;
  }

  return streak;
}

export function weeklyScores(state: AppState, anchorDate: Date): Array<{ date: string; score: number }> {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(anchorDate, index - 6);
    const key = dateKey(date);
    const log = state.logs[key];
    return {
      date: key,
      score: log ? calculateScore(tasksForDate(state.tasks, date, log.dayMode), log) : 0
    };
  });
}
