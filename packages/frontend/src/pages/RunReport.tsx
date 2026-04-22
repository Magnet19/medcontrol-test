import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listReports, runReport } from '@/lib/api';
import { ParametersForm } from '@/components/ParametersForm';
import { Card } from '@/components/ui';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export function RunReport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['reports'], queryFn: listReports });
  const report = useMemo(() => data?.find((r) => r.id === id), [data, id]);

  if (isLoading) return <div className="p-6 text-slate-500">Загрузка…</div>;
  if (!report) return <div className="p-6 text-slate-500">Отчёт не найден</div>;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Breadcrumbs items={[{ label: 'Каталог отчётов', to: '/' }, { label: report.name }]} />
      <Card className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold">{report.name}</h1>
          <p className="text-sm text-slate-600">{report.description}</p>
        </div>
        <ParametersForm
          schema={report.parametersSchema}
          onSubmit={async (parameters) => {
            const { taskId } = await runReport(report.id, { parameters });
            navigate(`/tasks/${taskId}`);
          }}
        />
      </Card>
    </div>
  );
}
