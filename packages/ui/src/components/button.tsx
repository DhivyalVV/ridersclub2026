import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils.js';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 active:bg-primary-800',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-slate-200/80',
        outline:
          'border border-slate-300 bg-white text-slate-800 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-300',
        ghost: 'text-slate-700 hover:bg-primary-50 hover:text-primary-700',
        destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
        emergency:
          'bg-amber-600 text-white shadow-sm hover:bg-amber-700 focus-visible:ring-amber-500',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-lg px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => {
    return (
      <button
        type={type}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };

