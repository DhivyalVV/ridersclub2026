import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  VehicleType,
  type GarageVehicleItem,
  type VehicleNoteItem,
  type VehicleServiceRecordItem,
} from '@ridersclub/types';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateServiceRecordDto,
  CreateVehicleDto,
  CreateVehicleNoteDto,
  UpdateVehicleDto,
} from './dto/garage.dto';

interface GarageVehicleRecordWithRelations {
  id: string;
  ownerId: string;
  type: string;
  make: string;
  model: string;
  year: number;
  registrationLabel: string | null;
  currentOdometerKm: number;
  nextReminderLabel: string | null;
  nextServiceOdometerKm: number | null;
  createdAt: Date;
  updatedAt: Date;
  serviceRecords: Array<{
    id: string;
    vehicleId: string;
    serviceDate: Date;
    odometerKm: number;
    description: string;
    costInr: number;
    workshopName: string | null;
    createdAt: Date;
  }>;
  notes: Array<{
    id: string;
    vehicleId: string;
    content: string;
    createdAt: Date;
  }>;
}

@Injectable()
export class GarageService {
  private readonly seededOwners = new Set<string>();

  constructor(private readonly prisma: PrismaService) {}

  async listMyVehicles(ownerId: string): Promise<GarageVehicleItem[]> {
    await this.ensureInitialVehiclesSeededForOwner(ownerId);

    const records = await this.prisma.garageVehicle.findMany({
      where: { ownerId },
      include: {
        serviceRecords: {
          orderBy: [{ odometerKm: 'desc' }, { serviceDate: 'desc' }],
        },
        notes: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((record) => this.mapVehicleToDto(record));
  }

  async getVehicleById(
    vehicleId: string,
    ownerId: string,
  ): Promise<GarageVehicleItem> {
    const record = await this.prisma.garageVehicle.findUnique({
      where: { id: vehicleId },
      include: {
        serviceRecords: {
          orderBy: [{ odometerKm: 'desc' }, { serviceDate: 'desc' }],
        },
        notes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!record) {
      throw new NotFoundException('Garage vehicle not found.');
    }

    if (record.ownerId !== ownerId) {
      throw new ForbiddenException(
        'Garage records are private. Only the vehicle owner can view this vehicle.',
      );
    }

    return this.mapVehicleToDto(record);
  }

  async createVehicle(
    ownerId: string,
    dto: CreateVehicleDto,
  ): Promise<GarageVehicleItem> {
    if (dto.currentOdometerKm < 0) {
      throw new BadRequestException('Odometer reading cannot be negative.');
    }

    if (
      dto.nextServiceOdometerKm !== undefined &&
      dto.nextServiceOdometerKm < dto.currentOdometerKm
    ) {
      throw new BadRequestException(
        'Next service reminder odometer must be greater than or equal to current odometer.',
      );
    }

    const created = await this.prisma.garageVehicle.create({
      data: {
        ownerId,
        type: dto.type,
        make: dto.make.trim(),
        model: dto.model.trim(),
        year: dto.year,
        registrationLabel: dto.registrationLabel?.trim() || null,
        currentOdometerKm: dto.currentOdometerKm,
        nextReminderLabel: dto.nextReminderLabel?.trim() || null,
        nextServiceOdometerKm: dto.nextServiceOdometerKm ?? null,
      },
      include: {
        serviceRecords: true,
        notes: true,
      },
    });

    return this.mapVehicleToDto(created);
  }

  async updateVehicle(
    vehicleId: string,
    ownerId: string,
    dto: UpdateVehicleDto,
  ): Promise<GarageVehicleItem> {
    const existing = await this.prisma.garageVehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!existing) {
      throw new NotFoundException('Garage vehicle not found.');
    }

    if (existing.ownerId !== ownerId) {
      throw new ForbiddenException(
        'Garage records are private. Only the vehicle owner can update this vehicle.',
      );
    }

    if (
      dto.currentOdometerKm !== undefined &&
      dto.currentOdometerKm < existing.currentOdometerKm
    ) {
      throw new BadRequestException(
        'Updated odometer reading cannot be lower than current recorded odometer.',
      );
    }

    const updated = await this.prisma.garageVehicle.update({
      where: { id: vehicleId },
      data: {
        ...(dto.make !== undefined ? { make: dto.make.trim() } : {}),
        ...(dto.model !== undefined ? { model: dto.model.trim() } : {}),
        ...(dto.year !== undefined ? { year: dto.year } : {}),
        ...(dto.registrationLabel !== undefined
          ? { registrationLabel: dto.registrationLabel.trim() || null }
          : {}),
        ...(dto.currentOdometerKm !== undefined
          ? { currentOdometerKm: dto.currentOdometerKm }
          : {}),
        ...(dto.nextReminderLabel !== undefined
          ? { nextReminderLabel: dto.nextReminderLabel.trim() || null }
          : {}),
        ...(dto.nextServiceOdometerKm !== undefined
          ? { nextServiceOdometerKm: dto.nextServiceOdometerKm }
          : {}),
      },
      include: {
        serviceRecords: {
          orderBy: [{ odometerKm: 'desc' }, { serviceDate: 'desc' }],
        },
        notes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return this.mapVehicleToDto(updated);
  }

  async deleteVehicle(
    vehicleId: string,
    ownerId: string,
  ): Promise<{ deleted: boolean; vehicleId: string }> {
    const existing = await this.prisma.garageVehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!existing) {
      throw new NotFoundException('Garage vehicle not found.');
    }

    if (existing.ownerId !== ownerId) {
      throw new ForbiddenException(
        'Garage records are private. Only the vehicle owner can delete this vehicle.',
      );
    }

    await this.prisma.garageVehicle.delete({
      where: { id: vehicleId },
    });

    return { deleted: true, vehicleId };
  }

  async addServiceRecord(
    vehicleId: string,
    ownerId: string,
    dto: CreateServiceRecordDto,
  ): Promise<GarageVehicleItem> {
    if (dto.odometerKm < 0) {
      throw new BadRequestException('Service odometer cannot be negative.');
    }
    if (dto.costInr < 0) {
      throw new BadRequestException('Service cost cannot be negative.');
    }

    const parsedDate = new Date(dto.serviceDate);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Invalid serviceDate format.');
    }

    const updatedVehicle = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.garageVehicle.findUnique({
        where: { id: vehicleId },
        include: {
          serviceRecords: {
            orderBy: { odometerKm: 'desc' },
            take: 1,
          },
        },
      });

      if (!existing) {
        throw new NotFoundException('Garage vehicle not found.');
      }

      if (existing.ownerId !== ownerId) {
        throw new ForbiddenException(
          'Garage records are private. Only the vehicle owner can log service records.',
        );
      }

      const highestLoggedOdometer = existing.serviceRecords[0]?.odometerKm ?? 0;
      if (dto.odometerKm < highestLoggedOdometer) {
        throw new BadRequestException(
          `Service odometer reading (${dto.odometerKm} km) cannot be lower than the most recent logged service odometer (${highestLoggedOdometer} km).`,
        );
      }

      await tx.vehicleServiceRecord.create({
        data: {
          vehicleId,
          serviceDate: parsedDate,
          odometerKm: dto.odometerKm,
          description: dto.description.trim(),
          costInr: dto.costInr,
          workshopName: dto.workshopName?.trim() || null,
        },
      });

      const nextCurrentOdometer = Math.max(
        existing.currentOdometerKm,
        dto.odometerKm,
      );

      return tx.garageVehicle.update({
        where: { id: vehicleId },
        data: {
          currentOdometerKm: nextCurrentOdometer,
        },
        include: {
          serviceRecords: {
            orderBy: [{ odometerKm: 'desc' }, { serviceDate: 'desc' }],
          },
          notes: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    });

    return this.mapVehicleToDto(updatedVehicle);
  }

  async addVehicleNote(
    vehicleId: string,
    ownerId: string,
    dto: CreateVehicleNoteDto,
  ): Promise<GarageVehicleItem> {
    const existing = await this.prisma.garageVehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!existing) {
      throw new NotFoundException('Garage vehicle not found.');
    }

    if (existing.ownerId !== ownerId) {
      throw new ForbiddenException(
        'Garage records are private. Only the vehicle owner can add notes.',
      );
    }

    await this.prisma.vehicleNote.create({
      data: {
        vehicleId,
        content: dto.content.trim(),
      },
    });

    return this.getVehicleById(vehicleId, ownerId);
  }

  async deleteVehicleNote(
    vehicleId: string,
    noteId: string,
    ownerId: string,
  ): Promise<GarageVehicleItem> {
    const existing = await this.prisma.garageVehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!existing) {
      throw new NotFoundException('Garage vehicle not found.');
    }

    if (existing.ownerId !== ownerId) {
      throw new ForbiddenException(
        'Garage records are private. Only the vehicle owner can delete notes.',
      );
    }

    await this.prisma.vehicleNote.deleteMany({
      where: { id: noteId, vehicleId },
    });

    return this.getVehicleById(vehicleId, ownerId);
  }

  private mapVehicleToDto(
    record: GarageVehicleRecordWithRelations,
  ): GarageVehicleItem {
    const serviceHistory: VehicleServiceRecordItem[] =
      record.serviceRecords.map((srv) => ({
        id: srv.id,
        vehicleId: srv.vehicleId,
        serviceDate: srv.serviceDate.toISOString().slice(0, 10),
        odometerKm: srv.odometerKm,
        description: srv.description,
        costInr: srv.costInr,
        workshopName: srv.workshopName,
        createdAt: srv.createdAt.toISOString(),
      }));

    const notes: VehicleNoteItem[] = record.notes.map((n) => ({
      id: n.id,
      vehicleId: n.vehicleId,
      content: n.content,
      createdAt: n.createdAt.toISOString(),
    }));

    return {
      id: record.id,
      ownerId: record.ownerId,
      type: record.type as VehicleType,
      make: record.make,
      model: record.model,
      year: record.year,
      registrationLabel: record.registrationLabel,
      currentOdometerKm: record.currentOdometerKm,
      nextReminderLabel: record.nextReminderLabel,
      nextServiceOdometerKm: record.nextServiceOdometerKm,
      notes,
      serviceHistory,
      createdAt: record.createdAt.toISOString(),
    };
  }

  private async ensureInitialVehiclesSeededForOwner(
    ownerId: string,
  ): Promise<void> {
    if (this.seededOwners.has(ownerId)) {
      return;
    }
    this.seededOwners.add(ownerId);

    try {
      const count = await this.prisma.garageVehicle.count({
        where: { ownerId },
      });
      if (count > 0) {
        return;
      }

      await this.prisma.garageVehicle.create({
        data: {
          ownerId,
          type: VehicleType.MOTORCYCLE,
          make: 'Royal Enfield',
          model: 'Himalayan 450 Hanle Black',
          year: 2025,
          registrationLabel: 'KA-01-RC-4500',
          currentOdometerKm: 11420,
          nextReminderLabel:
            'Chain slack & valve clearance check at 12,000 km',
          nextServiceOdometerKm: 12000,
          notes: {
            create: [
              {
                content:
                  'Front fork preload set to standard; rear +2 clicks for luggage.',
              },
              {
                content: 'Installed sintered front brake pads at 9,800 km.',
              },
            ],
          },
          serviceRecords: {
            create: [
              {
                serviceDate: new Date('2026-09-14T00:00:00.000Z'),
                odometerKm: 10050,
                description:
                  '10,000 km Periodic Service — Fully synthetic 10W40 oil, oil filter, air filter, and throttle body sync.',
                costInr: 4650,
                workshopName: 'Apex MotoWorks & Suspension Lab',
              },
              {
                serviceDate: new Date('2026-04-02T00:00:00.000Z'),
                odometerKm: 5120,
                description:
                  '5,000 km Inspection — Oil top-up, chain clean & lube, brake fluid bleed.',
                costInr: 1850,
                workshopName: 'Authorized Service Center',
              },
            ],
          },
        },
      });

      await this.prisma.garageVehicle.create({
        data: {
          ownerId,
          type: VehicleType.CAR,
          make: 'Skoda',
          model: 'Octavia 2.0 TSI L&K',
          year: 2023,
          registrationLabel: 'KA-03-TS-2023',
          currentOdometerKm: 28900,
          nextReminderLabel: 'Annual Haldex/DSG fluid inspection at 30,000 km',
          nextServiceOdometerKm: 30000,
          notes: {
            create: [
              {
                content:
                  'Cold tire pressure: 33 PSI front / 35 PSI rear for highway runs.',
              },
              {
                content:
                  'Michelin Pilot Sport 4 tires rotated at 25,000 km.',
              },
            ],
          },
          serviceRecords: {
            create: [
              {
                serviceDate: new Date('2026-07-20T00:00:00.000Z'),
                odometerKm: 25100,
                description:
                  'Annual Scheduled Maintenance — VW 508.00 oil change, cabin pollen filter, and wheel alignment.',
                costInr: 16400,
                workshopName: 'European Performance Garage',
              },
            ],
          },
        },
      });
    } catch {
      // Ignore seed race conditions
    }
  }
}

