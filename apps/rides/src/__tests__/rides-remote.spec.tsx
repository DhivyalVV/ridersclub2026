import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RIDERSCLUB_OPEN_CHAT_EVENT } from '@ridersclub/ui';
import { RidesRemoteApp } from '../RidesRemoteApp.js';

afterEach(() => {
  cleanup();
});

describe('RidesRemoteApp federated remote (Phase 8 Group Rides & Capacity)', () => {
  it('renders upcoming rides, capacity states, and triggers 1:1 chat with ride organizer', () => {
    const chatListener = vi.fn();
    window.addEventListener(RIDERSCLUB_OPEN_CHAT_EVENT, chatListener);

    render(<RidesRemoteApp />);

    expect(screen.getByText('Nandi Hills Sunrise Breakfast Run')).toBeTruthy();
    expect(screen.getByText('Coorg Coffee Estate Weekend Overnighter')).toBeTruthy();

    const msgButton = screen.getByRole('button', {
      name: /Start private chat with Siddharth Menon/i,
    });
    fireEvent.click(msgButton);

    expect(chatListener).toHaveBeenCalledTimes(1);
    window.removeEventListener(RIDERSCLUB_OPEN_CHAT_EVENT, chatListener);
  });

  it('joins an open ride, updates spot counter, and opens Route Map & Roster preview', () => {
    render(<RidesRemoteApp />);

    expect(screen.getByText('4 Spots Open')).toBeTruthy();

    const joinBtn = screen.getByRole('button', { name: 'Join Ride' });
    fireEvent.click(joinBtn);

    expect(screen.getByText('3 Spots Open')).toBeTruthy();
    expect(screen.getByText('Joined Roster')).toBeTruthy();

    const rosterButtons = screen.getAllByRole('button', {
      name: /View Roster & Route Map/i,
    });
    fireEvent.click(rosterButtons[0]!);

    expect(screen.getByText(/OpenStreetMap \/ OSRM Route Adapter/i)).toBeTruthy();
    expect(
      screen.getByText(/Assembly & Safety Briefing: Hebbal Flyover Toll, Bengaluru/i),
    ).toBeTruthy();
  });

  it('hosts a new capacity-managed group ride via the Host a Ride form', () => {
    render(<RidesRemoteApp />);

    fireEvent.click(screen.getByRole('button', { name: /Host a Ride/i }));

    fireEvent.change(screen.getByLabelText(/Ride Title/i), {
      target: { value: 'Yercaud 20-Hairpin Sunday Climb' },
    });
    fireEvent.change(screen.getByLabelText(/Starting Assembly Point/i), {
      target: { value: 'Electronic City Phase 1 Toll' },
    });
    fireEvent.change(screen.getByLabelText(/Destination/i), {
      target: { value: 'Yercaud Lake Viewpoint' },
    });
    fireEvent.change(screen.getByLabelText(/Briefing & Mandatory Gear Notes/i), {
      target: {
        value: 'Full riding gear mandatory. Regroup at Krishnagiri highway breakfast stop.',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /Publish Group Ride/i }));

    expect(screen.getByText('Yercaud 20-Hairpin Sunday Climb')).toBeTruthy();
    expect(
      screen.getByText(/Hosted new group ride "Yercaud 20-Hairpin Sunday Climb"/i),
    ).toBeTruthy();
  });
});
