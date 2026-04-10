import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PageShell } from './PageShell';

describe('PageShell', () => {
  it('matches snapshot', () => {
    const { container } = render(
      <PageShell title="Test Title">
        <p>Child content</p>
      </PageShell>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders the title as a heading', () => {
    render(
      <PageShell title="My Heading">
        <span>body</span>
      </PageShell>
    );
    expect(screen.getByRole('heading', { level: 1, name: 'My Heading' })).toBeDefined();
  });

  it('renders children below the divider', () => {
    render(
      <PageShell title="Anything">
        <button>Click me</button>
      </PageShell>
    );
    expect(screen.getByRole('button', { name: 'Click me' })).toBeDefined();
  });
});
