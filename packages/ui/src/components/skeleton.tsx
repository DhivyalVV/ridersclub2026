import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils.js';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-slate-200/80', className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export interface RemoteLoadingStateProps {
  remoteName: string;
}

export function RemoteLoadingState({ remoteName }: RemoteLoadingStateProps): React.JSX.Element {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" aria-hidden="true" />
      <p className="mt-3 text-sm font-medium text-slate-800">
        Loading {remoteName} module...
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Fetching federated micro-frontend bundle
      </p>
      <div className="mt-6 grid w-full max-w-md grid-cols-2 gap-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: EmptyStateProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
      {icon && <div className="mb-3 text-primary-600">{icon}</div>}
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-600">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

