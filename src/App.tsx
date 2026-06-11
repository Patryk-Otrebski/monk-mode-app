import {
  Activity,
  BarChart3,
  Bed,
  Brain,
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
  Home,
  LayoutDashboard,
  ListChecks,
  Moon,
  Pause,
  Play,
  Plus,
  RefreshCcw,
  Save,
  Settings,
  ShieldCheck,
  Sun,
  Target,
  Trash2,
  Upload,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { defaultSettings, defaultTasks, timerPresets } from "./data/defaultPlan";
import { addDays, currentTimeLabel, dateKey, formatLongDate, formatShortDate, minutesFromTime, parseDateKey } from "./lib/date";
import { calculateScore, calculateStreak, completionCount, criticalMisses, tasksForDate, weeklyScores } from "./lib/scoring";
import { createDefaultState, createEmptyLog, loadState, normalizeImportedState, saveState } from "./lib/storage";
import type { AppSettings, AppState, DayLog, DayMode, RoutineTask, TaskCategory, TaskPriority, TimerPreset } from "./types";

type View = "today" | "planner" | "stats" | "data";

const dayLabels = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"];

const categoryLabels: Record<TaskCategory, string> = {
  morning: "Rano",
  deepWork: "Skupienie",
  work: "Etat",
  training: "Trening",
  home: "Dom",
  admin: "Administracja",
  evening: "Wieczór",
  health: "Zdrowie"
};

const priorityLabels: Record<TaskPriority, string> = {
  critical: "krytyczne",
  standard: "standard",
  optional: "opcjonalne"
};

const phaseLabels: Record<string, string> = {
  morning: "Rano",
  workday: "Etat",
  afterWork: "Po pracy",
  night: "Sen"
};

const dayModeLabels: Record<DayMode, string> = {
  auto: "Auto",
  training: "Trening",
  recovery: "Nietreningowy"
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
    case "work":
      return Clock;
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
  const todayTasks = useMemo(() => tasksForDate(state.tasks, selectedDate, log.dayMode), [state.tasks, selectedDate, log.dayMode]);
  const score = calculateScore(todayTasks, log);
  const counts = completionCount(todayTasks, log);
  const misses = criticalMisses(todayTasks, log);
  const streak = calculateStreak(state, selectedDate);

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
            <ShieldCheck size={24} />
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
          <NavButton active={view === "data"} icon={Settings} label="Dane" onClick={() => setView("data")} />
        </nav>

        <div className="sidebar-footer">
          <span>Cel dnia</span>
          <strong>{state.settings.scoreTarget}%</strong>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Tryb operacyjny</p>
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
            onToggleTask={toggleTask}
            onUpdateLog={updateLog}
            score={score}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            state={state}
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

        {view === "stats" && <StatsView selectedDate={selectedDate} state={state} />}

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
      return "Statystyki";
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
  onToggleTask,
  onUpdateLog,
  score,
  selectedDate,
  setSelectedDate,
  state,
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
  onToggleTask: (taskId: string) => void;
  onUpdateLog: (mutator: (current: DayLog) => DayLog) => void;
  score: number;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  state: AppState;
  streak: number;
  tasks: RoutineTask[];
}) {
  const groupedTasks = groupTasks(tasks);

  return (
    <div className="page-grid">
      <CommandCenter log={log} score={score} selectedDate={selectedDate} settings={state.settings} tasks={tasks} />

      <section className="status-grid">
        <MetricCard label="Wynik" value={`${score}%`} tone={score >= state.settings.scoreTarget ? "good" : "warn"} icon={ShieldCheck} />
        <MetricCard label="Bloki" value={`${counts.completed}/${counts.total}`} tone="neutral" icon={Check} />
        <MetricCard label="Streak" value={`${streak}`} tone="hot" icon={Flame} />
        <MetricCard label="Ryzyka" value={`${misses}`} tone={misses === 0 ? "good" : "bad"} icon={Circle} />
      </section>

      <WeekStrip selectedDate={selectedDate} setSelectedDate={setSelectedDate} state={state} />
      <DayModeSwitch
        mode={log.dayMode ?? "auto"}
        onChange={(mode) =>
          onUpdateLog((currentLog) => ({
            ...currentLog,
            dayMode: mode
          }))
        }
      />

      <div className="content-columns">
        <section className="panel task-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Lista wykonania</p>
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
          <ProtocolPanel log={log} score={score} target={state.settings.scoreTarget} tasks={tasks} />
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
  const deepWork = tasks.find((task) => task.id === "deep-work");
  const prepareWork = tasks.find((task) => task.id === "prepare-work");
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
            Krytyczne: {criticalDone}/{criticalTasks.length}
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
          <Anchor label="Deep Work" value={deepWork ? `${deepWork.start}-${deepWork.end}` : "-"} />
          <Anchor label="Wyjście" value={prepareWork ? `${prepareWork.start}-${prepareWork.end}` : "-"} />
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
      description: "ruch + lekki blok",
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

function ProtocolPanel({
  log,
  score,
  target,
  tasks
}: {
  log: DayLog;
  score: number;
  target: number;
  tasks: RoutineTask[];
}) {
  const completed = new Set(log.completedTaskIds);
  const anchorTasks = tasks.filter((task) => ["deep-work", "reset-strength", "reset-recovery", "shutdown"].includes(task.id));
  const anchorDone = anchorTasks.filter((task) => completed.has(task.id)).length;
  const mode = score >= target ? "Domykanie" : anchorDone > 0 ? "Odzyskiwanie" : "Start";
  const minimumSteps = [
    "20 min celu bez telefonu",
    "10 min resetu środowiska",
    "Shutdown bez negocjacji"
  ];

  return (
    <section className="panel protocol-panel">
      <div className="panel-head compact">
        <div>
          <p className="eyebrow">Plan odporny</p>
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
        <strong>Plan minimum</strong>
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
  if (minutes < 10 * 60) {
    return "morning";
  }
  if (minutes < 18 * 60) {
    return "workday";
  }
  if (minutes < 22 * 60 + 30) {
    return "afterWork";
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
        const dayLog = state.logs[key] ?? createEmptyLog(key);
        const score = calculateScore(tasksForDate(state.tasks, day, dayLog.dayMode), dayLog);
        const isSelected = key === dateKey(selectedDate);

        return (
          <button className={`week-day ${isSelected ? "selected" : ""}`} key={key} onClick={() => setSelectedDate(day)}>
            <span>{formatShortDate(day)}</span>
            <strong>{score}%</strong>
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
  onDelete,
  onEdit,
  onToggle,
  task
}: {
  completed: boolean;
  onDelete: (taskId: string) => void;
  onEdit: (task: RoutineTask) => void;
  onToggle: (taskId: string) => void;
  task: RoutineTask;
}) {
  const Icon = getCategoryIcon(task.category);
  const checklist = task.checklist ?? [];
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
          <span className={`priority ${task.priority}`}>{priorityLabels[task.priority]}</span>
        </div>
        {task.instructions && <p>{task.instructions}</p>}
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
        {(task.rationale || hiddenChecklistCount > 0) && (
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
          <h2>Notatka</h2>
        </div>
        <Edit3 size={20} />
      </div>
      <textarea
        className="notes"
        placeholder="Wynik dnia, blokada, decyzja na jutro."
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
            <h2>Bloki i daily taski</h2>
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
            <TimeSetting label="Start etatu" value={settings.workStart} onChange={(value) => onUpdateSettings({ workStart: value })} />
            <TimeSetting label="Koniec etatu" value={settings.workEnd} onChange={(value) => onUpdateSettings({ workEnd: value })} />
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

function StatsView({ selectedDate, state }: { selectedDate: Date; state: AppState }) {
  const scores = weeklyScores(state, selectedDate);
  const logs = Object.values(state.logs).sort((a, b) => a.date.localeCompare(b.date));
  const last14 = logs.slice(-14);
  const sleepAverage = average(last14.map((item) => item.metrics.sleepHours));
  const alcoholSum = last14.reduce((sum, item) => sum + item.metrics.alcoholUnits, 0);
  const focusAverage = average(last14.map((item) => item.metrics.focus));
  const missedTasks = calculateMissedTasks(state);

  return (
    <div className="page-grid">
      <section className="status-grid">
        <MetricCard label="Sen 14d" value={`${sleepAverage.toFixed(1)}h`} tone="neutral" icon={Bed} />
        <MetricCard label="Alkohol 14d" value={`${alcoholSum}`} tone={alcoholSum === 0 ? "good" : "bad"} icon={Coffee} />
        <MetricCard label="Focus 14d" value={`${focusAverage.toFixed(1)}/5`} tone="neutral" icon={Brain} />
        <MetricCard label="Logi" value={`${logs.length}`} tone="hot" icon={CalendarDays} />
      </section>

      <div className="content-columns">
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
              <div className="bar-item" key={item.date}>
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
    const dayTasks = tasksForDate(state.tasks, parseDateKey(log.date), log.dayMode);
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
