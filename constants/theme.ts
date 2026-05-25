// ─── Design token system ─────────────────────────────────────────────────
// Single source of truth for all visual values.
// Ported from design_handoff_journal_redesign/source/theme.jsx

export type PaperToneKey = 'cream' | 'linen' | 'kraft' | 'midnight';
export type DensityKey = 'relaxed' | 'compact';
export type AestheticKey = 'bound' | 'notebook' | 'grid';

export type PaperTone = {
  paper: string;
  paperDeep: string;
  paperHi: string;
  text: string;
  faded: string;
  rule: string;
  accent: string;
  dark: boolean;
  label: string;
};

export const PAPER_TONES: Record<PaperToneKey, PaperTone> = {
  cream: {
    paper: '#F4ECDD', paperDeep: '#EDE2CC', paperHi: '#FAF4E5',
    text: '#1A1410', faded: '#6B5E4F', rule: '#D9CFBC', accent: '#8B6F47',
    dark: false, label: 'Warm cream',
  },
  linen: {
    paper: '#F0EBDD', paperDeep: '#E7DFCB', paperHi: '#F8F2E3',
    text: '#1F1A14', faded: '#76695A', rule: '#D6CCB8', accent: '#7A6240',
    dark: false, label: 'Linen',
  },
  kraft: {
    paper: '#E5D4AC', paperDeep: '#D9C691', paperHi: '#EEDFB8',
    text: '#241A0E', faded: '#6F5A36', rule: '#C5B286', accent: '#7A5824',
    dark: false, label: 'Kraft',
  },
  midnight: {
    paper: '#1F1A14', paperDeep: '#15110C', paperHi: '#2A2218',
    text: '#EDE0C7', faded: '#9F8E73', rule: '#3A3128', accent: '#D8B66A',
    dark: true, label: 'Midnight',
  },
};

export type InkColors = {
  black: string; // from tone.text — non-negotiable habits
  blue: string;  // positive habits
  red: string;   // bad habits
};

export const INK_BLUE = '#1E3A8A';
export const INK_RED  = '#8B1A1A';

export type SpacingScale = {
  xs: number; sm: number; md: number;
  lg: number; xl: number; section: number;
};

export type FontSizeScale = {
  meta: number; body: number; lead: number;
  h3: number; h2: number; h1: number; hero: number;
};

export const SPACING: Record<DensityKey, SpacingScale> = {
  relaxed: { xs: 6,  sm: 10, md: 14, lg: 22, xl: 32, section: 26 },
  compact: { xs: 4,  sm: 8,  md: 12, lg: 18, xl: 24, section: 18 },
};

export const FONT_SIZE: Record<DensityKey, FontSizeScale> = {
  relaxed: { meta: 10, body: 16, lead: 18, h3: 18, h2: 22, h1: 30, hero: 56 },
  compact: { meta: 9,  body: 14.5, lead: 16, h3: 16, h2: 19, h1: 26, hero: 44 },
};

export const FONT_HEADING = 'Georgia, "Times New Roman", serif';
export const FONT_BODY    = 'Georgia, "Times New Roman", serif';
export const FONT_MONO    = '"IBMPlexMono", "Courier New", monospace';

// Fully-resolved theme object — what useTheme() returns
export type ResolvedTheme = PaperTone & {
  ink: InkColors;
  sp: SpacingScale;
  fs: FontSizeScale;
  density: DensityKey;
  aesthetic: AestheticKey;
};

export function resolveTheme(
  toneKey: PaperToneKey,
  density: DensityKey,
  aesthetic: AestheticKey,
): ResolvedTheme {
  const tone = PAPER_TONES[toneKey];
  return {
    ...tone,
    ink: { black: tone.text, blue: INK_BLUE, red: INK_RED },
    sp: SPACING[density],
    fs: FONT_SIZE[density],
    density,
    aesthetic,
  };
}

// ─── Legacy exports (kept for backward compat with existing components) ───
// Remove once all screens are migrated to the new token system.

export const JournalTheme = {
  // map to cream tone defaults
  background: PAPER_TONES.cream.paper,
  gridLine: PAPER_TONES.cream.rule,
  gridLineBold: PAPER_TONES.cream.paperDeep,
  text: PAPER_TONES.cream.text,
  textMuted: PAPER_TONES.cream.faded,
  border: PAPER_TONES.cream.rule,
  pen: {
    black: PAPER_TONES.cream.text,
    blue: INK_BLUE,
    red: INK_RED,
  },
  ink: {
    black: `rgba(26,20,16,0.15)`,
    blue:  `rgba(30,58,138,0.15)`,
    red:   `rgba(139,26,26,0.15)`,
  },
  accent:  PAPER_TONES.cream.accent,
  success: '#2D6A4F',
  warning: '#B45309',
};

export const GRID_CELL_SIZE = 18;
export const GRID_MAJOR_EVERY = 5;

export type HabitColor = 'black' | 'blue' | 'red';
export type HabitType  = 'boolean' | 'numeric';
export type MetricScale = 'integer' | 'float';

export const HABIT_COLORS: { value: HabitColor; label: string }[] = [
  { value: 'black', label: 'Non-negotiable' },
  { value: 'blue',  label: 'Positive habit' },
  { value: 'red',   label: 'Bad habit' },
];

export const HABIT_TYPES: { value: HabitType; label: string }[] = [
  { value: 'boolean', label: 'Tick mark' },
  { value: 'numeric', label: 'Number (e.g. weight)' },
];

export function getPenColor(color: HabitColor): string {
  if (color === 'blue') return INK_BLUE;
  if (color === 'red')  return INK_RED;
  return PAPER_TONES.cream.text;
}

export function getInkColor(color: HabitColor): string {
  if (color === 'blue') return 'rgba(30,58,138,0.15)';
  if (color === 'red')  return 'rgba(139,26,26,0.15)';
  return 'rgba(26,20,16,0.15)';
}

export function habitLabel(color: HabitColor): string {
  if (color === 'blue') return 'POSITIVE';
  if (color === 'red')  return 'BAD HABIT';
  return 'NON-NEGOTIABLE';
}

// Daily screen rotating quotes
export const DAILY_QUOTES: string[] = [
  'A day used well is a vote for the person you want to become.',
  'The page wants a number — just one win is enough.',
  'What you do today is enough.',
  'Small marks compound. Show up again.',
  'The ritual is the point. Everything else follows.',
  'One win. One mark. One rest. That\'s the whole system.',
  'Consistency is not perfection — it\'s just showing up.',
  'The night is not the only free time.',
  'You don\'t need a perfect day. You need a real one.',
  'Write it down. It happened. That\'s enough.',
];
