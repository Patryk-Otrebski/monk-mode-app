export type TaskCategory =
  | "morning"
  | "deepWork"
  | "jobSearch"
  | "project"
  | "training"
  | "home"
  | "admin"
  | "evening"
  | "health";

export type TaskPriority = "critical" | "standard" | "optional";

export type DayMode = "auto" | "training" | "recovery";

export type DayLevel = "p1" | "p2" | "p3";

export type RoutineTask = {
  id: string;
  title: string;
  category: TaskCategory;
  start: string;
  end?: string;
  durationMinutes: number;
  days: number[];
  priority: TaskPriority;
  weight: number;
  instructions: string;
  rationale: string;
  checklist?: string[];
  /** Wersja minimum na dzień P1. Zadania bez tego pola znikają w trybie P1. */
  minimum?: string;
  isDefault?: boolean;
};

export type DayMetrics = {
  sleepHours: number;
  alcoholUnits: number;
  focus: number;
  energy: number;
  mood: number;
};

/** Wielka Trójka — działania, które decydują czy dzień się liczy. */
export type NonNegotiables = {
  /** ≥1 działanie w stronę zatrudnienia: aplikacja / kontakt / rozmowa / follow-up. */
  job: boolean;
  /** ≥1 działanie na własny projekt, którego efekt widzi świat (artefakt). */
  project: boolean;
  /** ≥10 min ruchu. */
  movement: boolean;
};

export type DayLog = {
  date: string;
  completedTaskIds: string[];
  skippedTaskIds: string[];
  dayMode?: DayMode;
  dayLevel?: DayLevel;
  nonNegotiables: NonNegotiables;
  notes: string;
  metrics: DayMetrics;
};

export type WeeklyReview = {
  /** Co realnie ruszyło do przodu (praca/projekt)? */
  wins: string;
  /** Najwęższe gardło / największe tarcie tygodnia. */
  bottleneck: string;
  /** Jeden eksperyment na przyszły tydzień. */
  experiment: string;
};

export type AppSettings = {
  wakeTime: string;
  bedTime: string;
  caffeineCutoff: string;
  scoreTarget: number;
};

export type AppState = {
  version: number;
  tasks: RoutineTask[];
  logs: Record<string, DayLog>;
  weeklyReviews: Record<string, WeeklyReview>;
  settings: AppSettings;
};

export type TimerPreset = {
  id: string;
  label: string;
  minutes: number;
};
