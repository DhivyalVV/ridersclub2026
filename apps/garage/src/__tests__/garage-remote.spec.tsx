import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { GarageRemoteApp } from '../GarageRemoteApp.js';

afterEach(() => {
  cleanup();
});

describe('GarageRemoteApp federated remote (Phase 11)', () => {
  it('renders private vehicle records and switches between motorcycle and car service logs', () => {
    render(<GarageRemoteApp />);

    expect(
      screen.getByText(/Private by Default \(Owner-Only Records\)/i),
    ).toBeTruthy();
    expect(screen.getByText(/10,000 km Periodic Service/i)).toBeTruthy();

    const carButton = screen.getByRole('button', {
      name: /Skoda Octavia 2.0 TSI L&K/i,
    });
    fireEvent.click(carButton);

    expect(
      screen.getByText(
        /Annual Scheduled Maintenance — VW 508.00 oil change/i,
      ),
    ).toBeTruthy();
  });

  it('adds a new vehicle to the private garage and switches to it', async () => {
    render(<GarageRemoteApp />);

    const addVehicleBtn = screen.getByRole('button', { name: /Add Vehicle/i });
    fireEvent.click(addVehicleBtn);

    const makeInput = screen.getByLabelText(/Make \/ Brand/i);
    fireEvent.change(makeInput, { target: { value: 'Triumph' } });

    const modelInput = screen.getByLabelText(/Model & Variant/i);
    fireEvent.change(modelInput, { target: { value: 'Scrambler 400 X' } });

    const saveBtn = screen.getByRole('button', {
      name: /Save Vehicle to Garage/i,
    });
    fireEvent.click(saveBtn);

    expect(
      await screen.findByText(
        /Added Triumph Scrambler 400 X to your private garage\./i,
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(/Service History — Triumph Scrambler 400 X/i),
    ).toBeTruthy();
  });

  it('logs a new odometer-validated service record and adds a private vehicle note', async () => {
    render(<GarageRemoteApp />);

    const logServiceBtn = screen.getByRole('button', { name: /Log Service/i });
    fireEvent.click(logServiceBtn);

    const odoInput = screen.getByLabelText(/Odometer Reading \(km\)/i);
    fireEvent.change(odoInput, { target: { value: '12200' } });

    const descInput = screen.getByLabelText(
      /Work Performed & Parts Replaced/i,
    );
    fireEvent.change(descInput, {
      target: {
        value: '12,000 km Valve Clearance &DID X-Ring Chain Replacement',
      },
    });

    const saveServiceBtn = screen.getByRole('button', {
      name: /Save Service Entry/i,
    });
    fireEvent.click(saveServiceBtn);

    expect(
      await screen.findByText(
        /12,000 km Valve Clearance &DID X-Ring Chain Replacement/i,
      ),
    ).toBeTruthy();

    const noteInput = screen.getByLabelText(/New private vehicle note/i);
    fireEvent.change(noteInput, {
      target: { value: 'Set chain slack to 32mm after DID install' },
    });

    const addNoteBtn = screen.getByRole('button', { name: /Add Note/i });
    fireEvent.click(addNoteBtn);

    expect(
      await screen.findByText(/Set chain slack to 32mm after DID install/i),
    ).toBeTruthy();
  });
});
