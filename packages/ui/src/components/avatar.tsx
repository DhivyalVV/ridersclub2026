import * as React from 'react';
import { cn } from '../lib/utils.js';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt: string;
  fallbackText?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
};

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'RC';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase();
}

export function Avatar({
  src,
  alt,
  fallbackText,
  size = 'md',
  className,
  ...props
}: AvatarProps): React.JSX.Element {
  const [imageError, setImageError] = React.useState(false);
  const initials = getInitials(fallbackText ?? alt);

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 font-semibold text-primary-800 ring-2 ring-white',
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </div>
  );
}

