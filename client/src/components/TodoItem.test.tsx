import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TodoItem } from './TodoItem';

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

const activeTodo = {
  id: 1,
  text: 'Buy milk',
  completed: false,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const completedTodo = {
  id: 1,
  text: 'Walk dog',
  completed: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('TodoItem', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders an active item correctly', () => {
    renderWithQuery(<TodoItem todo={activeTodo} />);

    expect(screen.getByText('Buy milk')).toBeDefined();
    expect(screen.getByRole('checkbox', { name: 'Complete: Buy milk' })).toBeDefined();
    expect(screen.getByLabelText('Delete: Buy milk')).toBeDefined();

    const text = screen.getByText('Buy milk');
    expect(text.style.textDecoration).not.toBe('line-through');
  });

  it('renders a completed item with strikethrough and reduced opacity', () => {
    renderWithQuery(<TodoItem todo={completedTodo} />);

    const text = screen.getByText('Walk dog');
    expect(text.style.textDecoration).toBe('line-through');
    expect(text.style.opacity).toBe('0.6');
    expect(text.style.color).toBe('var(--color-text-disabled)');
  });

  it('calls PATCH API with correct payload when checkbox is clicked', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ...activeTodo, completed: true }),
    } as unknown as Response);

    // Seed cache with current todo so optimistic update has data to work with
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    qc.setQueryData(['todos'], [activeTodo]);

    const user = userEvent.setup();
    render(
      <QueryClientProvider client={qc}>
        <TodoItem todo={activeTodo} />
      </QueryClientProvider>
    );

    await user.click(screen.getByRole('checkbox', { name: 'Complete: Buy milk' }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/todos/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ completed: true }),
        })
      );
    });
  });

  it('calls DELETE API when delete button is clicked', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => ({}),
    } as unknown as Response);

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    qc.setQueryData(
      ['todos'],
      [{ id: 2, text: 'Walk dog', completed: false, createdAt: '2026-01-02T00:00:00.000Z' }]
    );

    const user = userEvent.setup();
    render(
      <QueryClientProvider client={qc}>
        <TodoItem
          todo={{
            id: 2,
            text: 'Walk dog',
            completed: false,
            createdAt: '2026-01-02T00:00:00.000Z',
          }}
        />
      </QueryClientProvider>
    );

    await user.click(screen.getByLabelText('Delete: Walk dog'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/todos/2',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  it('shows "Couldn\'t update" InlineError when toggle mutation fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    qc.setQueryData(['todos'], [activeTodo]);

    const user = userEvent.setup();
    render(
      <QueryClientProvider client={qc}>
        <TodoItem todo={activeTodo} />
      </QueryClientProvider>
    );

    await user.click(screen.getByRole('checkbox', { name: 'Complete: Buy milk' }));

    await screen.findByRole('alert');
    expect(screen.getByRole('alert').textContent).toContain("Couldn't update");
  });

  it('shows "Couldn\'t delete" InlineError when delete mutation fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    qc.setQueryData(['todos'], [activeTodo]);

    const user = userEvent.setup();
    render(
      <QueryClientProvider client={qc}>
        <TodoItem todo={activeTodo} />
      </QueryClientProvider>
    );

    await user.click(screen.getByLabelText('Delete: Buy milk'));

    await screen.findByRole('alert');
    expect(screen.getByRole('alert').textContent).toContain("Couldn't delete");
  });

  it('clears toggle InlineError on successful retry', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ...activeTodo, completed: true }),
    } as unknown as Response);

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    qc.setQueryData(['todos'], [activeTodo]);

    const user = userEvent.setup();
    render(
      <QueryClientProvider client={qc}>
        <TodoItem todo={activeTodo} />
      </QueryClientProvider>
    );

    await user.click(screen.getByRole('checkbox', { name: 'Complete: Buy milk' }));
    await screen.findByRole('alert'); // error appears

    await user.click(screen.getByRole('checkbox', { name: 'Complete: Buy milk' })); // retry
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });
});
