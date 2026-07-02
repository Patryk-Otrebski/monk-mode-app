import { defaultSettings, defaultTasks } from "../data/defaultPlan";
import type { AppState, DayLog, DayMetrics, NonNegotiables } from "../types";

const STORAGE_KEY = "monk-mode-state-v1";
const CURRENT_VERSION = 9;

const defaultMetrics: DayMetrics = {
  sleepHours: 7.5,
  alcoholUnits: 0,
  focus: 3,
  energy: 3,
  mood: 3
};

const defaultNonNegotiables: NonNegotiables = {
  job: false,
  project: false,
  movement: false
};

export function createEmptyLog(date: string): DayLog {
  return {
    date,
    completedTaskIds: [],
    skippedTaskIds: [],
    dayMode: "auto",
    dayLevel: "p2",
    nonNegotiables: { ...defaultNonNegotiables },
    notes: "",
    metrics: { ...defaultMetrics }
  };
}

export function createDefaultState(): AppState {
  return {
    version: CURRENT_VERSION,
    tasks: defaultTasks,
    logs: {},
    weeklyReviews: {},
    settings: defaultSettings
  };
}

function reconcileDefaultTasks(savedTasks: AppState["tasks"]): AppState["tasks"] {
  const defaultIds = new Set(defaultTasks.map((task) => task.id));
  const customTasks = savedTasks.filter((task) => !task.isDefault && !defaultIds.has(task.id));
  return [...defaultTasks, ...customTasks];
}

function normalizeLogs(logs: unknown): Record<string, DayLog> {
  if (!logs || typeof logs !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(logs as Record<string, Partial<DayLog>>).map(([key, log]) => [
      key,
      {
        ...createEmptyLog(key),
        ...log,
        completedTaskIds: Array.isArray(log.completedTaskIds) ? log.completedTaskIds : [],
        skippedTaskIds: Array.isArray(log.skippedTaskIds) ? log.skippedTaskIds : [],
        nonNegotiables: { ...defaultNonNegotiables, ...log.nonNegotiables },
        metrics: { ...defaultMetrics, ...log.metrics }
      }
    ])
  );
}

function normalizeSettings(settings: unknown): AppState["settings"] {
  const candidate = (settings && typeof settings === "object" ? settings : {}) as Partial<AppState["settings"]>;
  return {
    wakeTime: typeof candidate.wakeTime === "string" ? candidate.wakeTime : defaultSettings.wakeTime,
    bedTime: typeof candidate.bedTime === "string" ? candidate.bedTime : defaultSettings.bedTime,
    caffeineCutoff: typeof candidate.caffeineCutoff === "string" ? candidate.caffeineCutoff : defaultSettings.caffeineCutoff,
    scoreTarget: typeof candidate.scoreTarget === "number" ? candidate.scoreTarget : defaultSettings.scoreTarget
  };
}

export function loadState(): AppState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createDefaultState();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const parsedVersion = typeof parsed.version === "number" ? parsed.version : 0;
    const parsedTasks = Array.isArray(parsed.tasks) ? parsed.tasks : defaultTasks;

    return {
      version: CURRENT_VERSION,
      tasks: parsedVersion < CURRENT_VERSION ? reconcileDefaultTasks(parsedTasks) : parsedTasks,
      logs: normalizeLogs(parsed.logs),
      weeklyReviews: parsed.weeklyReviews && typeof parsed.weeklyReviews === "object" ? parsed.weeklyReviews : {},
      settings:
        parsedVersion < CURRENT_VERSION ? defaultSettings : normalizeSettings(parsed.settings)
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
    logs: normalizeLogs(candidate.logs),
    weeklyReviews: candidate.weeklyReviews && typeof candidate.weeklyReviews === "object" ? candidate.weeklyReviews : {},
    settings: parsedVersion < CURRENT_VERSION ? defaultSettings : normalizeSettings(candidate.settings)
  };
}
