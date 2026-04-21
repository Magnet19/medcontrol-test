import { useEffect, useState } from 'react';
import { getTask } from '@/lib/api';
import type { TaskDTO } from '@report-platform/shared';

export function useTaskPolling(taskId: string | undefined, intervalMs = 3000) {
  const [task, setTask] = useState<TaskDTO | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    let handle: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      try {
        const t = await getTask(taskId!);
        if (cancelled) return;
        setTask(t);
        if (t.status === 'completed' || t.status === 'failed') return;
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      }
      if (!cancelled) handle = setTimeout(tick, intervalMs);
    }
    tick();

    return () => {
      cancelled = true;
      if (handle) clearTimeout(handle);
    };
  }, [taskId, intervalMs]);

  return { task, error };
}
