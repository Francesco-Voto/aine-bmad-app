import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-[6px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: [
          'text-white',
          '[background-color:var(--color-accent)]',
          'hover:[background-color:var(--color-accent-hover)]',
          'focus-visible:[ring-color:var(--color-border-focus)]',
        ],
        ghost: [
          'bg-transparent',
          '[color:var(--color-text-primary)]',
          'hover:[background-color:var(--color-border)]',
        ],
      },
      size: {
        default: '[padding:var(--space-3)_var(--space-4)]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
