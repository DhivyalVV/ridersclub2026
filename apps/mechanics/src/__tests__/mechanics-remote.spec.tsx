import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RIDERSCLUB_OPEN_CHAT_EVENT } from '@ridersclub/ui';
import { MechanicsRemoteApp } from '../MechanicsRemoteApp.js';

afterEach(() => {
  cleanup();
});

describe('MechanicsRemoteApp federated remote (Phase 10)', () => {
  it('distinguishes verified vs unverified mechanics and triggers 1:1 chat with provider', () => {
    const chatListener = vi.fn();
    window.addEventListener(RIDERSCLUB_OPEN_CHAT_EVENT, chatListener);

    render(<MechanicsRemoteApp />);

    expect(screen.getByText('Admin Verified Provider')).toBeTruthy();
    expect(screen.getByText(/Unverified \(PENDING REVIEW\)/i)).toBeTruthy();

    const msgButton = screen.getByRole('button', {
      name: /Start private chat with Arjun Shetty/i,
    });
    fireEvent.click(msgButton);

    expect(chatListener).toHaveBeenCalledTimes(1);
    window.removeEventListener(RIDERSCLUB_OPEN_CHAT_EVENT, chatListener);
  });

  it('registers a new workshop and defaults its status to Unverified (PENDING REVIEW)', async () => {
    render(<MechanicsRemoteApp />);

    const registerBtn = screen.getByRole('button', {
      name: /Register Workshop/i,
    });
    fireEvent.click(registerBtn);

    const nameInput = screen.getByLabelText(/Workshop \/ Business Name/i);
    fireEvent.change(nameInput, {
      target: { value: 'Torque Factory Customs' },
    });

    const addressInput = screen.getByLabelText(/Street Address \/ Landmark/i);
    fireEvent.change(addressInput, {
      target: { value: '18 Koramangala 80ft Road' },
    });

    const submitBtn = screen.getByRole('button', {
      name: /Submit Workshop Registration/i,
    });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Torque Factory Customs')).toBeTruthy();
    expect(
      screen.getByText(
        /Listed as Unverified \(PENDING REVIEW\) until administrator verification is completed\./i,
      ),
    ).toBeTruthy();
  });

  it('allows an administrator to verify a pending workshop provider', async () => {
    render(<MechanicsRemoteApp />);

    const verifyBtn = screen.getByRole('button', {
      name: /Verify Provider \(Admin\)/i,
    });
    fireEvent.click(verifyBtn);

    expect(
      await screen.findByText(/Provider marked as Admin Verified!/i),
    ).toBeTruthy();
    expect(screen.getAllByText('Admin Verified Provider')).toHaveLength(2);
  });
});
