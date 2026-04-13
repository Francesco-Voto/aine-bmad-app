import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import App from './App';

vi.mock('./components/TodoInput', () => ({
  TodoInput: () => <div data-testid="todo-input" />,
}));
vi.mock('./components/TodoList', () => ({
  TodoList: () => <div data-testid="todo-list" />,
}));

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('App', () => {
  it('renders the page heading', () => {
    renderWithQuery(<App />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Todo');
  });

  it('renders TodoInput and TodoList', () => {
    renderWithQuery(<App />);
    expect(screen.getByTestId('todo-input')).toBeDefined();
    expect(screen.getByTestId('todo-list')).toBeDefined();
  });
});
