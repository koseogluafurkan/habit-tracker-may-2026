import type {
  DayEntry,
  Habit,
  HabitLog,
  MetricDefinition,
  MetricLog,
  MonthConfig,
} from './schema';

export type DatabaseSnapshot = {
  habits: Habit[];
  dayEntries: DayEntry[];
  habitLogs: HabitLog[];
  metricDefinitions: MetricDefinition[];
  metricLogs: MetricLog[];
  monthConfig: MonthConfig[];
};

const DB_NAME = 'habit-tracker-pwa';
const DB_VERSION = 1;
const STORE_NAME = 'snapshot';

const emptySnapshot = (): DatabaseSnapshot => ({
  habits: [],
  dayEntries: [],
  habitLogs: [],
  metricDefinitions: [],
  metricLogs: [],
  monthConfig: [],
});

let memoryCache: DatabaseSnapshot | null = null;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function readSnapshot(): Promise<DatabaseSnapshot> {
  if (memoryCache) return memoryCache;

  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get('data');

    request.onerror = () => reject(request.error ?? new Error('Failed to read data'));
    request.onsuccess = () => {
      const raw = (request.result as DatabaseSnapshot | undefined) ?? emptySnapshot();
      memoryCache = {
        ...raw,
        dayEntries: raw.dayEntries.map((entry) => ({
          ...entry,
          dayReminder: entry.dayReminder ?? null,
        })),
        // migrate older snapshots that may lack hyperFocus
        monthConfig: raw.monthConfig.map((c) => ({
          ...c,
          hyperFocus: (c as any).hyperFocus ?? null,
        })),
      };
      resolve(memoryCache);
    };
  });
}

async function writeSnapshot(snapshot: DatabaseSnapshot): Promise<void> {
  memoryCache = snapshot;
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(snapshot, 'data');

    request.onerror = () => reject(request.error ?? new Error('Failed to write data'));
    request.onsuccess = () => resolve();
  });
}

export async function initIdb(): Promise<void> {
  await readSnapshot();
}

export async function getSnapshot(): Promise<DatabaseSnapshot> {
  return readSnapshot();
}

export async function updateSnapshot(
  updater: (snapshot: DatabaseSnapshot) => DatabaseSnapshot
): Promise<DatabaseSnapshot> {
  const current = await readSnapshot();
  const next = updater(JSON.parse(JSON.stringify(current)) as DatabaseSnapshot);
  await writeSnapshot(next);
  return next;
}

export async function replaceSnapshot(snapshot: DatabaseSnapshot): Promise<void> {
  await writeSnapshot(snapshot);
}
