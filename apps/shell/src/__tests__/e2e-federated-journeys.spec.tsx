import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ShellApp } from '../ShellApp.js';

afterEach(() => {
  cleanup();
});

describe('Phase 14 — Cross-Micro-Frontend End-to-End Rider Journeys', () => {
  it('completes an end-to-end journey across Marketplace (:5006), Shell 1:1 Direct Chat (:5000), Roadside Help (:5003), and Admin Moderation (:5000/admin)', async () => {
    render(
      <MemoryRouter initialEntries={['/marketplace']}>
        <ShellApp />
      </MemoryRouter>,
    );

    // 1. Marketplace remote loads inside Shell host
    expect(
      await screen.findByText(
        /Secondhand Cars & Bikes Marketplace/i,
        {},
        { timeout: 5000 },
      ),
    ).toBeTruthy();

    // 2. Click "Message" on a Marketplace Seller card -> opens Shell 1:1 Direct Chat Drawer with Listing context
    const messageSellerButtons = await screen.findAllByRole('button', {
      name: /Start private chat with/i,
    });
    expect(messageSellerButtons.length).toBeGreaterThan(0);
    fireEvent.click(messageSellerButtons[0]!);

    expect(
      screen.getByRole('dialog', { name: /Individual Direct Chat Drawer/i }),
    ).toBeTruthy();
    expect(
      screen.getByText(/Initiated from Listing:/i),
    ).toBeTruthy();

    // 3. WCAG AA Keyboard Accessibility: Press Escape to dismiss the 1:1 Direct Chat Drawer
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(
      screen.queryByRole('dialog', { name: /Individual Direct Chat Drawer/i }),
    ).toBeNull();

    // 4. Navigate to Roadside Help (:5003) via Shell navigation and verify Emergency Disclaimer
    const helpLinks = screen.getAllByRole('link', { name: /Roadside Help/i });
    fireEvent.click(helpLinks[0]!);

    expect(
      await screen.findByText(
        /Roadside Assistance & Peer Help/i,
        {},
        { timeout: 5000 },
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(/Not an Official Emergency Service/i),
    ).toBeTruthy();

    // 5. Navigate to Admin & Safety (/admin) via Shell sidebar and file a new Safety Report
    const adminLinks = screen.getAllByRole('link', { name: /Admin & Safety/i });
    fireEvent.click(adminLinks[0]!);

    expect(
      await screen.findByText(/Administrator & Moderation Center/i),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', { name: /File Safety Report/i }),
    );
    fireEvent.change(screen.getByLabelText(/Target Reference ID/i), {
      target: { value: 'list-e2e-99' },
    });
    fireEvent.change(screen.getByLabelText(/Target Title \/ Summary/i), {
      target: { value: 'Suspicious Hayabusa Token Request' },
    });
    fireEvent.change(
      screen.getByLabelText(/Safety Concern \/ Policy Violation Details/i),
      {
        target: {
          value: 'Seller asked for advance wire transfer before viewing.',
        },
      },
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Submit Safety Report/i }),
    );

    expect(
      screen.getByText('Suspicious Hayabusa Token Request'),
    ).toBeTruthy();
    expect(screen.getByTestId('open-reports-count').textContent).toBe('3');
  }, 20000);
});

