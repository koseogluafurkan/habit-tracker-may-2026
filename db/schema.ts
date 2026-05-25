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
