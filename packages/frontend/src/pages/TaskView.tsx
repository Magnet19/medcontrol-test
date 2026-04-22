import { useParams } from 'react-router-dom';
import { useTaskPolling } from '@/hooks/useTaskPolling';
import { taskDownloadUrl } from '@/lib/api';
import { Card, Button } from '@/components/ui';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { TASK_STATUS_LABEL, TASK_STATUS_COLOR } from '@/lib/taskStatus';

export function TaskView() {
  const { taskId } = useParams<{ taskId: string }>();
  const { task, error } = useTaskPolling(taskId);

  if (error) return <div className="p-6 text-red-600">Ошибка: {error.message}</div>;
  if (!task) return <div className="p-6 text-slate-500">Загрузка…</div>;

  const isCompleted = task.status === 'completed';

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Breadcrumbs items={[{ label: 'Задачи', to: '/tasks' }, { label: `Задача ${task.id}` }]} />
      <Card className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Задача {task.id}</h1>
          <p className="text-sm text-slate-500">Отчёт: {task.reportId}</p>
        </div>
        <div>
          <span
            className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
              TASK_STATUS_COLOR[task.status] ?? 'bg-slate-200'
            }`}
          >
            {TASK_STATUS_LABEL[task.status] ?? task.status}
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
