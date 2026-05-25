export const JournalTheme = {
  background: '#FAF8F5',
  gridLine: '#E8E4DF',
  gridLineBold: '#D4CFC8',
  text: '#2C2416',
  textMuted: '#6B6358',
  border: '#D4CFC8',
  pen: {
    black: '#1A1A1A',
    blue: '#2563EB',
    red: '#DC2626',
  },
  ink: {
    black: 'rgba(26, 26, 26, 0.15)',
    blue: 'rgba(37, 99, 235, 0.15)',
    red: 'rgba(220, 38, 38, 0.15)',
  },
  accent: '#8B7355',
  success: '#2D6A4F',
  warning: '#B45309',
};

export const GRID_CELL_SIZE = 18;
export const GRID_MAJOR_EVERY = 5;

export type HabitColor = 'black' | 'blue' | 'red';
export type HabitType = 'boolean' | 'numeric';
export type MetricScale = 'integer' | 'float';

export const HABIT_COLORS: { value: HabitColor; label: string }[] = [
  { value: 'black', label: 'Non-negotiable' },
  { value: 'blue', label: 'Positive habit' },
  { value: 'red', label: 'Bad habit' },
];

export const HABIT_TYPES: { value: HabitType; label: string }[] = [
  { value: 'boolean', label: 'Tick mark' },
  { value: 'numeric', label: 'Number (e.g. weight)' },
];

export function getPenColor(color: HabitColor): string {
  return JournalTheme.pen[color];
}

export function getInkColor(color: HabitColor): string {
  return JournalTheme.ink[color];
}
