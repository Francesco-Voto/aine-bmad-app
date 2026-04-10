import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTodo, deleteTodo, getTodos, toggleTodo } from './todos';
import { ApiError } from './types';

const TODO_1 = { id: 1, text: 'Test', completed: false, createdAt: '2026-01-01T00:00:00.000Z' };

function mockOk(body: unknown, status = 200) {
  return {
    ok: true,
    status,
    json: async () => body,
  } as unknown as Response;
}

function mockError(status: number, message: string) {
  return {
    ok: false,
    status,
    json: async () => ({ message }),
  } as unknown as Response;
}

describe('API wrappers', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getTodos', () => {
    it('calls GET /api/todos and returns Todo[]', async () => {
      mockFetch.mockResolvedValueOnce(mockOk([TODO_1]));
      const result = await getTodos();
      expect(mockFetch).toHaveBeenCalledWith('/api/todos');
      expect(result).toEqual([TODO_1]);
    });
  });

  describe('createTodo', () => {
    it('calls POST /api/todos with correct body and returns Todo', async () => {
      const created = { ...TODO_1, id: 2, text: 'New' };
      mockFetch.mockResolvedValueOnce(mockOk(created, 201));
      const result = await createTodo('New');
      expect(mockFetch).toHaveBeenCalledWith('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'New' }),
      });
      expect(result).toEqual(created);
    });
  });

  describe('toggleTodo', () => {
    it('calls PATCH /api/todos/:id with completed flag', async () => {
      const updated = { ...TODO_1, completed: true };
      mockFetch.mockResolvedValueOnce(mockOk(updated));
      const result = await toggleTodo(1, true);
      expect(mockFetch).toHaveBeenCalledWith('/api/todos/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      });
      expect(result).toEqual(updated);
    });
  });

  describe('deleteTodo', () => {
    it('calls DELETE /api/todos/:id and returns undefined', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({}, 204));
      const result = await deleteTodo(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/todos/1', { method: 'DELETE' });
      expect(result).toBeUndefined();
    });
  });

  describe('error path (throwIfNotOk)', () => {
    it('throws ApiError with status and server message on non-2xx', async () => {
      mockFetch.mockResolvedValueOnce(mockError(404, 'Todo 99 not found'));
      await expect(getTodos()).rejects.toSatisfy(
        (e: unknown) => e instanceof ApiError && e.status === 404 && e.message === 'Todo 99 not found'
      );
    });
  });
});
