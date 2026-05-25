import { useCallback, useEffect, useState } from 'react';

import { useDatabase } from '@/contexts/DatabaseContext';
import { createMetricDefinition, deleteMetricDefinition, getMetricDefinitions } from '@/db/operations';
import type { MetricDefinition } from '@/db/schema';

export function useMetrics() {
  const { refreshKey, refresh } = useDatabase();
  const [metrics, setMetrics] = useState<MetricDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getMetricDefinitions();
    setMetrics(data);
    setLoading(false);
  }, [refreshKey]);

  useEffect(() => {
    load();
  }, [load]);

  const addMetric = useCallback(
    async (name: string, minVal = 1, maxVal = 10) => {
      await createMetricDefinition({ name, minVal, maxVal });
      refresh();
    },
    [refresh]
  );

  const removeMetric = useCallback(
    async (id: string) => {
      await deleteMetricDefinition(id);
      refresh();
    },
    [refresh]
  );

  return { metrics, loading, addMetric, removeMetric, reload: load };
}
