import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { UserRole, type PublicUserSummary } from '@ridersclub/types';
import {
  RIDERSCLUB_OPEN_CHAT_EVENT,
  UserProfileCard,
  RemoteErrorBoundary,
  getInitials,
} from '../index.js';

afterEach(() => {
  cleanup();
});

const sampleUser: PublicUserSummary = {
  id: 'user-101',
  displayName: 'Aarav Sharma',
  username: 'aarav_rides',
  avatarUrl: null,
  bio: 'Touring enthusiast • Himalayan 450 & Octavia RS',
  city: 'Bengaluru',
  role: UserRole.USER,
  canReceiveDirectMessage: true,
};

describe('@ridersclub/ui design system components', () => {
  it('computes initials accurately for avatars', () => {
    expect(getInitials('Aarav Sharma')).toBe('AS');
    expect(getInitials('Riders')).toBe('RI');
  });

  it('renders UserProfileCard and dispatches global 1:1 chat event when Message is clicked', () => {
    const handler = vi.fn();
    window.addEventListener(RIDERSCLUB_OPEN_CHAT_EVENT, handler);

    render(<UserProfileCard user={sampleUser} contextLabel="Blog: Ladakh Prep" />);

    expect(screen.getByText('Aarav Sharma')).toBeTruthy();
    expect(screen.getByText('@aarav_rides')).toBeTruthy();

    const messageButton = screen.getByRole('button', {
      name: /Start private chat with Aarav Sharma/i,
    });
    fireEvent.click(messageButton);

    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(RIDERSCLUB_OPEN_CHAT_EVENT, handler);
  });

  it('disables Message button when user privacy settings disallow direct messages', () => {
    render(
      <UserProfileCard
        user={{ ...sampleUser, canReceiveDirectMessage: false }}
      />,
    );

    const messageButton = screen.getByRole('button', {
      name: /Direct messaging disabled by Aarav Sharma/i,
    });
    expect(messageButton.hasAttribute('disabled')).toBe(true);
  });

  it('catches remote errors in RemoteErrorBoundary and renders recovery UI', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    function BrokenRemote(): React.JSX.Element {
      throw new Error('Network chunks unreachable');
    }

    render(
      <RemoteErrorBoundary remoteName="Community" remoteUrl="http://localhost:5001/remoteEntry.js">
        <BrokenRemote />
      </RemoteErrorBoundary>,
    );

    expect(screen.getByText(/Community Micro-Frontend Unavailable/i)).toBeTruthy();
    expect(screen.getByText(/Network chunks unreachable/i)).toBeTruthy();

    spy.mockRestore();
  });
});

