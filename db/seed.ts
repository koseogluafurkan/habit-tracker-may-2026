import { generateId } from '@/utils/dates';

import { getSnapshot, updateSnapshot } from './idb';

/**
 * Default lifestyle metrics, including Sprint 4 "advanced correlation" triple:
 *   - Sleep Hours
 *   - Morning Activation
 *   - Evening Lost Time
 *
 * These three are highlighted in graphs.tsx for the triple-correlation view.
 */
const DEFAULT_METRICS = [
  // Sprint 4 triple — kept first so they're the default selection
  { name: 'Sleep Hours',          scale: 'float'   as const, minVal: 0, maxVal: 12,  sortOrder: 0 },
  { name: 'Morning Activation',   scale: 'integer' as const, minVal: 1, maxVal: 10,  sortOrder: 1 },
  { name: 'Evening Lost Time',    scale: 'float'   as const, minVal: 0, maxVal: 8,   sortOrder: 2 },
  // Generic lifestyle metrics
  { name: 'Mood',                 scale: 'integer' as const, minVal: 1, maxVal: 10,  sortOrder: 3 },
  { name: 'Stress',               scale: 'integer' as const, minVal: 1, maxVal: 10,  sortOrder: 4 },
  { name: 'Pages Read',           scale: 'integer' as const, minVal: 0, maxVal: 100, sortOrder: 5 },
  { name: 'Screen Time (hrs)',    scale: 'float'   as const, minVal: 0, maxVal: 16,  sortOrder: 6 },
  { name: 'Deep Work (hrs)',      scale: 'float'   as const, minVal: 0, maxVal: 12,  sortOrder: 7 },
];

export async function seedDefaultMetrics() {
  const snapshot = await getSnapshot();
  if (snapshot.metricDefinitions.length > 0) return;

  await updateSnapshot((s) => ({
    ...s,
    metricDefinitions: DEFAULT_METRICS.map((m) => ({
      id: generateId(),
      name: m.name,
      scale: m.scale,
      minVal: m.minVal,
      maxVal: m.maxVal,
      sortOrder: m.sortOrder,
      description: null,
    })),
  }));
}
