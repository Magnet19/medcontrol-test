import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useTaskPolling } from './useTaskPolling';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('useTaskPolling', () => {
  it('walks pending → processing → completed via polling', async () => {
    const statuses = ['pending', 'processing', 'completed'];
    let i = 0;
    server.use(
      http.get('/api/tasks/:id', () => {
        const status = statuses[Math.min(i++, statuses.length - 1)];
        return HttpResponse.json({
          id: 't',
          reportId: 'r',
          status,
          parameters: null,
          resultUrl: status === 'completed' ? '/data/t.xlsx' : null,
          error: null,
          createdAt: '2026-04-20T10:00:00Z',
          completedAt: null,
        });
      }),
    );
    const { result } = renderHook(() => useTaskPolling('t', 20));
    await waitFor(() => expect(result.current.task?.status).toBe('completed'), {
      timeout: 2000,
    });
  });
});
