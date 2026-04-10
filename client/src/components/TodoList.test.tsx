import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useTodos } from '../hooks/useTodos';
import { TodoList } from './TodoList';

vi.mock('../hooks/useTodos');

const mockUseTodos = vi.mocked(useTodos);

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('TodoList', () => {
  it('renders skeleton rows while loading', () => {
    mockUseTodos.mockReturnValue({
      isLoading: true,
      data: undefined,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useTodos>);

    const { container } = renderWithQuery(<TodoList />);

    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
    expect(container.querySelectorAll('.skeleton')).toHaveLength(3);
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('renders empty message when there are no todos', () => {
    mockUseTodos.mockReturnValue({
      isLoading: false,
      data: [],
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useTodos>);

    renderWithQuery(<TodoList />);

    expect(screen.getByText('No tasks yet. Add one above.')).toBeDefined();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('renders error message when the API call fails', () => {
    mockUseTodos.mockReturnValue({
      isLoading: false,
      data: undefined,
      isError: true,
      error: new Error('Network error'),
    } as unknown as ReturnType<typeof useTodos>);

    renderWithQuery(<TodoList />);

    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByRole('alert').textContent).toContain("Couldn't load your tasks");
    expect(screen.getByRole('button', { name: 'Retry' })).toBeDefined();
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.queryByText('No tasks yet. Add one above.')).toBeNull();
  });

  it('Retry button triggers refetch', async () => {
    mockUseTodos.mockReturnValue({
      isLoading: false,
      data: undefined,
      isError: true,
      error: new Error('Network error'),
    } as unknown as ReturnType<typeof useTodos>);

    renderWithQuery(<TodoList />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(screen.getByRole('button', { name: 'Retry' })).toBeDefined();
  });

  it('renders the list of todos when data is available', () => {
    mockUseTodos.mockReturnValue({
      isLoading: false,
      data: [
        { id: 1, text: 'First task', completed: false, createdAt: '2026-01-01T00:00:00.000Z' },
        { id: 2, text: 'Second task', completed: false, createdAt: '2026-01-02T00:00:00.000Z' },
      ],
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useTodos>);

    renderWithQuery(<TodoList />);

    expect(screen.getByText('TASKS')).toBeDefined();
    expect(screen.getByRole('list')).toBeDefined();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('First task')).toBeDefined();
    expect(screen.getByText('Second task')).toBeDefined();
  });
});
