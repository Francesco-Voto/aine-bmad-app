import * as React from 'react';

import { cn } from '../../lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, onFocus, onBlur, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn('block w-full', className)}
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
          padding: 'var(--space-2) var(--space-3)',
          fontSize: 'var(--text-input)',
          background: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
          outline: 'none',
          transition: 'outline 0.1s',
        }}
        onFocus={(e) => {
          e.currentTarget.style.outline = '2px solid var(--color-border-focus)';
          e.currentTarget.style.outlineOffset = '2px';
          onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.outline = 'none';
          onBlur?.(e);
        }}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
