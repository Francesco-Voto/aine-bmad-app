import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TodoInput } from './TodoInput';

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('TodoInput', () => {
  it('renders with autofocus and placeholder', () => {
    renderWithQuery(<TodoInput />);
    const input = screen.getByPlaceholderText('Add a task…');
    expect(input).toBeInTheDocument();
    expect(document.activeElement).toBe(input);
  });

  it('empty submit does not call fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    renderWithQuery(<TodoInput />);
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('whitespace-only submit does not call fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    renderWithQuery(<TodoInput />);
    await userEvent.type(screen.getByPlaceholderText('Add a task…'), '   ');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('valid submit calls fetch with trimmed text', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: 10,
        text: 'Buy milk',
        completed: false,
        createdAt: new Date().toISOString(),
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    renderWithQuery(<TodoInput />);
    await userEvent.type(screen.getByPlaceholderText('Add a task…'), 'Buy milk');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/todos',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ text: 'Buy milk' }),
        })
      );
    });
  });

  it('input clears after successful submit', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: 11,
        text: 'Buy milk',
        completed: false,
        createdAt: new Date().toISOString(),
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    renderWithQuery(<TodoInput />);
    const input = screen.getByPlaceholderText('Add a task…');
    await userEvent.type(input, 'Buy milk');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => expect(input).toHaveValue(''));
  });

  it('character counter appears at 400 chars', () => {
    renderWithQuery(<TodoInput />);
    const input = screen.getByPlaceholderText('Add a task…');
    fireEvent.change(input, { target: { value: 'a'.repeat(400) } });
    expect(screen.getByText('400/500')).toBeInTheDocument();
  });

  it('submit button is disabled at 500 chars', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    renderWithQuery(<TodoInput />);
    const input = screen.getByPlaceholderText('Add a task…');
    fireEvent.change(input, { target: { value: 'a'.repeat(500) } });
    const btn = screen.getByRole('button', { name: 'Add' });
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows InlineError when create mutation fails', async () => {
    const mockFetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));
    vi.stubGlobal('fetch', mockFetch);

    renderWithQuery(<TodoInput />);
    const input = screen.getByPlaceholderText('Add a task…');
    await userEvent.type(input, 'Buy milk');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    await screen.findByRole('alert');
    expect(screen.getByRole('alert').textContent).toContain("Couldn't save");
  });

  it('preserves input text after create failure', async () => {
    const mockFetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));
    vi.stubGlobal('fetch', mockFetch);

    renderWithQuery(<TodoInput />);
    const input = screen.getByPlaceholderText('Add a task…');
    await userEvent.type(input, 'Buy milk');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    await screen.findByRole('alert');
    expect((input as HTMLInputElement).value).toBe('Buy milk');
  });

  it('clears InlineError on successful retry', async () => {
    const mockFetch = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 99,
          text: 'Buy milk',
          completed: false,
          createdAt: new Date().toISOString(),
        }),
      });
    vi.stubGlobal('fetch', mockFetch);

    renderWithQuery(<TodoInput />);
    const input = screen.getByPlaceholderText('Add a task…');
    await userEvent.type(input, 'Buy milk');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    await screen.findByRole('alert'); // error appears

    await userEvent.click(screen.getByRole('button', { name: 'Add' })); // retry
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });

  it('submit button is disabled while mutation is pending', async () => {
    // fetch never resolves → mutation stays in isPending state
    const fetchMock = vi.fn().mockReturnValue(new Promise(() => {}));
    vi.stubGlobal('fetch', fetchMock);

    renderWithQuery(<TodoInput />);
    const input = screen.getByPlaceholderText('Add a task…');
    const button = screen.getByRole('button', { name: 'Add' });

    await userEvent.type(input, 'Buy milk');
    await userEvent.click(button);

    // After click the mutation fires; button should become disabled
    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });

  it('form has role="form" and aria-label="Add a task"', () => {
    renderWithQuery(<TodoInput />);
    const form = screen.getByRole('form', { name: 'Add a task' });
    expect(form).toBeDefined();
  });

  it('Escape clears a non-empty input and removes focus', async () => {
    renderWithQuery(<TodoInput />);
    const input = screen.getByPlaceholderText('Add a task…');
    await userEvent.type(input, 'hello');
    expect(input).toHaveValue('hello');

    await userEvent.keyboard('{Escape}');

    expect(input).toHaveValue('');
    expect(document.activeElement).not.toBe(input);
  });

  it('Escape on empty input removes focus without error', async () => {
    renderWithQuery(<TodoInput />);
    const input = screen.getByPlaceholderText('Add a task…');
    await userEvent.keyboard('{Escape}');

    expect(input).toHaveValue('');
    expect(document.activeElement).not.toBe(input);
  });
});
