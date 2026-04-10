import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCreateTodo } from './useCreateTodo';

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { qc, wrapper };
}

describe('useCreateTodo', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('isError is false after successful mutation', async () => {
    const newTodo = {
      id: 1,
      text: 'Test',
      completed: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => newTodo,
    } as unknown as Response);

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useCreateTodo(), { wrapper });

    act(() => {
      result.current.mutate('Test');
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
    const { result } = renderHook(() => useCreateTodo(), { wrapper });

    act(() => {
      result.current.mutate('Test');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('adds an optimistic item to the cache before the request resolves', async () => {
    const existing = [
      { id: 1, text: 'Existing', completed: false, createdAt: '2026-01-01T00:00:00.000Z' },
    ];

    // Keep the POST pending so we can inspect the cache mid-flight
    let resolvePost!: () => void;
    mockFetch.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolvePost = () =>
          resolve({
            ok: true,
            status: 201,
            json: async () => ({
              id: 2,
              text: 'New task',
              completed: false,
              createdAt: '2026-01-01T00:00:00.000Z',
            }),
          } as unknown as Response);
      })
    );

    const { qc, wrapper } = makeWrapper();
    qc.setQueryData(['todos'], existing);

    const { result } = renderHook(() => useCreateTodo(), { wrapper });

    act(() => {
      result.current.mutate('New task');
    });

    // Wait for onMutate to complete (cancelQueries is async) and optimistic item to appear
    await waitFor(() => {
      const data = qc.getQueryData<{ id: number; text: string }[]>(['todos']);
      expect(data?.[0].text).toBe('New task');
    });
    expect(qc.getQueryData<{ id: number }[]>(['todos'])?.[0].id).toBeLessThan(0);

    resolvePost();
  });

  it('rolls back the optimistic update on error', async () => {
    const existing = [
      { id: 1, text: 'Existing', completed: false, createdAt: '2026-01-01T00:00:00.000Z' },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'fail' }),
    } as unknown as Response);

    const { qc, wrapper } = makeWrapper();
    qc.setQueryData(['todos'], existing);

    const { result } = renderHook(() => useCreateTodo(), { wrapper });

    act(() => {
      result.current.mutate('New task');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(qc.getQueryData(['todos'])).toEqual(existing);
  });
});
