export async function initDatabase(): Promise<void> {
  const { initIdb } = await import('./idb');
  await initIdb();
}
