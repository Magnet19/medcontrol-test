import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listTasks, taskDownloadUrl } from '@/lib/api';
import { TASK_STATUS_LABEL, TASK_STATUS_COLOR } from '@/lib/taskStatus';
import { Loader } from '@/components/ui';

export function TasksList() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => listTasks({ limit: 50 }),
    refetchInterval: 3000,
  });

  if (isLoading) return <div className="p-6 flex items-center justify-center"><Loader /></div>;
  if (error) return <div className="p-6 text-red-600">Ошибка: {(error as Error).message}</div>;

  const tasks = data?.items ?? [];

  if (tasks.length === 0) {
    return (
      <div className="p-6 text-slate-500">
        Нет запущенных задач. <Link to="/" className="text-brand underline">Запустить отчёт</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-xl font-semibold">Задачи</h1>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">ID задачи</th>
              <th className="px-4 py-3">Отчёт</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Создана</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{task.id}</td>
                <td className="px-4 py-3 text-slate-700">{task.reportId}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                      TASK_STATUS_COLOR[task.status] ?? 'bg-slate-200'
                    }`}
                  >
                    {TASK_STATUS_LABEL[task.status] ?? task.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(task.createdAt).toLocaleString('ru-RU')}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {task.status === 'completed' && (
                      <a
                        href={taskDownloadUrl(task.id)}
                        className="text-slate-600 hover:text-brand hover:underline"
                      >
                        Скачать
                      </a>
                    )}
                    <Link
                      to={`/tasks/${task.id}`}
                      className="text-brand hover:underline"
                    >
                      Открыть →
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
