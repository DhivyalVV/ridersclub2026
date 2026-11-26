import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NewsRemoteApp } from '../NewsRemoteApp.js';

afterEach(() => {
  window.localStorage.removeItem('ridersclub:auth_user');
  window.localStorage.removeItem('ridersclub_auth_user');
  cleanup();
});

describe('NewsRemoteApp federated remote (:5007)', () => {
  it('renders news list, opens full news article, toggles likes, posts comments, and returns to list', () => {
    render(<NewsRemoteApp />);

    expect(screen.getByRole('heading', { name: 'News' })).toBeTruthy();
    expect(
      screen.getByText('High-Altitude Braking & Clutch Care Before a Spiti Circuit'),
    ).toBeTruthy();

    const newsCard = screen.getByRole('article', {
      name: 'High-Altitude Braking & Clutch Care Before a Spiti Circuit',
    });
    fireEvent.click(newsCard);

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

    const commentInput = screen.getByLabelText('Add news comment');
    fireEvent.change(commentInput, {
      target: { value: 'Verified 2.5mm clutch free-play before climbing Kunzum Pass.' },
    });
    fireEvent.submit(commentInput.closest('form')!);

    expect(
      screen.getByText('Verified 2.5mm clutch free-play before climbing Kunzum Pass.'),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Back to News/i }));
    expect(screen.queryByTestId('full-news-page')).toBeNull();
    expect(
      screen.getByText('Pre-Purchase Inspection Checklist for Used Dual-Sport Motorcycles'),
    ).toBeTruthy();
  });

  it('allows only ADMIN users to publish news with a header image and description', () => {
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

    const { unmount } = render(<NewsRemoteApp />);
    expect(screen.queryByRole('button', { name: /Publish News/i })).toBeNull();
    unmount();

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

    render(<NewsRemoteApp />);

    fireEvent.click(screen.getByRole('button', { name: /Publish News/i }));

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
