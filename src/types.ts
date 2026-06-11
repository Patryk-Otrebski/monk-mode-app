export type TaskCategory =
  | "morning"
  | "deepWork"
  | "work"
  | "training"
  | "home"
  | "admin"
  | "evening"
  | "health";

export type TaskPriority = "critical" | "standard" | "optional";

export type DayMode = "auto" | "training" | "recovery";

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
  isDefault?: boolean;
};

export type DayMetrics = {
  sleepHours: number;
  alcoholUnits: number;
  focus: number;
  energy: number;
  mood: number;
};

export type DayLog = {
  date: string;
  completedTaskIds: string[];
  skippedTaskIds: string[];
  dayMode?: DayMode;
  notes: string;
  metrics: DayMetrics;
};

export type AppSettings = {
  wakeTime: string;
  workStart: string;
  workEnd: string;
  bedTime: string;
  caffeineCutoff: string;
  scoreTarget: number;
};

export type AppState = {
  version: number;
  tasks: RoutineTask[];
  logs: Record<string, DayLog>;
  settings: AppSettings;
};

export type TimerPreset = {
  id: string;
  label: string;
  minutes: number;
};
