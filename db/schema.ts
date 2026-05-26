export type HabitColor = 'black' | 'blue' | 'red';
export type HabitType = 'boolean' | 'numeric';
export type MetricScale = 'integer' | 'float';

export type Habit = {
  id: string;
  year: number;
  month: number;
  name: string;
  color: HabitColor;
  type: HabitType;
  sortOrder: number;
};

export type DayEntry = {
  id: string;
  date: string;
  memorableMoment: string | null;
  dayReminder: string | null;
  sleepHours: number | null;
  sleepScore: number | null;
};

export type HabitLog = {
  id: string;
  dayEntryId: string;
  habitId: string;
  value: string;
  /** Optional per-day, per-habit freetext note (Sprint 1 add-on) */
  note: string | null;
};

export type MetricDefinition = {
  id: string;
  name: string;
  scale: MetricScale;
  minVal: number;
  maxVal: number;
  sortOrder: number;
};

export type MetricLog = {
  id: string;
  dayEntryId: string;
  metricId: string;
  value: number;
};

export type MonthConfig = {
  id: string;
  year: number;
  month: number;
  nextMonthIdeas: string | null;
  reminderMessage: string | null;
  hyperFocus: string | null;
};

// Sprint 1 — My Foundation
export type PersonalSetupType = 'anti-goal' | 'limiting-belief' | 'yearly-goal';
export type PersonalSetupStatus = 'active' | 'done';
/** Goal horizons used in onboarding wizard for yearly-goal type */
export type GoalHorizon = '6m' | '1y' | '3y' | '5y';

export type PersonalSetup = {
  id: string;
  type: PersonalSetupType;
  text: string;
  sortOrder: number;
  createdAt: string;
  targetDate: string | null;     // optional, for yearly-goal
  status: PersonalSetupStatus;
  goalHorizon: GoalHorizon | null;
};

// ── Sticky Reminders (always visible until dismissed) ─────────────────────
export type StickyReminder = {
  id: string;
  text: string;
  topic: string | null;
  addedDate: string;            // 'YYYY-MM-DD'
  dueDate: string | null;       // info only; doesn't auto-hide
  completed: boolean;
  sortOrder: number;
  createdAt: string;
};

// ── Custom Countdowns (dynamic tab bar items) ─────────────────────────────
export type Countdown = {
  id: string;
  label: string;
  targetDate: string;           // 'YYYY-MM-DD'
  icon: string | null;
  sortOrder: number;
  createdAt: string;
};

// ── User Settings (theme prefs synced across devices) ─────────────────────
export type UserSettings = {
  id: string;                   // always 'singleton'
  toneKey: string;
  density: string;
  aesthetic: string;
  followSystem: boolean;
  updatedAt: string;
};

// ── Morning Routine ────────────────────────────────────────────────────────
export type MorningRoutineItem = {
  id: string;
  text: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
};

export type MorningLog = {
  id: string;
  date: string;                 // 'YYYY-MM-DD'
  itemId: string;
  completed: boolean;
};

export type DayIntention = {
  id: string;
  date: string;                 // 'YYYY-MM-DD'
  intention: string | null;
  updatedAt: string;
};
