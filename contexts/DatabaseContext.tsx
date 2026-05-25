import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { JournalTheme } from '@/constants/theme';
import { initDatabase } from '@/db/client';
import { seedDefaultMetrics } from '@/db/seed';

type DatabaseContextValue = {
  ready: boolean;
  refreshKey: number;
  refresh: () => void;
};

const DatabaseContext = createContext<DatabaseContextValue>({
  ready: false,
  refreshKey: 0,
  refresh: () => {},
});

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await initDatabase();
        await seedDefaultMetrics();
        if (mounted) setReady(true);
      } catch (e) {
        console.error('Database init failed:', e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={JournalTheme.accent} />
      </View>
    );
  }

  return (
    <DatabaseContext.Provider value={{ ready, refreshKey, refresh }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  return useContext(DatabaseContext);
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: JournalTheme.background,
  },
});
