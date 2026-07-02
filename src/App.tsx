import {
  Activity,
  BarChart3,
  Bed,
  BookOpen,
  Brain,
  Briefcase,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Coffee,
  Download,
  Dumbbell,
  Edit3,
  Flame,
  Footprints,
  Home,
  LayoutDashboard,
  ListChecks,
  Moon,
  Pause,
  Play,
  Plus,
  RefreshCcw,
  Rocket,
  Save,
  Settings,
  Shield,
  ShieldCheck,
  Sun,
  Target,
  Trash2,
  TriangleAlert,
  Trophy,
  Upload,
  X,
  Zap
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { defaultSettings, defaultTasks, timerPresets } from "./data/defaultPlan";
import { guideSections } from "./data/guide";
import { addDays, currentTimeLabel, dateKey, formatLongDate, formatShortDate, minutesFromTime, parseDateKey } from "./lib/date";
import {
  calculateScore,
  calculateStreak,
  completionCount,
  criticalMisses,
  dayStatus,
  isNonZeroDay,
  movementDone,
  tasksForDate,
  weekKey,
  weeklyScores,
  wonDaysCount
} from "./lib/scoring";
import type { DayStatus } from "./lib/scoring";
import { createEmptyLog, loadState, normalizeImportedState, saveState } from "./lib/storage";
import type {
  AppSettings,
  AppState,
  DayLevel,
  DayLog,
  DayMode,
  NonNegotiables,
  RoutineTask,
  TaskCategory,
  TaskPriority,
  TimerPreset,
  WeeklyReview
} from "./types";

type View = "today" | "planner" | "stats" | "guide" | "data";

const dayLabels = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"];

const categoryLabels: Record<TaskCategory, string> = {
  morning: "Rano",
  deepWork: "Nauka",
  jobSearch: "Praca",
  project: "Projekt",
  training: "Trening",
  home: "Dom",
  admin: "Administracja",
  evening: "Wieczór",
  health: "Zdrowie"
};

const priorityLabels: Record<TaskPriority, string> = {
  critical: "kotwica",
  standard: "standard",
  optional: "opcjonalne"
};

const phaseLabels: Record<string, string> = {
  morning: "Rano",
  workday: "Dzień pracy własnej",
  evening: "Wieczór",
  night: "Zamknięcie dnia"
};

const dayModeLabels: Record<DayMode, string> = {
  auto: "Auto",
  training: "Trening",
  recovery: "Nietreningowy"
};

const dayLevelMeta: Record<DayLevel, { label: string; description: string; icon: typeof Shield }> = {
  p1: { label: "P1 Minimum", description: "zły dzień — nie zerwij ciągłości", icon: Shield },
  p2: { label: "P2 Standard", description: "domyślny tryb dnia", icon: Activity },
  p3: { label: "P3 Ofensywa", description: "wysoka energia, sufit 4-5h", icon: Zap }
};

const statusMeta: Record<DayStatus, { label: string; tone: "good" | "warn" | "bad" }> = {
  won: { label: "Zaliczony", tone: "good" },
  nonzero: { label: "Nie-zero", tone: "warn" },
  zero: { label: "Zero", tone: "bad" }
};

function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `task-${Date.now()}`;
}

function getCategoryIcon(category: TaskCategory) {
  switch (category) {
    case "morning":
      return Sun;
    case "deepWork":
      return Brain;
    case "jobSearch":
      return Briefcase;
    case "project":
      return Rocket;
    case "training":
      return Dumbbell;
    case "home":
      return Home;
    case "admin":
      return ShieldCheck;
    case "evening":
      return Moon;
    case "health":
      return Activity;
  }
}

function clampNumber(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

function downloadJson(payload: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function ensureLog(logs: AppState["logs"], key: string): DayLog {
  return logs[key] ?? createEmptyLog(key);
}

function formatTaskWindow(task: RoutineTask): string {
  return task.end ? `${task.start}-${task.end}` : task.start;
}

function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [view, setView] = useState<View>("today");
  const [editingTask, setEditingTask] = useState<RoutineTask | null>(null);

  const selectedKey = dateKey(selectedDate);
  const log = ensureLog(state.logs, selectedKey);
  const dayLevel = log.dayLevel ?? "p2";
  const todayTasks = useMemo(
    () => tasksForDate(state.tasks, selectedDate, log.dayMode, dayLevel),
    [state.tasks, selectedDate, log.dayMode, dayLevel]
  );
  const score = calculateScore(todayTasks, log);
  const counts = completionCount(todayTasks, log);
  const misses = criticalMisses(todayTasks, log);
  const streak = calculateStreak(state, new Date());
  const status = dayStatus(state.logs[selectedKey]);

  useEffect(() => {
    saveState(state);
  }, [state]);

  function updateLog(mutator: (current: DayLog) => DayLog): void {
    setState((currentState) => {
      const currentLog = ensureLog(currentState.logs, selectedKey);
      return {
        ...currentState,
        logs: {
          ...currentState.logs,
          [selectedKey]: mutator(currentLog)
        }
      };
    });
  }

  function toggleTask(taskId: string): void {
    updateLog((currentLog) => {
      const isCompleted = currentLog.completedTaskIds.includes(taskId);
      return {
        ...currentLog,
        completedTaskIds: isCompleted
          ? currentLog.completedTaskIds.filter((id) => id !== taskId)
          : [...currentLog.completedTaskIds, taskId],
        skippedTaskIds: currentLog.skippedTaskIds.filter((id) => id !== taskId)
      };
    });
  }

  function toggleNonNegotiable(key: keyof NonNegotiables): void {
    updateLog((currentLog) => ({
      ...currentLog,
      nonNegotiables: {
        ...currentLog.nonNegotiables,
        [key]: !currentLog.nonNegotiables[key]
      }
    }));
  }

  function upsertTask(task: RoutineTask): void {
    setState((currentState) => {
      const exists = currentState.tasks.some((item) => item.id === task.id);
      return {
        ...currentState,
        tasks: exists
          ? currentState.tasks.map((item) => (item.id === task.id ? task : item))
          : [...currentState.tasks, task]
      };
    });
    setEditingTask(null);
  }

  function deleteTask(taskId: string): void {
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task || !window.confirm(`Usunąć zadanie: ${task.title}?`)) {
      return;
    }

    setState((currentState) => ({
      ...currentState,
      tasks: currentState.tasks.filter((item) => item.id !== taskId),
      logs: Object.fromEntries(
        Object.entries(currentState.logs).map(([key, dayLog]) => [
          key,
          {
            ...dayLog,
            completedTaskIds: dayLog.completedTaskIds.filter((id) => id !== taskId),
            skippedTaskIds: dayLog.skippedTaskIds.filter((id) => id !== taskId)
          }
        ])
      )
    }));
  }

  function updateSettings(settings: Partial<AppSettings>): void {
    setState((currentState) => ({
      ...currentState,
      settings: { ...currentState.settings, ...settings }
    }));
  }

  function updateWeeklyReview(key: string, patch: Partial<WeeklyReview>): void {
    setState((currentState) => {
      const current = currentState.weeklyReviews[key] ?? { wins: "", bottleneck: "", experiment: "" };
      return {
        ...currentState,
        weeklyReviews: {
          ...currentState.weeklyReviews,
          [key]: { ...current, ...patch }
        }
      };
    });
  }

  function resetToday(): void {
    if (!window.confirm("Wyczyścić wykonanie i metryki dla tego dnia?")) {
      return;
    }

    setState((currentState) => ({
      ...currentState,
      logs: {
        ...currentState.logs,
        [selectedKey]: createEmptyLog(selectedKey)
      }
    }));
  }

  function resetRoutine(): void {
    if (!window.confirm("Przywrócić domyślną rutynę? Logi zostaną zachowane.")) {
      return;
    }

    setState((currentState) => ({
      ...currentState,
      tasks: defaultTasks,
      settings: defaultSettings
    }));
  }

  function clearLogs(): void {
    if (!window.confirm("Wyczyścić wszystkie logi wykonania? Rutyna zostanie zachowana.")) {
      return;
    }

    setState((currentState) => ({
      ...currentState,
      logs: {}
    }));
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Shield size={22} />
          </div>
          <div>
            <strong>Monk Mode</strong>
            <span>{currentTimeLabel()}</span>
          </div>
        </div>

        <nav className="nav" aria-label="Główna nawigacja">
          <NavButton active={view === "today"} icon={LayoutDashboard} label="Dzisiaj" onClick={() => setView("today")} />
          <NavButton active={view === "planner"} icon={CalendarDays} label="Plan" onClick={() => setView("planner")} />
          <NavButton active={view === "stats"} icon={BarChart3} label="Statystyki" onClick={() => setView("stats")} />
          <NavButton active={view === "guide"} icon={BookOpen} label="Przewodnik" onClick={() => setView("guide")} />
          <NavButton active={view === "data"} icon={Settings} label="Dane" onClick={() => setView("data")} />
        </nav>

        <div className="sidebar-footer">
          <span>Dni nie-zero</span>
          <strong>{streak}</strong>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">System operacyjny</p>
            <h1>{viewTitle(view)}</h1>
          </div>
          <div className="date-controls">
            <button className="icon-button" title="Poprzedni dzień" onClick={() => setSelectedDate((date) => addDays(date, -1))}>
              <ChevronLeft size={18} />
            </button>
            <button className="date-pill" onClick={() => setSelectedDate(new Date())}>
              {formatLongDate(selectedDate)}
            </button>
            <button className="icon-button" title="Następny dzień" onClick={() => setSelectedDate((date) => addDays(date, 1))}>
              <ChevronRight size={18} />
            </button>
          </div>
        </header>

        {view === "today" && (
          <TodayView
            counts={counts}
            log={log}
            misses={misses}
            onAddTask={() => setEditingTask(createNewTask(selectedDate))}
            onDeleteTask={deleteTask}
            onEditTask={setEditingTask}
            onResetToday={resetToday}
            onToggleNonNegotiable={toggleNonNegotiable}
            onToggleTask={toggleTask}
            onUpdateLog={updateLog}
            score={score}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            state={state}
            status={status}
            streak={streak}
            tasks={todayTasks}
          />
        )}

        {view === "planner" && (
          <PlannerView
            onAddTask={() => setEditingTask(createNewTask(selectedDate))}
            onDeleteTask={deleteTask}
            onEditTask={setEditingTask}
            onResetRoutine={resetRoutine}
            onUpdateSettings={updateSettings}
            settings={state.settings}
            tasks={state.tasks}
          />
        )}

        {view === "stats" && <StatsView onUpdateReview={updateWeeklyReview} selectedDate={selectedDate} state={state} />}

        {view === "guide" && <GuideView />}

        {view === "data" && (
          <DataView
            onClearLogs={clearLogs}
            onImport={(nextState) => setState(nextState)}
            onResetRoutine={resetRoutine}
            state={state}
          />
        )}
      </main>

      {editingTask && <TaskEditor task={editingTask} onClose={() => setEditingTask(null)} onSave={upsertTask} />}
    </div>
  );
}

function viewTitle(view: View): string {
  switch (view) {
    case "today":
      return "Dzisiaj";
    case "planner":
      return "Plan i edycja";
    case "stats":
      return "Statystyki i przegląd";
    case "guide":
      return "Przewodnik";
    case "data":
      return "Eksport i import";
  }
}

function createNewTask(date: Date): RoutineTask {
  return {
    id: uid(),
    title: "Nowy blok",
    category: "deepWork",
    start: "08:00",
    durationMinutes: 30,
    days: [date.getDay()],
    priority: "standard",
    weight: 2,
    instructions: "",
    rationale: "",
    checklist: [],
    isDefault: false
  };
}

function NavButton({
  active,
  icon: Icon,
  label,
  onClick
}: {
  active: boolean;
  icon: typeof LayoutDashboard;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className={`nav-button ${active ? "active" : ""}`} onClick={onClick}>
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
}

function TodayView({
  counts,
  log,
  misses,
  onAddTask,
  onDeleteTask,
  onEditTask,
  onResetToday,
  onToggleNonNegotiable,
  onToggleTask,
  onUpdateLog,
  score,
  selectedDate,
  setSelectedDate,
  state,
  status,
  streak,
  tasks
}: {
  counts: { completed: number; total: number };
  log: DayLog;
  misses: number;
  onAddTask: () => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: RoutineTask) => void;
  onResetToday: () => void;
  onToggleNonNegotiable: (key: keyof NonNegotiables) => void;
  onToggleTask: (taskId: string) => void;
  onUpdateLog: (mutator: (current: DayLog) => DayLog) => void;
  score: number;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  state: AppState;
  status: DayStatus;
  streak: number;
  tasks: RoutineTask[];
}) {
  const groupedTasks = groupTasks(tasks);
  const dayLevel = log.dayLevel ?? "p2";
  const isSelectedToday = dateKey(selectedDate) === dateKey(new Date());
  const todayKey = dateKey(new Date());
  const yesterdayLog = state.logs[dateKey(addDays(new Date(), -1))];
  const hasEarlierHistory = Object.keys(state.logs).some((key) => key < todayKey);
  const showZeroBanner = isSelectedToday && hasEarlierHistory && !isNonZeroDay(yesterdayLog);

  return (
    <div className="page-grid">
      {showZeroBanner && (
        <section className="zero-banner">
          <TriangleAlert size={20} />
          <div>
            <strong>Wczoraj było zero. Reguła: nigdy dwa zera z rzędu.</strong>
            <p>Dziś wystarczy P1 — 25 minut czegokolwiek z Wielkiej Trójki. Nie nadrabiaj, wróć do minimum. Minimum to zwycięstwo.</p>
          </div>
          <button
            className="secondary-button"
            onClick={() => onUpdateLog((currentLog) => ({ ...currentLog, dayLevel: "p1" }))}
          >
            <Shield size={16} />
            Ustaw P1
          </button>
        </section>
      )}

      <CommandCenter log={log} score={score} selectedDate={selectedDate} settings={state.settings} tasks={tasks} />

      <BigThreePanel log={log} onToggle={onToggleNonNegotiable} status={status} />

      <section className="status-grid">
        <MetricCard label="Wynik dnia" value={`${score}%`} tone={score >= state.settings.scoreTarget ? "good" : "warn"} icon={ShieldCheck} />
        <MetricCard label="Bloki" value={`${counts.completed}/${counts.total}`} tone="neutral" icon={Check} />
        <MetricCard label="Dni nie-zero" value={`${streak}`} tone="hot" icon={Flame} />
        <MetricCard label="Kotwice otwarte" value={`${misses}`} tone={misses === 0 ? "good" : "bad"} icon={Circle} />
      </section>

      <WeekStrip selectedDate={selectedDate} setSelectedDate={setSelectedDate} state={state} />

      <section className="day-setup">
        <DayLevelSwitch
          level={dayLevel}
          onChange={(level) =>
            onUpdateLog((currentLog) => ({
              ...currentLog,
              dayLevel: level
            }))
          }
        />
        <DayModeSwitch
          mode={log.dayMode ?? "auto"}
          onChange={(mode) =>
            onUpdateLog((currentLog) => ({
              ...currentLog,
              dayMode: mode
            }))
          }
        />
      </section>

      <div className="content-columns">
        <section className="panel task-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">{dayLevel === "p1" ? "Tylko minima kotwic" : "Lista wykonania"}</p>
              <h2>Bloki dnia</h2>
            </div>
            <div className="button-row">
              <button className="secondary-button" onClick={onResetToday}>
                <RefreshCcw size={16} />
                Reset
              </button>
              <button className="primary-button" onClick={onAddTask}>
                <Plus size={16} />
                Blok
              </button>
            </div>
          </div>

          <div className="timeline">
            {Object.entries(groupedTasks).map(([category, categoryTasks]) => (
              <div className="task-group" key={category}>
                <div className="group-label">
                  <span>{phaseLabels[category]}</span>
                  <span>{categoryTasks.length}</span>
                </div>
                {categoryTasks.map((task) => (
                  <TaskRow
                    completed={log.completedTaskIds.includes(task.id)}
                    key={task.id}
                    level={dayLevel}
                    onDelete={onDeleteTask}
                    onEdit={onEditTask}
                    onToggle={onToggleTask}
                    task={task}
                  />
                ))}
              </div>
            ))}
          </div>
        </section>

        <aside className="side-stack">
          <ProtocolPanel log={log} tasks={tasks} />
          <FocusTimer />
          <DailyMetrics log={log} onUpdateLog={onUpdateLog} />
          <NotesPanel log={log} onUpdateLog={onUpdateLog} />
        </aside>
      </div>
    </div>
  );
}

function CommandCenter({
  log,
  score,
  selectedDate,
  settings,
  tasks
}: {
  log: DayLog;
  score: number;
  selectedDate: Date;
  settings: AppSettings;
  tasks: RoutineTask[];
}) {
  const completed = new Set(log.completedTaskIds);
  const isSelectedToday = dateKey(selectedDate) === dateKey(new Date());
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const openTasks = tasks.filter((task) => !completed.has(task.id));
  const nextTask =
    (isSelectedToday ? openTasks.find((task) => minutesFromTime(task.start) >= nowMinutes) : undefined) ?? openTasks[0] ?? tasks[0];
  const criticalTasks = tasks.filter((task) => task.priority === "critical");
  const criticalDone = criticalTasks.filter((task) => completed.has(task.id)).length;
  const projectTask = tasks.find((task) => task.id === "deep-project" || task.id === "weekend-sprint");
  const jobTask = tasks.find((task) => task.id === "job-search");
  const nextChecklist = nextTask?.checklist?.slice(0, 3) ?? [];

  return (
    <section className="command-center">
      <article className="score-panel">
        <div className="score-ring" style={{ "--score": `${score}%` } as React.CSSProperties}>
          <strong>{score}%</strong>
          <span>dzień</span>
        </div>
        <div>
          <p className="eyebrow">Kontrola</p>
          <h2>Cel {settings.scoreTarget}%</h2>
          <div className="score-track" aria-hidden="true">
            <span style={{ width: `${score}%` }} />
          </div>
          <p className="microcopy">
            Kotwice: {criticalDone}/{criticalTasks.length}
          </p>
        </div>
      </article>

      <article className="next-panel">
        <div className="panel-icon">
          <Target size={18} />
        </div>
        <div>
          <p className="eyebrow">Następny ruch</p>
          <h2>{nextTask?.title ?? "Brak zadań"}</h2>
          <p>{nextTask ? `${formatTaskWindow(nextTask)} · ${nextTask.durationMinutes} min · ${nextTask.instructions}` : "Plan jest pusty."}</p>
          {nextChecklist.length > 0 && (
            <ul className="next-checklist">
              {nextChecklist.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      </article>

      <article className="anchors-panel">
        <div className="panel-icon">
          <ListChecks size={18} />
        </div>
        <div className="anchor-list">
          <Anchor label="Pobudka" value={settings.wakeTime} />
          <Anchor label="Projekt" value={projectTask ? formatTaskWindow(projectTask) : "-"} />
          <Anchor label="Praca" value={jobTask ? formatTaskWindow(jobTask) : "wolne"} />
          <Anchor label="Sen" value={settings.bedTime} />
        </div>
      </article>
    </section>
  );
}

function Anchor({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="anchor-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function BigThreePanel({
  log,
  onToggle,
  status
}: {
  log: DayLog;
  onToggle: (key: keyof NonNegotiables) => void;
  status: DayStatus;
}) {
  const items: Array<{
    key: keyof NonNegotiables;
    icon: typeof Briefcase;
    label: string;
    description: string;
    done: boolean;
    auto?: boolean;
  }> = [
    {
      key: "job",
      icon: Briefcase,
      label: "Praca",
      description: "aplikacja / kontakt / rozmowa / follow-up",
      done: log.nonNegotiables.job
    },
    {
      key: "project",
      icon: Rocket,
      label: "Projekt",
      description: "artefakt, który zobaczył świat",
      done: log.nonNegotiables.project
    },
    {
      key: "movement",
      icon: Footprints,
      label: "Ruch",
      description: "minimum 10 minut",
      done: movementDone(log),
      auto: !log.nonNegotiables.movement && movementDone(log)
    }
  ];

  const meta = statusMeta[status];

  return (
    <section className="big-three" aria-label="Wielka Trójka">
      <div className="big-three-head">
        <div>
          <p className="eyebrow">Wielka Trójka</p>
          <h2>Czy ten dzień się liczy?</h2>
        </div>
        <span className={`day-status ${status}`}>
          {status === "won" ? <Trophy size={15} /> : status === "nonzero" ? <Check size={15} /> : <Circle size={15} />}
          {meta.label}
        </span>
      </div>
      <div className="big-three-items">
        {items.map(({ auto, description, done, icon: Icon, key, label }) => (
          <button className={`nn-item ${done ? "done" : ""}`} key={key} onClick={() => onToggle(key)}>
            <span className="nn-check">{done ? <Check size={16} /> : <Icon size={16} />}</span>
            <span className="nn-copy">
              <strong>{label}</strong>
              <small>{auto ? "zaliczone blokiem treningu" : description}</small>
            </span>
          </button>
        ))}
      </div>
      <p className="big-three-rule">
        Zaliczony = (praca <em>lub</em> projekt) + ruch. Nie-zero = cokolwiek. Jedyna twarda reguła: <strong>nigdy dwa zera z rzędu</strong>.
      </p>
    </section>
  );
}

function DayLevelSwitch({ level, onChange }: { level: DayLevel; onChange: (level: DayLevel) => void }) {
  return (
    <section className="day-mode-panel" aria-label="Poziom dnia">
      <div>
        <p className="eyebrow">Poziom dnia</p>
        <h2>{dayLevelMeta[level].label}</h2>
      </div>
      <div className="mode-toggle">
        {(Object.keys(dayLevelMeta) as DayLevel[]).map((option) => {
          const { description, icon: Icon, label } = dayLevelMeta[option];
          return (
            <button className={level === option ? "selected" : ""} key={option} onClick={() => onChange(option)}>
              <Icon size={16} />
              <span>{label}</span>
              <small>{description}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function DayModeSwitch({ mode, onChange }: { mode: DayMode; onChange: (mode: DayMode) => void }) {
  const options: Array<{ mode: DayMode; label: string; description: string; icon: typeof RefreshCcw }> = [
    {
      mode: "auto",
      label: dayModeLabels.auto,
      description: "harmonogram tygodnia",
      icon: RefreshCcw
    },
    {
      mode: "training",
      label: dayModeLabels.training,
      description: "siłowy + regeneracja",
      icon: Dumbbell
    },
    {
      mode: "recovery",
      label: dayModeLabels.recovery,
      description: "ruch tlenowy",
      icon: Activity
    }
  ];

  return (
    <section className="day-mode-panel" aria-label="Tryb dnia">
      <div>
        <p className="eyebrow">Tryb dnia</p>
        <h2>{dayModeLabels[mode]}</h2>
      </div>
      <div className="mode-toggle">
        {options.map(({ description, icon: Icon, label, mode: optionMode }) => (
          <button className={mode === optionMode ? "selected" : ""} key={optionMode} onClick={() => onChange(optionMode)}>
            <Icon size={16} />
            <span>{label}</span>
            <small>{description}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function ProtocolPanel({ log, tasks }: { log: DayLog; tasks: RoutineTask[] }) {
  const completed = new Set(log.completedTaskIds);
  const anchorTasks = tasks.filter((task) => task.priority === "critical");
  const anchorDone = anchorTasks.filter((task) => completed.has(task.id)).length;
  const allDone = anchorTasks.length > 0 && anchorDone === anchorTasks.length;
  const mode = allDone ? "Domknięte" : anchorDone > 0 ? "W ruchu" : "Start";
  const minimumSteps = [
    "25 min projektu albo 1 aplikacja",
    "10 min ruchu",
    "2 min shutdown + MIT na jutro"
  ];

  return (
    <section className="panel protocol-panel">
      <div className="panel-head compact">
        <div>
          <p className="eyebrow">Kotwice dnia</p>
          <h2>{mode}</h2>
        </div>
        <ShieldCheck size={20} />
      </div>

      <div className="protocol-meter">
        <span style={{ width: `${Math.min(100, (anchorDone / Math.max(anchorTasks.length, 1)) * 100)}%` }} />
      </div>

      <div className="protocol-anchors">
        {anchorTasks.map((task) => (
          <div className={completed.has(task.id) ? "complete" : ""} key={task.id}>
            <Check size={14} />
            <span>{task.title}</span>
          </div>
        ))}
      </div>

      <div className="minimum-plan">
        <strong>Plan minimum (P1)</strong>
        <ul>
          {minimumSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function groupTasks(tasks: RoutineTask[]): Record<string, RoutineTask[]> {
  return tasks.reduce<Record<string, RoutineTask[]>>((groups, task) => {
    const phase = getTaskPhase(task);
    groups[phase] = groups[phase] ? [...groups[phase], task] : [task];
    return groups;
  }, {});
}

function getTaskPhase(task: RoutineTask): string {
  const minutes = minutesFromTime(task.start);
  if (minutes < 8 * 60 + 15) {
    return "morning";
  }
  if (minutes < 17 * 60 + 30) {
    return "workday";
  }
  if (minutes < 22 * 60) {
    return "evening";
  }
  return "night";
}

function WeekStrip({
  selectedDate,
  setSelectedDate,
  state
}: {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  state: AppState;
}) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(selectedDate, index - 3));

  return (
    <section className="week-strip" aria-label="Tydzień">
      {days.map((day) => {
        const key = dateKey(day);
        const dayLog = state.logs[key];
        const resolvedLog = dayLog ?? createEmptyLog(key);
        const score = calculateScore(tasksForDate(state.tasks, day, resolvedLog.dayMode, resolvedLog.dayLevel), resolvedLog);
        const isSelected = key === dateKey(selectedDate);
        const status = dayStatus(dayLog);

        return (
          <button className={`week-day ${isSelected ? "selected" : ""}`} key={key} onClick={() => setSelectedDate(day)}>
            <span>{formatShortDate(day)}</span>
            <strong>{score}%</strong>
            <i className={`status-dot ${status}`} aria-hidden="true" />
          </button>
        );
      })}
    </section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  tone,
  value
}: {
  icon: typeof ShieldCheck;
  label: string;
  tone: "good" | "warn" | "bad" | "neutral" | "hot";
  value: string;
}) {
  return (
    <article className={`metric-card ${tone}`}>
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function TaskRow({
  completed,
  level,
  onDelete,
  onEdit,
  onToggle,
  task
}: {
  completed: boolean;
  level?: DayLevel;
  onDelete: (taskId: string) => void;
  onEdit: (task: RoutineTask) => void;
  onToggle: (taskId: string) => void;
  task: RoutineTask;
}) {
  const Icon = getCategoryIcon(task.category);
  const isMinimum = level === "p1" && Boolean(task.minimum);
  const checklist = isMinimum ? [] : task.checklist ?? [];
  const previewChecklist = checklist.slice(0, 2);
  const hiddenChecklistCount = Math.max(0, checklist.length - previewChecklist.length);

  return (
    <article className={`task-row ${completed ? "done" : ""}`} data-testid={`task-${task.id}`}>
      <button
        className="check-button"
        data-testid={`complete-${task.id}`}
        title={completed ? "Oznacz jako niewykonane" : "Oznacz jako wykonane"}
        onClick={() => onToggle(task.id)}
      >
        {completed ? <Check size={18} /> : <Circle size={18} />}
      </button>

      <div className="task-time">
        <strong>{formatTaskWindow(task)}</strong>
        <span>{task.durationMinutes} min</span>
      </div>

      <div className="task-body">
        <div className="task-title-line">
          <Icon size={16} />
          <h3>{task.title}</h3>
          {isMinimum ? (
            <span className="priority minimum">minimum</span>
          ) : (
            <span className={`priority ${task.priority}`}>{priorityLabels[task.priority]}</span>
          )}
        </div>
        {isMinimum ? (
          <p className="minimum-copy">{task.minimum}</p>
        ) : (
          task.instructions && <p>{task.instructions}</p>
        )}
        {previewChecklist.length > 0 && (
          <ul className="task-checklist">
            {previewChecklist.map((item, index) => (
              <li key={`${item}-${index}`}>
                <Check size={12} />
                <span>{item}</span>
              </li>
            ))}
            {hiddenChecklistCount > 0 && <li className="more-steps">+{hiddenChecklistCount}</li>}
          </ul>
        )}
        {!isMinimum && (task.rationale || hiddenChecklistCount > 0) && (
          <details className="task-details">
            <summary>Mechanizm i pełna lista</summary>
            {task.instructions && <p className="task-details-copy">{task.instructions}</p>}
            {hiddenChecklistCount > 0 && (
              <ul>
                {checklist.map((item, index) => (
                  <li key={`${item}-full-${index}`}>{item}</li>
                ))}
              </ul>
            )}
            {task.rationale && <small>{task.rationale}</small>}
          </details>
        )}
      </div>

      <div className="task-actions">
        <button className="icon-button" data-testid={`edit-${task.id}`} title="Edytuj" onClick={() => onEdit(task)}>
          <Edit3 size={16} />
        </button>
        <button className="icon-button danger" data-testid={`delete-${task.id}`} title="Usuń" onClick={() => onDelete(task.id)}>
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}

function FocusTimer() {
  const [preset, setPreset] = useState<TimerPreset>(timerPresets[1]);
  const [remaining, setRemaining] = useState(preset.minutes * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          setRunning(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [running]);

  function choosePreset(nextPreset: TimerPreset): void {
    setPreset(nextPreset);
    setRemaining(nextPreset.minutes * 60);
    setRunning(false);
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const percent = 100 - Math.round((remaining / (preset.minutes * 60)) * 100);

  return (
    <section className="panel">
      <div className="panel-head compact">
        <div>
          <p className="eyebrow">Timer</p>
          <h2>{preset.label}</h2>
        </div>
        <Clock size={20} />
      </div>
      <div className="timer-face" style={{ "--progress": `${percent}%` } as React.CSSProperties}>
        <strong>
          {`${minutes}`.padStart(2, "0")}:{`${seconds}`.padStart(2, "0")}
        </strong>
      </div>
      <div className="timer-controls">
        <button className="primary-button" onClick={() => setRunning((value) => !value)}>
          {running ? <Pause size={16} /> : <Play size={16} />}
          {running ? "Pauza" : "Start"}
        </button>
        <button className="secondary-button" onClick={() => setRemaining(preset.minutes * 60)}>
          <RefreshCcw size={16} />
          Reset
        </button>
      </div>
      <div className="preset-grid">
        {timerPresets.map((item) => (
          <button className={item.id === preset.id ? "selected" : ""} key={item.id} onClick={() => choosePreset(item)}>
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function DailyMetrics({
  log,
  onUpdateLog
}: {
  log: DayLog;
  onUpdateLog: (mutator: (current: DayLog) => DayLog) => void;
}) {
  function updateMetric(key: keyof DayLog["metrics"], value: number): void {
    onUpdateLog((currentLog) => ({
      ...currentLog,
      metrics: {
        ...currentLog.metrics,
        [key]: value
      }
    }));
  }

  return (
    <section className="panel">
      <div className="panel-head compact">
        <div>
          <p className="eyebrow">Dziennik</p>
          <h2>Metryki</h2>
        </div>
        <BarChart3 size={20} />
      </div>
      <div className="metric-inputs">
        <NumberMetric icon={Bed} label="Sen" suffix="h" value={log.metrics.sleepHours} onChange={(value) => updateMetric("sleepHours", clampNumber(value, 0, 14))} />
        <NumberMetric icon={Coffee} label="Alkohol" suffix="j." value={log.metrics.alcoholUnits} onChange={(value) => updateMetric("alcoholUnits", clampNumber(value, 0, 30))} />
        <RangeMetric label="Focus" value={log.metrics.focus} onChange={(value) => updateMetric("focus", value)} />
        <RangeMetric label="Energia" value={log.metrics.energy} onChange={(value) => updateMetric("energy", value)} />
        <RangeMetric label="Nastrój" value={log.metrics.mood} onChange={(value) => updateMetric("mood", value)} />
      </div>
    </section>
  );
}

function NumberMetric({
  icon: Icon,
  label,
  onChange,
  suffix,
  value
}: {
  icon: typeof Bed;
  label: string;
  onChange: (value: number) => void;
  suffix: string;
  value: number;
}) {
  return (
    <label className="number-metric">
      <span>
        <Icon size={16} />
        {label}
      </span>
      <div>
        <input type="number" min="0" step="0.5" value={value} onChange={(event) => onChange(Number(event.target.value))} />
        <small>{suffix}</small>
      </div>
    </label>
  );
}

function RangeMetric({ label, onChange, value }: { label: string; onChange: (value: number) => void; value: number }) {
  return (
    <label className="range-metric">
      <span>
        {label}
        <strong>{value}/5</strong>
      </span>
      <input type="range" min="1" max="5" step="1" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function NotesPanel({
  log,
  onUpdateLog
}: {
  log: DayLog;
  onUpdateLog: (mutator: (current: DayLog) => DayLog) => void;
}) {
  return (
    <section className="panel">
      <div className="panel-head compact">
        <div>
          <p className="eyebrow">Dziennik</p>
          <h2>MIT na jutro</h2>
        </div>
        <Edit3 size={20} />
      </div>
      <textarea
        className="notes"
        placeholder="Najważniejsze zadanie na jutro + pierwszy ruch. Co dziś wysłane / opublikowane?"
        value={log.notes}
        onChange={(event) =>
          onUpdateLog((currentLog) => ({
            ...currentLog,
            notes: event.target.value
          }))
        }
      />
    </section>
  );
}

function PlannerView({
  onAddTask,
  onDeleteTask,
  onEditTask,
  onResetRoutine,
  onUpdateSettings,
  settings,
  tasks
}: {
  onAddTask: () => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: RoutineTask) => void;
  onResetRoutine: () => void;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  settings: AppSettings;
  tasks: RoutineTask[];
}) {
  const sortedTasks = [...tasks].sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div className="content-columns">
      <section className="panel task-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Edycja</p>
            <h2>Bloki i rutyna</h2>
          </div>
          <button className="primary-button" onClick={onAddTask}>
            <Plus size={16} />
            Blok
          </button>
        </div>
        <div className="timeline compact-list">
          {sortedTasks.map((task) => (
            <TaskRow
              completed={false}
              key={task.id}
              onDelete={onDeleteTask}
              onEdit={onEditTask}
              onToggle={() => onEditTask(task)}
              task={task}
            />
          ))}
        </div>
      </section>

      <aside className="side-stack">
        <section className="panel">
          <div className="panel-head compact">
            <div>
              <p className="eyebrow">Konfiguracja</p>
              <h2>Kotwice</h2>
            </div>
            <Settings size={20} />
          </div>
          <div className="settings-grid">
            <TimeSetting label="Pobudka" value={settings.wakeTime} onChange={(value) => onUpdateSettings({ wakeTime: value })} />
            <TimeSetting label="Sen" value={settings.bedTime} onChange={(value) => onUpdateSettings({ bedTime: value })} />
            <TimeSetting label="Kawa cutoff" value={settings.caffeineCutoff} onChange={(value) => onUpdateSettings({ caffeineCutoff: value })} />
            <label className="field">
              <span>Cel wyniku</span>
              <input
                max="100"
                min="50"
                type="number"
                value={settings.scoreTarget}
                onChange={(event) => onUpdateSettings({ scoreTarget: clampNumber(Number(event.target.value), 50, 100) })}
              />
            </label>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head compact">
            <div>
              <p className="eyebrow">Reset</p>
              <h2>Szablon</h2>
            </div>
            <RefreshCcw size={20} />
          </div>
          <button className="secondary-button full-width" onClick={onResetRoutine}>
            <RefreshCcw size={16} />
            Przywróć domyślną rutynę
          </button>
        </section>
      </aside>
    </div>
  );
}

function TimeSetting({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="time" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function StatsView({
  onUpdateReview,
  selectedDate,
  state
}: {
  onUpdateReview: (key: string, patch: Partial<WeeklyReview>) => void;
  selectedDate: Date;
  state: AppState;
}) {
  const scores = weeklyScores(state, selectedDate);
  const logs = Object.values(state.logs).sort((a, b) => a.date.localeCompare(b.date));
  const last14 = logs.slice(-14);
  const sleepAverage = average(last14.map((item) => item.metrics.sleepHours));
  const jobDays14 = last14.filter((item) => item.nonNegotiables.job).length;
  const projectDays14 = last14.filter((item) => item.nonNegotiables.project).length;
  const wonDays7 = wonDaysCount(state, selectedDate, 7);
  const missedTasks = calculateMissedTasks(state);
  const reviewKey = weekKey(selectedDate);
  const review = state.weeklyReviews[reviewKey] ?? { wins: "", bottleneck: "", experiment: "" };

  return (
    <div className="page-grid">
      <section className="status-grid">
        <MetricCard label="Dni zaliczone 7d" value={`${wonDays7}/7`} tone={wonDays7 >= 5 ? "good" : "warn"} icon={Trophy} />
        <MetricCard label="Praca 14d" value={`${jobDays14}`} tone={jobDays14 >= 8 ? "good" : "warn"} icon={Briefcase} />
        <MetricCard label="Projekt 14d" value={`${projectDays14}`} tone={projectDays14 >= 8 ? "good" : "warn"} icon={Rocket} />
        <MetricCard label="Sen 14d" value={`${sleepAverage.toFixed(1)}h`} tone={sleepAverage >= 7 ? "good" : "bad"} icon={Bed} />
      </section>

      <div className="content-columns">
        <div className="page-grid">
          <section className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Ostatnie dni</p>
                <h2>Wynik tygodnia</h2>
              </div>
              <BarChart3 size={22} />
            </div>
            <div className="bar-chart">
              {scores.map((item) => (
                <div className={`bar-item ${item.status}`} key={item.date}>
                  <div className="bar-track">
                    <span style={{ height: `${item.score}%` }} />
                  </div>
                  <strong>{item.score}%</strong>
                  <small>{formatShortDate(parseDateKey(item.date)).split(",")[0]}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Tarcie</p>
                <h2>Najczęściej pomijane</h2>
              </div>
              <Circle size={22} />
            </div>
            <div className="missed-list">
              {missedTasks.length === 0 && <p className="empty-state">Brak danych.</p>}
              {missedTasks.slice(0, 8).map((item) => (
                <div className="missed-row" key={item.task.id}>
                  <span>{item.task.title}</span>
                  <strong>{item.missed}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="side-stack">
          <section className="panel review-panel">
            <div className="panel-head compact">
              <div>
                <p className="eyebrow">Niedziela, 20-30 min</p>
                <h2>Przegląd tygodnia</h2>
              </div>
              <CalendarDays size={20} />
            </div>
            <p className="review-week">Tydzień od {formatShortDate(parseDateKey(reviewKey))}</p>
            <label className="field">
              <span>1. Co realnie ruszyło (praca / projekt)?</span>
              <textarea
                value={review.wins}
                onChange={(event) => onUpdateReview(reviewKey, { wins: event.target.value })}
                placeholder="Wysłane aplikacje, rozmowy, artefakty projektu..."
              />
            </label>
            <label className="field">
              <span>2. Gdzie było najwęższe gardło?</span>
              <textarea
                value={review.bottleneck}
                onChange={(event) => onUpdateReview(reviewKey, { bottleneck: event.target.value })}
                placeholder="Co generowało najwięcej tarcia / unikania?"
              />
            </label>
            <label className="field">
              <span>3. JEDEN eksperyment na przyszły tydzień</span>
              <textarea
                value={review.experiment}
                onChange={(event) => onUpdateReview(reviewKey, { experiment: event.target.value })}
                placeholder="Jedna zmiana, nie pięć."
              />
            </label>
          </section>
        </aside>
      </div>
    </div>
  );
}

function GuideView() {
  return (
    <div className="guide-grid">
      <section className="guide-hero">
        <p className="eyebrow">Protokół Monk + Founder Mode · edycja bez etatu</p>
        <h2>System, który ma przeżyć Twój najgorszy dzień</h2>
        <p>
          To nie jest plan motywacyjny. To architektura środowiska i zachowań oparta na badaniach — zaprojektowana tak, żeby
          działała, gdy motywacji nie ma. Bo nie będzie jej w 60% dni.
        </p>
        <div className="guide-pillars">
          <div>
            <Shield size={18} />
            <strong>3 poziomy dnia</strong>
            <small>P1 minimum · P2 standard · P3 ofensywa</small>
          </div>
          <div>
            <Trophy size={18} />
            <strong>Wielka Trójka</strong>
            <small>praca · projekt · ruch — to liczy dzień</small>
          </div>
          <div>
            <Flame size={18} />
            <strong>Nigdy dwa zera</strong>
            <small>zły dzień = P1, nie katastrofa</small>
          </div>
        </div>
      </section>

      {guideSections.map((section) => (
        <article className="guide-card" id={section.id} key={section.id}>
          <div className="guide-card-head">
            <p className="eyebrow">{section.kicker}</p>
            {section.evidence && <span className={`evidence ${section.evidence}`}>dowody: {section.evidence}</span>}
          </div>
          <h3>{section.title}</h3>
          {section.body.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          {section.rules && (
            <ul className="guide-rules">
              {section.rules.map((rule) => (
                <li key={rule}>
                  <Check size={14} />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </div>
  );
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateMissedTasks(state: AppState): Array<{ task: RoutineTask; missed: number }> {
  const counters = new Map<string, number>();

  Object.values(state.logs).forEach((log) => {
    const dayTasks = tasksForDate(state.tasks, parseDateKey(log.date), log.dayMode, log.dayLevel);
    dayTasks.forEach((task) => {
      if (!log.completedTaskIds.includes(task.id)) {
        counters.set(task.id, (counters.get(task.id) ?? 0) + 1);
      }
    });
  });

  return Array.from(counters.entries())
    .map(([taskId, missed]) => {
      const task = state.tasks.find((item) => item.id === taskId);
      return task ? { task, missed } : null;
    })
    .filter((item): item is { task: RoutineTask; missed: number } => item !== null)
    .sort((a, b) => b.missed - a.missed);
}

function DataView({
  onClearLogs,
  onImport,
  onResetRoutine,
  state
}: {
  onClearLogs: () => void;
  onImport: (state: AppState) => void;
  onResetRoutine: () => void;
  state: AppState;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function importFile(file: File | undefined): void {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const normalized = normalizeImportedState(parsed);
        if (!normalized) {
          window.alert("Plik nie wygląda jak eksport Monk Mode.");
          return;
        }
        onImport(normalized);
      } catch {
        window.alert("Nie udało się odczytać JSON.");
      }
    };
    reader.readAsText(file);
  }

  const remindersPayload = {
    list: "Monk Mode",
    exportedAt: new Date().toISOString(),
    reminders: state.tasks.map((task) => ({
      title: task.title,
      time: task.start,
      durationMinutes: task.durationMinutes,
      repeatDays: task.days.map((day) => dayLabels[day]),
      notes: [
        task.instructions,
        task.checklist?.length ? `Checklist:\n${task.checklist.map((item) => `- ${item}`).join("\n")}` : "",
        task.rationale
      ]
        .filter(Boolean)
        .join("\n\n")
    }))
  };

  return (
    <div className="content-columns">
      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Backup</p>
            <h2>Eksport / import</h2>
          </div>
          <Upload size={22} />
        </div>
        <div className="data-actions">
          <button className="primary-button" onClick={() => downloadJson(state, `monk-mode-backup-${dateKey(new Date())}.json`)}>
            <Download size={16} />
            Eksport pełny
          </button>
          <button className="secondary-button" onClick={() => downloadJson(remindersPayload, `monk-mode-reminders-${dateKey(new Date())}.json`)}>
            <Download size={16} />
            Eksport pod przypomnienia
          </button>
          <button className="secondary-button" onClick={() => inputRef.current?.click()}>
            <Upload size={16} />
            Import JSON
          </button>
          <input
            accept="application/json,.json"
            hidden
            ref={inputRef}
            type="file"
            onChange={(event) => importFile(event.target.files?.[0])}
          />
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Dane lokalne</p>
            <h2>Operacje</h2>
          </div>
          <Trash2 size={22} />
        </div>
        <div className="data-actions">
          <button className="secondary-button" onClick={onResetRoutine}>
            <RefreshCcw size={16} />
            Reset rutyny
          </button>
          <button className="danger-button" onClick={onClearLogs}>
            <Trash2 size={16} />
            Wyczyść logi
          </button>
        </div>
      </section>
    </div>
  );
}

function TaskEditor({ onClose, onSave, task }: { onClose: () => void; onSave: (task: RoutineTask) => void; task: RoutineTask }) {
  const [draft, setDraft] = useState<RoutineTask>(task);
  const [checklistText, setChecklistText] = useState(() => (task.checklist ?? []).join("\n"));

  function update<K extends keyof RoutineTask>(key: K, value: RoutineTask[K]): void {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function toggleDay(day: number): void {
    setDraft((current) => {
      const hasDay = current.days.includes(day);
      return {
        ...current,
        days: hasDay ? current.days.filter((item) => item !== day) : [...current.days, day].sort()
      };
    });
  }

  function submit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!draft.title.trim()) {
      return;
    }
    onSave({
      ...draft,
      title: draft.title.trim(),
      durationMinutes: clampNumber(Number(draft.durationMinutes), 1, 720),
      weight: clampNumber(Number(draft.weight), 1, 10),
      days: draft.days.length > 0 ? draft.days : [new Date().getDay()],
      minimum: draft.minimum?.trim() ? draft.minimum.trim() : undefined,
      checklist: checklistText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
    });
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal" onSubmit={submit}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">Blok</p>
            <h2>Edycja</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="form-grid">
          <label className="field wide">
            <span>Nazwa</span>
            <input value={draft.title} onChange={(event) => update("title", event.target.value)} />
          </label>

          <label className="field">
            <span>Kategoria</span>
            <select value={draft.category} onChange={(event) => update("category", event.target.value as TaskCategory)}>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Priorytet</span>
            <select value={draft.priority} onChange={(event) => update("priority", event.target.value as TaskPriority)}>
              {Object.entries(priorityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Start</span>
            <input type="time" value={draft.start} onChange={(event) => update("start", event.target.value)} />
          </label>

          <label className="field">
            <span>Koniec</span>
            <input type="time" value={draft.end ?? ""} onChange={(event) => update("end", event.target.value || undefined)} />
          </label>

          <label className="field">
            <span>Czas min</span>
            <input
              min="1"
              type="number"
              value={draft.durationMinutes}
              onChange={(event) => update("durationMinutes", Number(event.target.value))}
            />
          </label>

          <label className="field">
            <span>Waga</span>
            <input min="1" max="10" type="number" value={draft.weight} onChange={(event) => update("weight", Number(event.target.value))} />
          </label>

          <div className="field wide">
            <span>Dni</span>
            <div className="day-picker">
              {dayLabels.map((label, index) => (
                <button className={draft.days.includes(index) ? "selected" : ""} key={label} type="button" onClick={() => toggleDay(index)}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label className="field wide">
            <span>Akcja</span>
            <textarea value={draft.instructions} onChange={(event) => update("instructions", event.target.value)} />
          </label>

          <label className="field wide">
            <span>Wersja minimum (P1) — puste = blok znika w P1</span>
            <textarea
              className="minimum-editor"
              placeholder="Np. 25 min nad jednym zadaniem, telefon w innym pokoju."
              value={draft.minimum ?? ""}
              onChange={(event) => update("minimum", event.target.value)}
            />
          </label>

          <label className="field wide">
            <span>Checklist</span>
            <textarea
              className="checklist-editor"
              placeholder="Jedna pozycja na linię"
              value={checklistText}
              onChange={(event) => setChecklistText(event.target.value)}
            />
          </label>

          <label className="field wide">
            <span>Mechanizm</span>
            <textarea value={draft.rationale} onChange={(event) => update("rationale", event.target.value)} />
          </label>
        </div>

        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            Zamknij
          </button>
          <button className="primary-button" type="submit">
            <Save size={16} />
            Zapisz
          </button>
        </div>
      </form>
    </div>
  );
}

export default App;
