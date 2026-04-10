import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';

import { InlineError } from './InlineError';

describe('InlineError', () => {
  it('renders message when provided', () => {
    render(<InlineError message="Couldn't save — check your connection." />);
    expect(screen.getByText("Couldn't save — check your connection.")).toBeDefined();
  });

  it('has role="alert" when message is present', () => {
    render(<InlineError message="An error occurred" />);
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('renders nothing when message is undefined', () => {
    const { container } = render(<InlineError />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when message is empty string', () => {
    const { container } = render(<InlineError message="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders with variant="input"', () => {
    render(<InlineError message="Input error" variant="input" />);
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('renders with variant="item"', () => {
    render(<InlineError message="Item error" variant="item" />);
    expect(screen.getByRole('alert')).toBeDefined();
  });
});
