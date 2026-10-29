import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { PublicUserSummary } from '@ridersclub/types';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const RIDERSCLUB_OPEN_CHAT_EVENT = 'ridersclub:open-chat';
export const RIDERSCLUB_VIEW_PROFILE_EVENT = 'ridersclub:view-profile';

export interface OpenDirectChatDetail {
  targetUser: PublicUserSummary;
  contextLabel?: string;
}

export interface ViewUserProfileDetail {
  targetUser: PublicUserSummary;
}

/**
 * Dispatches a global cross-micro-frontend event instructing the Shell host
 * to open (or resume) a 1:1 conversation with the target user.
 */
export function openDirectChatWithUser(
  targetUser: PublicUserSummary,
  contextLabel?: string,
): void {
  if (typeof window === 'undefined') return;

  const event = new CustomEvent<OpenDirectChatDetail>(RIDERSCLUB_OPEN_CHAT_EVENT, {
    detail: { targetUser, contextLabel },
  });
  window.dispatchEvent(event);
}

/**
 * Dispatches a global cross-micro-frontend event instructing the Shell host
 * to open the profile modal/view for the target user.
 */
export function openUserProfileModal(targetUser: PublicUserSummary): void {
  if (typeof window === 'undefined') return;

  const event = new CustomEvent<ViewUserProfileDetail>(RIDERSCLUB_VIEW_PROFILE_EVENT, {
    detail: { targetUser },
  });
  window.dispatchEvent(event);
}

