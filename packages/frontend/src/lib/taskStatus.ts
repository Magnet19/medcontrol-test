export const TASK_STATUS_LABEL: Record<string, string> = {
  pending: 'Ожидает',
  processing: 'Выполняется',
  completed: 'Завершена',
  failed: 'Ошибка',
};

export const TASK_STATUS_COLOR: Record<string, string> = {
  pending: 'bg-slate-200 text-slate-700',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};
