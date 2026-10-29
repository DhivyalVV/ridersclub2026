import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RIDERSCLUB_OPEN_CHAT_EVENT } from '@ridersclub/ui';
import { HelpRemoteApp } from '../HelpRemoteApp.js';

afterEach(() => {
  cleanup();
});

describe('HelpRemoteApp federated remote (Phase 9)', () => {
  it('displays official emergency disclaimer, explicit location consent toggle, and 1:1 chat trigger', () => {
    const chatListener = vi.fn();
    window.addEventListener(RIDERSCLUB_OPEN_CHAT_EVENT, chatListener);

    render(<HelpRemoteApp />);

    expect(
      screen.getByText(/Not an Official Emergency Service/i),
    ).toBeTruthy();

    expect(
      screen.getByText(/Post Help Request \(No GPS Coordinates\)/i),
    ).toBeTruthy();

    const consentCheckbox = screen.getByRole('checkbox');
    fireEvent.click(consentCheckbox);

    expect(
      screen.getByText(/Post Help Request \(With Location\)/i),
    ).toBeTruthy();

    const msgButton = screen.getByRole('button', {
      name: /Start private chat with Karthik Nair/i,
    });
    fireEvent.click(msgButton);

    expect(chatListener).toHaveBeenCalledTimes(1);
    window.removeEventListener(RIDERSCLUB_OPEN_CHAT_EVENT, chatListener);
  });

  it('publishes a new roadside help request with explicit location consent', async () => {
    render(<HelpRemoteApp />);

    const consentCheckbox = screen.getByRole('checkbox');
    fireEvent.click(consentCheckbox);

    const openComposerBtn = screen.getByRole('button', {
      name: /Post Help Request \(With Location\)/i,
    });
    fireEvent.click(openComposerBtn);

    const vehicleInput = screen.getByLabelText(/Vehicle Make & Model/i);
    fireEvent.change(vehicleInput, {
      target: { value: 'KTM 390 Adventure SW' },
    });

    const descInput = screen.getByLabelText(
      /What tools or assistance do you need\?/i,
    );
    fireEvent.change(descInput, {
      target: {
        value: 'Clutch cable snapped near Kanakapura NICE exit toll.',
      },
    });

    const publishBtn = screen.getByRole('button', {
      name: /Publish Help Request/i,
    });
    fireEvent.click(publishBtn);

    expect(
      await screen.findByText(
        /Clutch cable snapped near Kanakapura NICE exit toll\./i,
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /Help request published with explicit location consent\./i,
      ),
    ).toBeTruthy();
  });

  it('records peer assistance offers and redacts coordinates when marked resolved', async () => {
    render(<HelpRemoteApp />);

    const offerButtons = screen.getAllByRole('button', {
      name: /Offer Assistance/i,
    });
    fireEvent.click(offerButtons[0]!);

    expect(
      await screen.findByText(
        /Assistance offer recorded! Coordinate via 1:1 chat\./i,
      ),
    ).toBeTruthy();

    const resolveButtons = screen.getAllByRole('button', {
      name: /Mark Resolved/i,
    });
    fireEvent.click(resolveButtons[0]!);

    expect(
      await screen.findByText(
        /Location auto-redacted after request closure/i,
      ),
    ).toBeTruthy();
  });
});
