import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listReports } from '@/lib/api';
import { Card, Button } from '@/components/ui';

export function ReportsCatalog() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['reports'],
    queryFn: listReports,
  });

  if (isLoading) return <div className="p-6 text-slate-500">Загрузка…</div>;
  if (error) return <div className="p-6 text-red-600">Ошибка: {String(error)}</div>;

  const reports = data ?? [];
  if (reports.length === 0) {
    return <div className="p-6 text-slate-500">Нет отчётов</div>;
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Каталог отчётов</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {reports.map((r) => (
          <Card key={r.id} className="flex flex-col gap-3">
            <div>
              <h2 className="text-lg font-semibold">{r.name}</h2>
              <p className="mt-1 text-sm text-slate-600">{r.description}</p>
              <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
                Форматы: {r.formats.join(', ')}
              </p>
            </div>
            <div className="mt-auto">
              <Link to={`/reports/${r.id}`}>
                <Button>Запустить</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
