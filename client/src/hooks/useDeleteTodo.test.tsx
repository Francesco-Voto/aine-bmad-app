import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDeleteTodo } from './useDeleteTodo';

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { qc, wrapper };
}

describe('useDeleteTodo', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('isError is false after successful mutation', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => ({}),
    } as unknown as Response);

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDeleteTodo(), { wrapper });

    act(() => {
      result.current.mutate(1);
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
    const { result } = renderHook(() => useDeleteTodo(), { wrapper });

    act(() => {
      result.current.mutate(1);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('removes item from cache optimistically', async () => {
    const existing = [
      { id: 1, text: 'Task 1', completed: false, createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 2, text: 'Task 2', completed: false, createdAt: '2026-01-01T00:00:00.000Z' },
    ];

    let resolveDelete!: () => void;
    mockFetch.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveDelete = () =>
          resolve({ ok: true, status: 204, json: async () => ({}) } as unknown as Response);
      })
    );

    const { qc, wrapper } = makeWrapper();
    qc.setQueryData(['todos'], existing);

    const { result } = renderHook(() => useDeleteTodo(), { wrapper });

    act(() => {
      result.current.mutate(1);
    });

    await waitFor(() => {
      const data = qc.getQueryData<{ id: number }[]>(['todos']);
      expect(data?.some((t) => t.id === 1)).toBe(false);
    });

    resolveDelete();
  });

  it('rolls back the cache on error', async () => {
    const existing = [
      { id: 1, text: 'Task 1', completed: false, createdAt: '2026-01-01T00:00:00.000Z' },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'fail' }),
    } as unknown as Response);

    const { qc, wrapper } = makeWrapper();
    qc.setQueryData(['todos'], existing);

    const { result } = renderHook(() => useDeleteTodo(), { wrapper });

    act(() => {
      result.current.mutate(1);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(qc.getQueryData(['todos'])).toEqual(existing);
  });
});
