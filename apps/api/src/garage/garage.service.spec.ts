import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { VehicleType } from '@ridersclub/types';
import { GarageService } from './garage.service';

describe('GarageService (Phase 11 Private Garage)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enforces strict owner-only access on getVehicleById, updateVehicle, and addServiceRecord', async () => {
    const mockPrisma = {
      garageVehicle: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'veh-1',
          ownerId: 'owner-user-1',
          type: VehicleType.MOTORCYCLE,
          make: 'Royal Enfield',
          model: 'Himalayan 450',
          year: 2025,
          registrationLabel: 'KA-01-RC-4500',
          currentOdometerKm: 11420,
          nextReminderLabel: null,
          nextServiceOdometerKm: 12000,
          createdAt: new Date(),
          updatedAt: new Date(),
          serviceRecords: [],
          notes: [],
        }),
      },
      $transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) =>
        cb({
          garageVehicle: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'veh-1',
              ownerId: 'owner-user-1',
              currentOdometerKm: 11420,
              serviceRecords: [],
            }),
          },
        }),
      ),
    };

    const service = new GarageService(mockPrisma as never);

    await expect(
      service.getVehicleById('veh-1', 'intruder-user-2'),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      service.updateVehicle('veh-1', 'intruder-user-2', {
        currentOdometerKm: 12000,
      }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      service.addServiceRecord('veh-1', 'intruder-user-2', {
        serviceDate: '2026-10-20',
        odometerKm: 11500,
        description: 'Unauthorized service log attempt',
        costInr: 1200,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects a service record with an odometer reading lower than the latest recorded service', async () => {
    const mockPrisma = {
      $transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) =>
        cb({
          garageVehicle: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'veh-1',
              ownerId: 'owner-user-1',
              currentOdometerKm: 11420,
              serviceRecords: [{ odometerKm: 10050 }],
            }),
          },
        }),
      ),
    };

    const service = new GarageService(mockPrisma as never);

    await expect(
      service.addServiceRecord('veh-1', 'owner-user-1', {
        serviceDate: '2026-10-20',
        odometerKm: 9500,
        description: 'Rolled-back odometer reading',
        costInr: 2500,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('advances currentOdometerKm automatically when logging a service record with a higher odometer', async () => {
    const updateVehicleMock = jest
      .fn()
      .mockImplementation(async ({ data }) => ({
        id: 'veh-1',
        ownerId: 'owner-user-1',
        type: VehicleType.MOTORCYCLE,
        make: 'Royal Enfield',
        model: 'Himalayan 450',
        year: 2025,
        registrationLabel: 'KA-01-RC-4500',
        currentOdometerKm: data.currentOdometerKm,
        nextReminderLabel: 'Valve check at 15,000 km',
        nextServiceOdometerKm: 15000,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-10-22T00:00:00.000Z'),
        serviceRecords: [
          {
            id: 'srv-new',
            vehicleId: 'veh-1',
            serviceDate: new Date('2026-10-22T00:00:00.000Z'),
            odometerKm: 12150,
            description: '12,000 km Valve Clearance & Chain Kit',
            costInr: 6200,
            workshopName: 'Apex MotoWorks',
            createdAt: new Date('2026-10-22T00:00:00.000Z'),
          },
        ],
        notes: [],
      }));

    const mockPrisma = {
      $transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) =>
        cb({
          garageVehicle: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'veh-1',
              ownerId: 'owner-user-1',
              currentOdometerKm: 11420,
              serviceRecords: [{ odometerKm: 10050 }],
            }),
            update: updateVehicleMock,
          },
          vehicleServiceRecord: {
            create: jest.fn().mockResolvedValue({}),
          },
        }),
      ),
    };

    const service = new GarageService(mockPrisma as never);

    const updated = await service.addServiceRecord('veh-1', 'owner-user-1', {
      serviceDate: '2026-10-22',
      odometerKm: 12150,
      description: '12,000 km Valve Clearance & Chain Kit',
      costInr: 6200,
      workshopName: 'Apex MotoWorks',
    });

    expect(updateVehicleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { currentOdometerKm: 12150 },
      }),
    );
    expect(updated.currentOdometerKm).toBe(12150);
    expect(updated.serviceHistory[0]?.odometerKm).toBe(12150);
  });

  it('adds a private vehicle note for the owner and rejects non-owners', async () => {
    const createNoteMock = jest.fn().mockResolvedValue({});
    const mockPrisma = {
      garageVehicle: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'veh-1',
          ownerId: 'owner-user-1',
          type: VehicleType.CAR,
          make: 'Skoda',
          model: 'Octavia 2.0 TSI',
          year: 2023,
          registrationLabel: 'KA-03-TS-2023',
          currentOdometerKm: 28900,
          nextReminderLabel: null,
          nextServiceOdometerKm: 30000,
          createdAt: new Date(),
          updatedAt: new Date(),
          serviceRecords: [],
          notes: [
            {
              id: 'note-1',
              vehicleId: 'veh-1',
              content: 'Cold tire pressure: 33 PSI front / 35 PSI rear',
              createdAt: new Date(),
            },
          ],
        }),
      },
      vehicleNote: {
        create: createNoteMock,
      },
    };

    const service = new GarageService(mockPrisma as never);

    await expect(
      service.addVehicleNote('veh-1', 'other-user', {
        content: 'Unauthorized note',
      }),
    ).rejects.toThrow(ForbiddenException);

    const result = await service.addVehicleNote('veh-1', 'owner-user-1', {
      content: 'Cold tire pressure: 33 PSI front / 35 PSI rear',
    });

    expect(createNoteMock).toHaveBeenCalledTimes(1);
    expect(result.notes).toHaveLength(1);
  });
});

