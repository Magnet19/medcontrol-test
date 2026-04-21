import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ReportsCatalog } from '@/pages/ReportsCatalog';
import { RunReport } from '@/pages/RunReport';
import { TaskView } from '@/pages/TaskView';

const qc = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

export function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <header className="border-b bg-white px-6 py-3">
          <Link to="/" className="text-lg font-semibold text-brand">
            Report Platform
          </Link>
        </header>
        <Routes>
          <Route path="/" element={<ReportsCatalog />} />
          <Route path="/reports/:id" element={<RunReport />} />
          <Route path="/tasks/:taskId" element={<TaskView />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
