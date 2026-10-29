import * as React from 'react';
import { MessageSquare, MapPin, ShieldCheck, User } from 'lucide-react';
import { UserRole, type PublicUserSummary } from '@ridersclub/types';
import { Avatar } from './avatar.js';
import { Badge } from './badge.js';
import { Button } from './button.js';
import {
  cn,
  openDirectChatWithUser,
  openUserProfileModal,
} from '../lib/utils.js';

export interface MessageUserButtonProps {
  user: PublicUserSummary;
  contextLabel?: string;
  size?: 'sm' | 'default';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  className?: string;
}

export function MessageUserButton({
  user,
  contextLabel,
  size = 'sm',
  variant = 'outline',
  className,
}: MessageUserButtonProps): React.JSX.Element {
  const isDisabled = !user.canReceiveDirectMessage;

  return (
    <Button
      variant={variant}
      size={size}
      disabled={isDisabled}
      onClick={() => openDirectChatWithUser(user, contextLabel)}
      aria-label={
        isDisabled
          ? `Direct messaging disabled by ${user.displayName}`
          : `Start private chat with ${user.displayName}`
      }
      title={
        isDisabled
          ? `${user.displayName}'s privacy settings restrict direct messages`
          : `Message ${user.displayName}`
      }
      className={cn('shrink-0', className)}
    >
      <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
      <span>Message</span>
    </Button>
  );
}

export interface UserProfileCardProps {
  user: PublicUserSummary;
  contextLabel?: string;
  subtitle?: string;
  compact?: boolean;
  className?: string;
}

export function UserProfileCard({
  user,
  contextLabel,
  subtitle,
  compact = false,
  className,
}: UserProfileCardProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-slate-50/70 p-3 transition-colors hover:bg-slate-100/70',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => openUserProfileModal(user)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded-lg"
        aria-label={`View profile of ${user.displayName}`}
      >
        <Avatar
          src={user.avatarUrl}
          alt={user.displayName}
          fallbackText={user.displayName}
          size={compact ? 'sm' : 'md'}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-slate-900 hover:text-primary-700">
              {user.displayName}
            </span>
            {user.role === UserRole.ADMIN && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                Admin
              </Badge>
            )}
            {user.role === UserRole.MODERATOR && (
              <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                Mod
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>@{user.username}</span>
            {user.city && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {user.city}
              </span>
            )}
            {subtitle && <span>• {subtitle}</span>}
          </div>
          {!compact && user.bio && (
            <p className="mt-1 line-clamp-1 text-xs text-slate-600">{user.bio}</p>
          )}
        </div>
      </button>

      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openUserProfileModal(user)}
          aria-label={`Inspect ${user.displayName} profile`}
          className="hidden sm:inline-flex"
        >
          <User className="h-3.5 w-3.5" aria-hidden="true" />
          Profile
        </Button>
        <MessageUserButton user={user} contextLabel={contextLabel} />
      </div>
    </div>
  );
}

