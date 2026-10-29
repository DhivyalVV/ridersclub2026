import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RIDERSCLUB_OPEN_CHAT_EVENT } from '@ridersclub/ui';
import { MarketplaceRemoteApp } from '../MarketplaceRemoteApp.js';

afterEach(() => {
  cleanup();
});

describe('MarketplaceRemoteApp federated remote (Phase 12)', () => {
  it('renders car and motorcycle listings with seller claim disclosures and triggers seller 1:1 chat', () => {
    const chatListener = vi.fn();
    window.addEventListener(RIDERSCLUB_OPEN_CHAT_EVENT, chatListener);

    render(<MarketplaceRemoteApp />);

    expect(screen.getByText('2023 Triumph Street Triple 765 R')).toBeTruthy();
    expect(
      screen.getByText('2021 Volkswagen Polo GT TSI 1.0 (Manual Conversion)'),
    ).toBeTruthy();
    expect(
      screen.getAllByText(/Unverified Seller Claim/i).length,
    ).toBeGreaterThan(0);

    const msgButton = screen.getByRole('button', {
      name: /Start private chat with Nikhil Raj/i,
    });
    fireEvent.click(msgButton);

    expect(chatListener).toHaveBeenCalledTimes(1);
    window.removeEventListener(RIDERSCLUB_OPEN_CHAT_EVENT, chatListener);
  });

  it('publishes a new secondhand vehicle listing with validated photo metadata', async () => {
    render(<MarketplaceRemoteApp />);

    const createBtn = screen.getByRole('button', { name: /Create Listing/i });
    fireEvent.click(createBtn);

    const makeInput = screen.getByLabelText(/Make \/ Brand/i);
    fireEvent.change(makeInput, { target: { value: 'KTM' } });

    const modelInput = screen.getByLabelText(/Model & Variant/i);
    fireEvent.change(modelInput, { target: { value: '390 Duke Gen-3' } });

    const descInput = screen.getByLabelText(
      /Condition, Ownership & Service History/i,
    );
    fireEvent.change(descInput, {
      target: {
        value:
          'Single owner, 4,200 km, quickshifter+ unlocked, comprehensive insurance.',
      },
    });

    const publishBtn = screen.getByRole('button', {
      name: /Publish Listing/i,
    });
    fireEvent.click(publishBtn);

    expect(await screen.findByText('2024 KTM 390 Duke Gen-3')).toBeTruthy();
    expect(
      screen.getByText(/Published listing: 2024 KTM 390 Duke Gen-3!/i),
    ).toBeTruthy();
  });

  it('expands listing details and marks an active listing as SOLD', async () => {
    render(<MarketplaceRemoteApp />);

    const detailButtons = screen.getAllByRole('button', {
      name: /View Listing Details/i,
    });
    fireEvent.click(detailButtons[0]!);

    expect(
      await screen.findByText(/Listing Specification & Validated Media/i),
    ).toBeTruthy();

    const soldButtons = screen.getAllByRole('button', {
      name: /Mark as Sold/i,
    });
    fireEvent.click(soldButtons[0]!);

    expect(
      await screen.findByText(/Listing status updated to SOLD\./i),
    ).toBeTruthy();
  });
});
