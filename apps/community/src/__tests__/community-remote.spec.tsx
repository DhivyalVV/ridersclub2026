import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RIDERSCLUB_OPEN_CHAT_EVENT } from '@ridersclub/ui';
import { CommunityRemoteApp } from '../CommunityRemoteApp.js';

afterEach(() => {
  window.localStorage.removeItem('ridersclub:auth_user');
  window.localStorage.removeItem('ridersclub_auth_user');
  cleanup();
});

describe('CommunityRemoteApp federated remote (Phase 6 Communities, Chat & Blogs)', () => {
  it('renders Communities and News as separate dedicated views without an internal tab switcher', () => {
    const { unmount } = render(<CommunityRemoteApp initialSection="communities" />);

    expect(screen.getByText('Riding Communities')).toBeTruthy();
    expect(screen.getByText('You are not in any groups')).toBeTruthy();
    expect(screen.queryByRole('tab', { name: /News/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Publish News/i })).toBeNull();

    unmount();

    render(<CommunityRemoteApp initialSection="news" />);

    expect(screen.getByRole('heading', { name: 'News' })).toBeTruthy();
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

    // Opening a public community before joining shows the locked chat warning message
    fireEvent.click(screen.getByText('Western Ghats ADV Tourers'));
    expect(screen.getByText('Community Chat Locked')).toBeTruthy();
    expect(
      screen.getByText(
        /Only members can view or send messages in Community Chat\. Join this community to access the chat\./i,
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Back to communities list/i }));

    const joinBtn = screen.getByRole('button', { name: /Join Community/i });
    fireEvent.click(joinBtn);

    expect(
      screen.getByText(/Joined Western Ghats ADV Tourers! You can now post in Community Chat/i),
    ).toBeTruthy();

    // Clear search: joined community is now listed in user's WhatsApp-style group list
    fireEvent.change(screen.getByLabelText('Search communities'), { target: { value: '' } });
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
    fireEvent.click(screen.getByRole('button', { name: /Group options/i }));
    expect(screen.getByRole('menuitem', { name: /^Leave$/i })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Group options/i }));
    expect(screen.queryByRole('menuitem', { name: /^Leave$/i })).toBeNull();
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

    // Re-open group, open group info, verify Share button, and click Leave button
    fireEvent.click(screen.getByText('Western Ghats ADV Tourers'));
    fireEvent.click(
      screen.getByRole('button', { name: /View members of Western Ghats ADV Tourers/i }),
    );
    fireEvent.click(screen.getByRole('button', { name: /Group options/i }));
    expect(screen.getByRole('menuitem', { name: /^Share$/i })).toBeTruthy();
    fireEvent.click(screen.getByRole('menuitem', { name: /^Share$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Group options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^Leave$/i }));

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

  it('renders news cards with header image and description, opens full news in a new page on click, and returns via Back to News', () => {
    render(<CommunityRemoteApp initialSection="news" />);

    // Non-admin user does not see Publish News button
    expect(screen.queryByRole('button', { name: /Publish News/i })).toBeNull();

    // News card displays header image and description
    const headerImg = screen.getByRole('img', {
      name: 'High-Altitude Braking & Clutch Care Before a Spiti Circuit',
    });
    expect(headerImg).toBeTruthy();
    expect(
      screen.getByText(/How DOT 4 boiling points, braided steel lines/i),
    ).toBeTruthy();

    // Click on the news card to see the full news in a new page
    const newsCard = screen.getByRole('article', {
      name: 'High-Altitude Braking & Clutch Care Before a Spiti Circuit',
    });
    fireEvent.click(newsCard);

    // Full news page is rendered and other news cards from the list page are hidden
    expect(screen.getByTestId('full-news-page')).toBeTruthy();
    expect(
      screen.queryByText('Pre-Purchase Inspection Checklist for Used Dual-Sport Motorcycles'),
    ).toBeNull();
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

    // Click Back to News to return to the news list page
    fireEvent.click(screen.getByRole('button', { name: /Back to News/i }));
    expect(screen.queryByTestId('full-news-page')).toBeNull();
    expect(
      screen.getByText('Pre-Purchase Inspection Checklist for Used Dual-Sport Motorcycles'),
    ).toBeTruthy();
  });

  it('shows Delete in group info only for ADMIN on public communities, and lets ADMIN delete it', () => {
    const openGroupInfo = () => {
      fireEvent.change(screen.getByLabelText('Search communities'), {
        target: { value: 'Western Ghats' },
      });
      fireEvent.click(screen.getByText('Western Ghats ADV Tourers'));
      fireEvent.click(
        screen.getByRole('button', { name: /View members of Western Ghats ADV Tourers/i }),
      );
    };

    // Normal USER: no delete option on a public community
    window.localStorage.setItem(
      'ridersclub:auth_user',
      JSON.stringify({
        id: 'user-normal-1',
        role: 'USER',
        profile: { userId: 'user-normal-1', username: 'normal_rider', displayName: 'Normal Rider' },
      }),
    );
    const { unmount } = render(<CommunityRemoteApp />);
    openGroupInfo();
    fireEvent.click(screen.getByRole('button', { name: /Group options/i }));
    expect(screen.getByRole('menuitem', { name: /^Share$/i })).toBeTruthy();
    expect(
      screen.queryByRole('menuitem', { name: /Delete community Western Ghats ADV Tourers/i }),
    ).toBeNull();
    unmount();

    // ADMIN: delete option is available and removes the community
    window.localStorage.setItem(
      'ridersclub:auth_user',
      JSON.stringify({
        id: 'user-admin-1',
        role: 'ADMIN',
        profile: { userId: 'user-admin-1', username: 'rc_admin', displayName: 'RidersClub Admin' },
      }),
    );
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<CommunityRemoteApp />);
    openGroupInfo();
    fireEvent.click(screen.getByRole('button', { name: /Group options/i }));
    fireEvent.click(
      screen.getByRole('menuitem', { name: /Delete community Western Ghats ADV Tourers/i }),
    );
    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.getByText(/Deleted community Western Ghats ADV Tourers/i)).toBeTruthy();
    confirmSpy.mockRestore();
  });

  it('allows only ADMIN users to publish news with a header image and description', () => {
    // 1. Normal USER cannot see Publish News button
    window.localStorage.setItem(
      'ridersclub:auth_user',
      JSON.stringify({
        id: 'user-normal-1',
        role: 'USER',
        profile: {
          userId: 'user-normal-1',
          username: 'normal_rider',
          displayName: 'Normal Rider',
        },
      }),
    );

    const { unmount } = render(<CommunityRemoteApp initialSection="news" />);
    expect(screen.queryByRole('button', { name: /Publish News/i })).toBeNull();
    unmount();

    // 2. ADMIN user sees Publish News button and can publish a news article
    window.localStorage.setItem(
      'ridersclub:auth_user',
      JSON.stringify({
        id: 'user-admin-1',
        role: 'ADMIN',
        profile: {
          userId: 'user-admin-1',
          username: 'rc_admin',
          displayName: 'RidersClub Admin',
        },
      }),
    );

    render(<CommunityRemoteApp initialSection="news" />);

    const publishBtn = screen.getByRole('button', { name: /Publish News/i });
    fireEvent.click(publishBtn);

    fireEvent.change(screen.getByLabelText(/News Headline \/ Title/i), {
      target: { value: 'Monsoon Expressways Safety Advisory 2026' },
    });
    fireEvent.change(screen.getByLabelText(/Header Image URL/i), {
      target: { value: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc' },
    });
    fireEvent.change(screen.getByLabelText(/Short Description/i), {
      target: { value: 'Official tire pressure and hydroplaning guidance for heavy coastal rain.' },
    });
    fireEvent.change(screen.getByLabelText(/Full News Content/i), {
      target: { value: 'Inspect tread depth indicators and reduce speed on wet concrete.' },
    });

    fireEvent.submit(screen.getByLabelText(/News Headline \/ Title/i).closest('form')!);

    expect(screen.getByText('Monsoon Expressways Safety Advisory 2026')).toBeTruthy();
    expect(
      screen.getByText('Official tire pressure and hydroplaning guidance for heavy coastal rain.'),
    ).toBeTruthy();
  });
});
