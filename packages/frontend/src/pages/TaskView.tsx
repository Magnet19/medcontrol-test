import { useParams } from 'react-router-dom';
import { useTaskPolling } from '@/hooks/useTaskPolling';
import { taskDownloadUrl } from '@/lib/api';
import { Card, Button } from '@/components/ui';

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-slate-200 text-slate-700',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export function TaskView() {
  const { taskId } = useParams<{ taskId: string }>();
  const { task, error } = useTaskPolling(taskId);

  if (error) return <div className="p-6 text-red-600">Ошибка: {error.message}</div>;
  if (!task) return <div className="p-6 text-slate-500">Загрузка…</div>;

  const isCompleted = task.status === 'completed';

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Card className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Задача {task.id}</h1>
          <p className="text-sm text-slate-500">Отчёт: {task.reportId}</p>
        </div>
        <div>
          <span
            className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
              STATUS_COLOR[task.status] ?? 'bg-slate-200'
            }`}
          >
            {task.status}
          </span>
        </div>
        {task.status === 'failed' && task.error && (
          <pre className="overflow-auto rounded bg-red-50 p-3 text-sm text-red-700">
            {task.error}
          </pre>
        )}
        <div>
          <a
            href={isCompleted ? taskDownloadUrl(task.id) : undefined}
            aria-disabled={!isCompleted}
            onClick={(e) => {
              if (!isCompleted) e.preventDefault();
            }}
          >
            <Button disabled={!isCompleted}>Скачать</Button>
          </a>
        </div>
      </Card>
    </div>
  );
}
