import { generateId } from '@/utils/dates';

import { getSnapshot, updateSnapshot } from './idb';

const DEFAULT_METRICS = [
  { name: 'Mood', scale: 'integer' as const, minVal: 1, maxVal: 10, sortOrder: 0 },
  { name: 'Stress', scale: 'integer' as const, minVal: 1, maxVal: 10, sortOrder: 1 },
  { name: 'Pages Read', scale: 'integer' as const, minVal: 0, maxVal: 100, sortOrder: 2 },
  { name: 'Screen Time (hrs)', scale: 'float' as const, minVal: 0, maxVal: 16, sortOrder: 3 },
  { name: 'Deep Work (hrs)', scale: 'float' as const, minVal: 0, maxVal: 12, sortOrder: 4 },
  { name: 'Phone Pickups', scale: 'integer' as const, minVal: 0, maxVal: 200, sortOrder: 5 },
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
    })),
  }));
}
