import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link, NavLink } from "react-router-dom";
import { ReportsCatalog } from "@/pages/ReportsCatalog";
import { RunReport } from "@/pages/RunReport";
import { TaskView } from "@/pages/TaskView";
import { TasksList } from "@/pages/TasksList";

const qc = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

export function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <header className="border-b bg-white px-6 py-3 flex items-center gap-6">
          <NavLink to="/" className="text-lg font-semibold text-brand">
            Report Platform
          </NavLink>
          <nav className="flex gap-4 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive
                  ? "font-semibold text-brand"
                  : "font-semibold text-slate-600 hover:text-brand"
              }
            >
              Каталог отчётов
            </NavLink>
            <NavLink
              to="/tasks"
              className={({ isActive }) =>
                isActive
                  ? "font-semibold text-brand"
                  : "font-semibold text-slate-600 hover:text-brand"
              }
            >
              Задачи
            </NavLink>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<ReportsCatalog />} />
          <Route path="/reports/:id" element={<RunReport />} />
          <Route path="/tasks" element={<TasksList />} />
          <Route path="/tasks/:taskId" element={<TaskView />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
