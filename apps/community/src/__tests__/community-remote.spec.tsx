import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RIDERSCLUB_OPEN_CHAT_EVENT } from '@ridersclub/ui';
import { CommunityRemoteApp } from '../CommunityRemoteApp.js';

afterEach(() => {
  cleanup();
});

describe('CommunityRemoteApp federated remote (Phase 6 Communities, Chat & Blogs)', () => {
  it('renders communities by default and switches to Rider Blogs tab', () => {
    render(<CommunityRemoteApp />);

    expect(screen.getByText('Western Ghats ADV Tourers')).toBeTruthy();

    const blogsTab = screen.getByRole('tab', { name: /Rider Blogs/i });
    fireEvent.click(blogsTab);

    expect(
      screen.getByText('High-Altitude Braking & Clutch Care Before a Spiti Circuit'),
    ).toBeTruthy();
  });

  it('dispatches global 1:1 chat event when clicking Message on a community founder', () => {
    const chatListener = vi.fn();
    window.addEventListener(RIDERSCLUB_OPEN_CHAT_EVENT, chatListener);

    render(<CommunityRemoteApp />);

    const messageButtons = screen.getAllByRole('button', {
      name: /Start private chat with Vikramaditya Rao/i,
    });
    fireEvent.click(messageButtons[0]!);

    expect(chatListener).toHaveBeenCalledTimes(1);
    window.removeEventListener(RIDERSCLUB_OPEN_CHAT_EVENT, chatListener);
  });

  it('joins a public community, opens Community Chat & Roster, and posts a chat message', () => {
    render(<CommunityRemoteApp />);

    const joinButtons = screen.getAllByRole('button', { name: /Join Community/i });
    fireEvent.click(joinButtons[0]!);

    expect(
      screen.getByText(/Joined Western Ghats ADV Tourers! You can now post in Community Chat/i),
    ).toBeTruthy();

    const openChatButtons = screen.getAllByRole('button', {
      name: /Open Chat & Roster/i,
    });
    fireEvent.click(openChatButtons[0]!);

    expect(screen.getByText('Community Group Chat')).toBeTruthy();

    const chatInput = screen.getByLabelText('Community chat message');
    fireEvent.change(chatInput, {
      target: { value: 'Checking in with my Himalayan 450 for the Sunday trail run!' },
    });
    fireEvent.submit(chatInput.closest('form')!);

    expect(
      screen.getByText('Checking in with my Himalayan 450 for the Sunday trail run!'),
    ).toBeTruthy();
  });

  it('locks private community chat for non-members and submits pending request on Request Access', () => {
    render(<CommunityRemoteApp />);

    const requestAccessBtn = screen.getByRole('button', { name: /Request Access/i });
    fireEvent.click(requestAccessBtn);

    expect(screen.getByText(/Pending Approval/i)).toBeTruthy();

    const openChatButtons = screen.getAllByRole('button', {
      name: /Open Chat & Roster/i,
    });
    // Open the 3rd community (Deccan GT Track & Canyon Club - PRIVATE)
    fireEvent.click(openChatButtons[2]!);

    expect(screen.getByText('Private Community Chat Locked')).toBeTruthy();
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
