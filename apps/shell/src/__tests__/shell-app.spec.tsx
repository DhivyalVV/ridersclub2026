import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserRole } from '@ridersclub/types';
import { openDirectChatWithUser } from '@ridersclub/ui';
import { ShellApp } from '../ShellApp.js';

afterEach(() => {
  cleanup();
});

function MockFederatedCommunity({
  initialSection = 'communities',
}: {
  initialSection?: 'communities' | 'blogs';
}): React.JSX.Element {
  return (
    <div>
      <h2>Mock Federated Community ({initialSection})</h2>
      <button
        type="button"
        onClick={() =>
          openDirectChatWithUser(
            {
              id: 'user-remote-author',
              displayName: 'Ananya Verma',
              username: 'ananya_gt',
              avatarUrl: null,
              bio: 'Continental GT 650 rider',
              city: 'Hyderabad',
              role: UserRole.USER,
              canReceiveDirectMessage: true,
            },
            'Blog: Valve Clearance Guide',
          )
        }
      >
        Trigger Chat From Remote
      </button>
    </div>
  );
}

describe('ShellApp host micro-frontend & Phase 4 multi-remote orchestration', () => {
  it('renders global navigation and mounts federated Community view', () => {
    render(
      <MemoryRouter initialEntries={['/communities']}>
        <ShellApp CommunityComponentOverride={MockFederatedCommunity} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Mock Federated Community \(communities\)/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Open 1:1 Direct Messages Drawer/i })).toBeTruthy();
  });

  it('opens global 1:1 Chat Drawer when a federated remote dispatches openDirectChatWithUser', () => {
    render(
      <MemoryRouter initialEntries={['/communities']}>
        <ShellApp CommunityComponentOverride={MockFederatedCommunity} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText('Trigger Chat From Remote'));

    expect(screen.getByRole('dialog', { name: /Individual Direct Chat Drawer/i })).toBeTruthy();
    expect(screen.getByText('Chatting with Ananya Verma (@ananya_gt)')).toBeTruthy();
    expect(screen.getByText(/Initiated from Blog: Valve Clearance Guide/i)).toBeTruthy();
  });

  it('supports direct URL navigation across all 6 federated remotes (Rides, Help, Mechanics, Garage, Marketplace, Blogs)', async () => {
    const routesToVerify: Array<{ path: string; expectedHeading: RegExp }> = [
      { path: '/blogs', expectedHeading: /Communities & Rider Blogs/i },
      { path: '/rides', expectedHeading: /Group Ride Organization/i },
      { path: '/help', expectedHeading: /Roadside Assistance & Peer Help/i },
      { path: '/mechanics', expectedHeading: /Mechanics & Service Providers/i },
      { path: '/garage', expectedHeading: /My Garage & Service Logbook/i },
      { path: '/marketplace', expectedHeading: /Secondhand Cars & Bikes Marketplace/i },
    ];

    for (const route of routesToVerify) {
      cleanup();
      render(
        <MemoryRouter initialEntries={[route.path]}>
          <ShellApp />
        </MemoryRouter>,
      );

      expect(await screen.findByText(route.expectedHeading, {}, { timeout: 5000 })).toBeTruthy();
    }
  }, 20000);

  it('isolates remote loading failures in RemoteErrorBoundary and recovers when navigating to another route', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    function OfflineRidesRemote(): React.JSX.Element {
      throw new Error('Failed to fetch http://localhost:5002/remoteEntry.js');
    }

    render(
      <MemoryRouter initialEntries={['/rides']}>
        <ShellApp
          remoteOverrides={{
            Rides: OfflineRidesRemote,
            Community: MockFederatedCommunity,
          }}
        />
      </MemoryRouter>,
    );

    // Error boundary catches the broken Rides remote
    expect(
      screen.getByText(/Rides \(@ridersclub\/rides\) Micro-Frontend Unavailable/i),
    ).toBeTruthy();
    expect(
      screen.getByText(/Failed to fetch http:\/\/localhost:5002\/remoteEntry.js/i),
    ).toBeTruthy();

    // Navigating via the Shell sidebar to Communities recovers cleanly
    const communitiesLinks = screen.getAllByRole('link', { name: /Communities/i });
    fireEvent.click(communitiesLinks[0]!);

    expect(screen.getByText(/Mock Federated Community \(communities\)/i)).toBeTruthy();

    spy.mockRestore();
  });

  it('renders Google OAuth and Phone OTP authentication cards on /profile when signed out', () => {
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <ShellApp />
      </MemoryRouter>,
    );

    expect(screen.getByText('Sign In with Phone OTP')).toBeTruthy();
    expect(screen.getByText('Continue with Google')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Send 6-Digit OTP Code/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Sign In with Google/i })).toBeTruthy();
  });

  it('deduplicates 1:1 conversations when triggered multiple times for the same peer and sends messages', () => {
    render(
      <MemoryRouter initialEntries={['/communities']}>
        <ShellApp CommunityComponentOverride={MockFederatedCommunity} />
      </MemoryRouter>,
    );

    const triggerBtn = screen.getByText('Trigger Chat From Remote');
    fireEvent.click(triggerBtn);
    fireEvent.click(triggerBtn);

    const ananyaTabs = screen.getAllByRole('button', { name: 'Ananya Verma' });
    expect(ananyaTabs).toHaveLength(1);

    const messageInput = screen.getByLabelText('Message Ananya Verma');
    fireEvent.change(messageInput, {
      target: { value: 'Hey Ananya, thanks for the 650 twin valve clearance specs!' },
    });
    fireEvent.submit(messageInput.closest('form')!);

    expect(
      screen.getByText('Hey Ananya, thanks for the 650 twin valve clearance specs!'),
    ).toBeTruthy();
  });

  it('renders Phase 13 Admin & Moderation Center on /admin, actions a report, and logs an immutable audit entry', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <ShellApp />
      </MemoryRouter>,
    );

    expect(screen.getByText('Administrator & Moderation Center')).toBeTruthy();
    expect(screen.getByTestId('open-reports-count').textContent).toBe('2');

    // Action the first open report
    const actionBtn = screen.getByRole('button', {
      name: /Action report for 2022 Yamaha R15 V4/i,
    });
    fireEvent.click(actionBtn);

    // Open reports count drops to 1 and audit log records LISTING_MODERATED_ACTIONED
    expect(screen.getByTestId('open-reports-count').textContent).toBe('1');
    expect(screen.getByText('LISTING_MODERATED_ACTIONED')).toBeTruthy();
  });
});
