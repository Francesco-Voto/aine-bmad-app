import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useToggleTodo } from './useToggleTodo';

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { qc, wrapper };
}

describe('useToggleTodo', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('isError is false after successful mutation', async () => {
    const updated = { id: 1, text: 'Task', completed: true, createdAt: '2026-01-01T00:00:00.000Z' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => updated,
    } as unknown as Response);

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useToggleTodo(), { wrapper });

    act(() => {
      result.current.mutate({ id: 1, completed: true });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isError).toBe(false);
  });

  it('sets isError on failed mutation', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Server error' }),
    } as unknown as Response);

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useToggleTodo(), { wrapper });

    act(() => {
      result.current.mutate({ id: 1, completed: true });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('applies optimistic toggle to cache before response', async () => {
    const existing = [
      { id: 1, text: 'Task', completed: false, createdAt: '2026-01-01T00:00:00.000Z' },
    ];

    let resolveToggle!: () => void;
    mockFetch.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveToggle = () =>
          resolve({
            ok: true,
            status: 200,
            json: async () => ({ ...existing[0], completed: true }),
          } as unknown as Response);
      })
    );

    const { qc, wrapper } = makeWrapper();
    qc.setQueryData(['todos'], existing);

    const { result } = renderHook(() => useToggleTodo(), { wrapper });

    act(() => {
      result.current.mutate({ id: 1, completed: true });
    });

    await waitFor(() => {
      const data = qc.getQueryData<{ id: number; completed: boolean }[]>(['todos']);
      expect(data?.[0].completed).toBe(true);
    });

    resolveToggle();
  });

  it('rolls back the optimistic update on error', async () => {
    const existing = [
      { id: 1, text: 'Task', completed: false, createdAt: '2026-01-01T00:00:00.000Z' },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'fail' }),
    } as unknown as Response);

    const { qc, wrapper } = makeWrapper();
    qc.setQueryData(['todos'], existing);

    const { result } = renderHook(() => useToggleTodo(), { wrapper });

    act(() => {
      result.current.mutate({ id: 1, completed: true });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(qc.getQueryData(['todos'])).toEqual(existing);
  });

  it('does not throw when onError fires with no prior cached data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'fail' }),
    } as unknown as Response);

    // No setQueryData — cache is empty so context.previous will be undefined
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useToggleTodo(), { wrapper });

    act(() => {
      result.current.mutate({ id: 1, completed: true });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    // If we reach here without throwing, the nullish guard on context.previous worked
  });
});
