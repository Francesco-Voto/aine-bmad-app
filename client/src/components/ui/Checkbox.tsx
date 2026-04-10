import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as React from 'react';

import { cn } from '../../lib/utils';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, onFocus, onBlur, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn('flex items-center justify-center', className)}
    style={{
      width: 18,
      height: 18,
      borderRadius: 4,
      border: '1px solid var(--color-border)',
      background: 'transparent',
      cursor: 'pointer',
      outline: 'none',
    }}
    onFocus={(e) => {
      (e.currentTarget as HTMLElement).style.outline = '2px solid var(--color-border-focus)';
      (e.currentTarget as HTMLElement).style.outlineOffset = '2px';
      onFocus?.(e);
    }}
    onBlur={(e) => {
      (e.currentTarget as HTMLElement).style.outline = 'none';
      onBlur?.(e);
    }}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: 'var(--color-accent)',
        borderRadius: 3,
      }}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M2 6L5 9L10 3"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
