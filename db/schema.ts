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

export type PersonalSetup = {
  id: string;
  type: PersonalSetupType;
  text: string;
  sortOrder: number;
  createdAt: string;
  targetDate: string | null;     // optional, for yearly-goal
  status: PersonalSetupStatus;
};
