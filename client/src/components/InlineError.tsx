import * as React from 'react';

interface InlineErrorProps {
  message?: string;
  variant?: 'input' | 'item';
}

const InlineError: React.FC<InlineErrorProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        marginTop: 'var(--space-1)',
        padding: '4px var(--space-2)',
        borderRadius: 4,
        background: 'var(--color-error-subtle)',
        color: 'var(--color-error)',
        fontSize: 'var(--text-sm)',
      }}
    >
      <span aria-hidden="true">●</span>
      <span>{message}</span>
    </div>
  );
};

export { InlineError };
