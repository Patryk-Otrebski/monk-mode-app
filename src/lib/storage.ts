import { defaultSettings, defaultTasks } from "../data/defaultPlan";
import type { AppState, DayLog, DayMetrics } from "../types";

const STORAGE_KEY = "monk-mode-state-v1";
const CURRENT_VERSION = 7;

const defaultMetrics: DayMetrics = {
  sleepHours: 7.5,
  alcoholUnits: 0,
  focus: 3,
  energy: 3,
  mood: 3
};

export function createEmptyLog(date: string): DayLog {
  return {
    date,
    completedTaskIds: [],
    skippedTaskIds: [],
    dayMode: "auto",
    notes: "",
    metrics: { ...defaultMetrics }
  };
}

export function createDefaultState(): AppState {
  return {
    version: CURRENT_VERSION,
    tasks: defaultTasks,
    logs: {},
    settings: defaultSettings
  };
}

function reconcileDefaultTasks(savedTasks: AppState["tasks"]): AppState["tasks"] {
  const defaultIds = new Set(defaultTasks.map((task) => task.id));
  const customTasks = savedTasks.filter((task) => !task.isDefault && !defaultIds.has(task.id));
  return [...defaultTasks, ...customTasks];
}

export function loadState(): AppState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createDefaultState();
  }

  try {
    const parsed = JSON.parse(raw) as AppState;
    const parsedVersion = typeof parsed.version === "number" ? parsed.version : 0;
    const parsedTasks = Array.isArray(parsed.tasks) ? parsed.tasks : defaultTasks;

    return {
      ...createDefaultState(),
      ...parsed,
      version: CURRENT_VERSION,
      tasks: parsedVersion < CURRENT_VERSION ? reconcileDefaultTasks(parsedTasks) : parsedTasks,
      logs: parsed.logs && typeof parsed.logs === "object" ? parsed.logs : {},
      settings:
        parsedVersion < CURRENT_VERSION
          ? { ...defaultSettings, ...parsed.settings, wakeTime: defaultSettings.wakeTime, bedTime: defaultSettings.bedTime }
          : { ...defaultSettings, ...parsed.settings }
    };
  } catch {
    return createDefaultState();
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function normalizeImportedState(value: unknown): AppState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<AppState>;
  if (!Array.isArray(candidate.tasks)) {
    return null;
  }
  const parsedVersion = typeof candidate.version === "number" ? candidate.version : 0;

  return {
    version: CURRENT_VERSION,
    tasks: parsedVersion < CURRENT_VERSION ? reconcileDefaultTasks(candidate.tasks) : candidate.tasks,
    logs: candidate.logs && typeof candidate.logs === "object" ? candidate.logs : {},
    settings: { ...defaultSettings, ...candidate.settings, wakeTime: defaultSettings.wakeTime, bedTime: defaultSettings.bedTime }
  };
}
