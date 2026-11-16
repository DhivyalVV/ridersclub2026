import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RIDERSCLUB_OPEN_CHAT_EVENT } from '@ridersclub/ui';
import { CommunityRemoteApp } from '../CommunityRemoteApp.js';

afterEach(() => {
  cleanup();
});

describe('CommunityRemoteApp federated remote (Phase 6 Communities, Chat & Blogs)', () => {
  it('renders Communities and Rider Blogs as separate dedicated views without an internal tab switcher', () => {
    const { unmount } = render(<CommunityRemoteApp initialSection="communities" />);

    expect(screen.getByText('Riding Communities')).toBeTruthy();
    expect(screen.getByText('You are not in any groups')).toBeTruthy();
    expect(screen.queryByRole('tab', { name: /Rider Blogs/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Write Blog/i })).toBeNull();

    unmount();

    render(<CommunityRemoteApp initialSection="blogs" />);

    expect(screen.getByText('Rider Blogs & Technical Guides')).toBeTruthy();
    expect(
      screen.getByText('High-Altitude Braking & Clutch Care Before a Spiti Circuit'),
    ).toBeTruthy();
    expect(screen.queryByRole('tab', { name: /Communities/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /New Community/i })).toBeNull();
  });

  it('dispatches global 1:1 chat event when clicking Message on a community founder in the members screen', () => {
    const chatListener = vi.fn();
    window.addEventListener(RIDERSCLUB_OPEN_CHAT_EVENT, chatListener);

    render(<CommunityRemoteApp />);

    const searchInput = screen.getByLabelText('Search communities');
    fireEvent.change(searchInput, { target: { value: 'Western Ghats' } });
    fireEvent.click(screen.getByText('Western Ghats ADV Tourers'));
    fireEvent.click(
      screen.getByRole('button', { name: /View members of Western Ghats ADV Tourers/i }),
    );

    const messageButtons = screen.getAllByRole('button', {
      name: /Start private chat with Vikramaditya Rao/i,
    });
    fireEvent.click(messageButtons[0]!);

    expect(chatListener).toHaveBeenCalledTimes(1);
    window.removeEventListener(RIDERSCLUB_OPEN_CHAT_EVENT, chatListener);
  });

  it('searches and joins a public community, lists it in My Communities, opens group chat on click, posts a message, and supports Back and Leave Community buttons', () => {
    render(<CommunityRemoteApp />);

    // Initially user is not in any group
    expect(screen.getByText('You are not in any groups')).toBeTruthy();

    // Search for a public community
    const searchInput = screen.getByLabelText('Search communities');
    fireEvent.change(searchInput, { target: { value: 'Western Ghats' } });

    const joinBtn = screen.getByRole('button', { name: /Join Community/i });
    fireEvent.click(joinBtn);

    expect(
      screen.getByText(/Joined Western Ghats ADV Tourers! You can now post in Community Chat/i),
    ).toBeTruthy();

    // Clear search: joined community is now listed in user's WhatsApp-style group list
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('My Communities (1)')).toBeTruthy();
    expect(screen.getByText('Western Ghats ADV Tourers')).toBeTruthy();

    // Click on the group in the list to open its chat view
    fireEvent.click(screen.getByText('Western Ghats ADV Tourers'));

    expect(screen.getByText(/Tap for group info/i)).toBeTruthy();
    expect(screen.queryByText(/Approved Members/i)).toBeNull();
    expect(screen.getByRole('button', { name: /Back to communities list/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Leave$/i })).toBeNull();

    // Click on the community name/icon in the header to view the group info & members screen
    fireEvent.click(
      screen.getByRole('button', { name: /View members of Western Ghats ADV Tourers/i }),
    );
    expect(screen.getByText(/Approved Members/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Leave$/i })).toBeTruthy();
    expect(screen.queryByText(/Tap for group info/i)).toBeNull();

    // Click Back on the members screen to return to the chat view
    fireEvent.click(screen.getByRole('button', { name: /Back to community chat/i }));
    expect(screen.getByText(/Tap for group info/i)).toBeTruthy();

    // Send a message in the group chat
    const chatInput = screen.getByLabelText('Community chat message');
    fireEvent.change(chatInput, {
      target: { value: 'Checking in with my Himalayan 450 for the Sunday trail run!' },
    });
    fireEvent.submit(chatInput.closest('form')!);

    expect(
      screen.getByText('Checking in with my Himalayan 450 for the Sunday trail run!'),
    ).toBeTruthy();

    // Click Back button to come back to the group list
    fireEvent.click(screen.getByRole('button', { name: /Back to communities list/i }));
    expect(screen.getByText('My Communities (1)')).toBeTruthy();

    // Re-open group, open group info, and click Leave button
    fireEvent.click(screen.getByText('Western Ghats ADV Tourers'));
    fireEvent.click(
      screen.getByRole('button', { name: /View members of Western Ghats ADV Tourers/i }),
    );
    fireEvent.click(screen.getByRole('button', { name: /^Leave$/i }));

    expect(screen.getByText('You are not in any groups')).toBeTruthy();
  });

  it('requests to join a private community via search, lists requested community in My Communities, and locks private chat until approved', () => {
    render(<CommunityRemoteApp />);

    const searchInput = screen.getByLabelText('Search communities');
    fireEvent.change(searchInput, { target: { value: 'Deccan GT' } });

    const requestJoinBtn = screen.getByRole('button', { name: /Request to Join/i });
    fireEvent.click(requestJoinBtn);

    // Clear search and verify requested community is listed in user's communities tab
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('My Communities (1)')).toBeTruthy();
    expect(screen.getByText('Deccan GT Track & Canyon Club')).toBeTruthy();
    expect(
      screen.getByText(/Join request sent • Waiting for moderator approval/i),
    ).toBeTruthy();

    // Clicking on the requested private community opens chat in locked state
    fireEvent.click(screen.getByText('Deccan GT Track & Canyon Club'));
    expect(screen.getByText('Private Community Chat Locked')).toBeTruthy();
  });

  it('shows no communities found message when search has no matches and allows creating public or private communities', () => {
    render(<CommunityRemoteApp />);

    const searchInput = screen.getByLabelText('Search communities');
    fireEvent.change(searchInput, { target: { value: 'Ladakh Snow Riders' } });

    expect(
      screen.getByText(
        /No communities found\. Click on the add button above to create communities\./i,
      ),
    ).toBeTruthy();

    // Click New Community button above to create a private community
    fireEvent.click(screen.getByRole('button', { name: /New Community/i }));

    fireEvent.change(screen.getByLabelText(/Community Name/i), {
      target: { value: 'Ladakh Snow Riders' },
    });
    fireEvent.change(screen.getByLabelText(/Access & Privacy/i), {
      target: { value: 'PRIVATE' },
    });
    fireEvent.change(screen.getByLabelText(/Description & Riding Charter/i), {
      target: { value: 'Winter expedition riders across Khardung La and Zanskar.' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create Community' }));

    // Newly created community appears in My Communities list
    expect(screen.getByText('My Communities (1)')).toBeTruthy();
    expect(screen.getByText('Ladakh Snow Riders')).toBeTruthy();

    // Trying to create a duplicate PRIVATE community with the same name by the same user shows validation error
    fireEvent.click(screen.getByRole('button', { name: /New Community/i }));
    fireEvent.change(screen.getByLabelText(/Community Name/i), {
      target: { value: 'Ladakh Snow Riders' },
    });
    fireEvent.change(screen.getByLabelText(/Access & Privacy/i), {
      target: { value: 'PRIVATE' },
    });
    fireEvent.change(screen.getByLabelText(/Description & Riding Charter/i), {
      target: { value: 'Duplicate private group attempt.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Community' }));

    expect(
      screen.getByRole('alert').textContent,
    ).toMatch(/Community already present, cannot create duplicate\./i);

    // Switching visibility to PUBLIC with the same name is allowed (1 public + 1 private)
    fireEvent.change(screen.getByLabelText(/Access & Privacy/i), {
      target: { value: 'PUBLIC' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Community' }));
    expect(screen.getByText('My Communities (2)')).toBeTruthy();

    // Trying to create a duplicate PUBLIC community with an existing public name shows validation error
    fireEvent.click(screen.getByRole('button', { name: /New Community/i }));
    fireEvent.change(screen.getByLabelText(/Community Name/i), {
      target: { value: 'Western Ghats ADV Tourers' },
    });
    fireEvent.change(screen.getByLabelText(/Access & Privacy/i), {
      target: { value: 'PUBLIC' },
    });
    fireEvent.change(screen.getByLabelText(/Description & Riding Charter/i), {
      target: { value: 'Duplicate public group attempt.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Community' }));

    expect(
      screen.getByRole('alert').textContent,
    ).toMatch(/Community already present, cannot create duplicate\./i);
  });

  it('opens full blog reader, toggles Like reaction, and posts a rider comment', () => {
    render(<CommunityRemoteApp initialSection="blogs" />);

    const readButtons = screen.getAllByRole('button', { name: /Read Full Article/i });
    fireEvent.click(readButtons[0]!);

    expect(
      screen.getByText(/Long mountain descents from Kunzum La and Rohtang/i),
    ).toBeTruthy();

    const likeArticleBtn = screen.getByRole('button', { name: /Like Article \(24\)/i });
    fireEvent.click(likeArticleBtn);
    expect(screen.getByRole('button', { name: /Liked \(25\)/i })).toBeTruthy();

    const commentInput = screen.getByLabelText('Add blog comment');
    fireEvent.change(commentInput, {
      target: { value: 'Verified 2.5mm clutch free-play before climbing Kunzum Pass.' },
    });
    fireEvent.submit(commentInput.closest('form')!);

    expect(
      screen.getByText('Verified 2.5mm clutch free-play before climbing Kunzum Pass.'),
    ).toBeTruthy();
  });
});
