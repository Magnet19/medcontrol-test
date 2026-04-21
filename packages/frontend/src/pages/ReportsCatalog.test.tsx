import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ReportsCatalog } from './ReportsCatalog';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderWith(initialPath = '/') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/" element={<ReportsCatalog />} />
          <Route path="/reports/:id" element={<div>RUN PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('<ReportsCatalog />', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('renders two cards when API returns two reports', async () => {
    server.use(
      http.get('/api/reports', () =>
        HttpResponse.json([
          {
            id: 'a',
            name: 'Alpha',
            description: 'aaa',
            formats: ['xlsx'],
            parametersSchema: null,
          },
          {
            id: 'b',
            name: 'Beta',
            description: 'bbb',
            formats: ['pdf'],
            parametersSchema: null,
          },
        ]),
      ),
    );
    renderWith();
    await waitFor(() => expect(screen.getByText('Alpha')).toBeInTheDocument());
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Запустить/ })).toHaveLength(2);
  });

  it('clicking Запустить navigates to /reports/:id', async () => {
    server.use(
      http.get('/api/reports', () =>
        HttpResponse.json([
          {
            id: 'alpha',
            name: 'Alpha',
            description: 'a',
            formats: ['xlsx'],
            parametersSchema: null,
          },
        ]),
      ),
    );
    renderWith();
    const btn = await screen.findByRole('button', { name: /Запустить/ });
    await userEvent.click(btn);
    expect(await screen.findByText('RUN PAGE')).toBeInTheDocument();
  });

  it('shows fallback on empty list', async () => {
    server.use(http.get('/api/reports', () => HttpResponse.json([])));
    renderWith();
    await waitFor(() => expect(screen.getByText('Нет отчётов')).toBeInTheDocument());
  });
});
