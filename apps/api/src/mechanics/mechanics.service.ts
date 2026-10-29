import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DirectMessagePrivacy,
  MechanicVerificationStatus,
  UserRole,
  type MechanicItem,
} from '@ridersclub/types';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService } from '../profiles/profiles.service';
import {
  RegisterMechanicDto,
  UpdateMechanicDto,
  VerifyMechanicDto,
} from './dto/mechanic.dto';

interface MechanicRecordWithOwner {
  id: string;
  ownerId: string;
  businessName: string;
  description: string;
  serviceCategories: string[];
  address: string;
  city: string;
  contactPhone: string;
  contactPhonePublic: boolean;
  verificationStatus: string;
  verifiedAt: Date | null;
  verifiedByAdminId: string | null;
  verificationNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    role: string;
    phoneNumber: string | null;
    allowDirectMessages: string;
    profile: {
      userId: string;
      username: string;
      displayName: string;
      bio: string | null;
      avatarUrl: string | null;
      city: string | null;
      showPhone: boolean;
    } | null;
  };
}

@Injectable()
export class MechanicsService {
  private seededCheckComplete = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
  ) {}

  async listMechanics(params: {
    category?: string;
    city?: string;
    search?: string;
    verificationStatus?: MechanicVerificationStatus;
  }): Promise<MechanicItem[]> {
    await this.ensureInitialMechanicsSeeded();

    const category = params.category?.trim();
    const city = params.city?.trim();
    const search = params.search?.trim();

    const records = await this.prisma.mechanicProfile.findMany({
      where: {
        ...(params.verificationStatus
          ? { verificationStatus: params.verificationStatus }
          : {}),
        ...(city
          ? { city: { contains: city, mode: 'insensitive' } }
          : {}),
        ...(search
          ? {
              OR: [
                { businessName: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        owner: { include: { profile: true } },
      },
      orderBy: [
        { verificationStatus: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    const mapped = records.map((rec) => this.mapMechanicToDto(rec));

    if (category && category.toUpperCase() !== 'ALL') {
      const lowerCat = category.toLowerCase();
      return mapped.filter((item) =>
        item.serviceCategories.some((c) => c.toLowerCase().includes(lowerCat)),
      );
    }

    return mapped;
  }

  async getMechanicById(mechanicId: string): Promise<MechanicItem> {
    await this.ensureInitialMechanicsSeeded();

    const record = await this.prisma.mechanicProfile.findUnique({
      where: { id: mechanicId },
      include: {
        owner: { include: { profile: true } },
      },
    });

    if (!record) {
      throw new NotFoundException('Mechanic profile not found.');
    }

    return this.mapMechanicToDto(record);
  }

  async registerMechanic(
    ownerId: string,
    dto: RegisterMechanicDto,
  ): Promise<MechanicItem> {
    const existing = await this.prisma.mechanicProfile.findUnique({
      where: { ownerId },
    });

    if (existing) {
      throw new ConflictException(
        'You have already registered a mechanic profile for this account.',
      );
    }

    // Self-registration NEVER marks a provider as VERIFIED automatically.
    // It always starts in PENDING_REVIEW until an ADMIN verifies credentials.
    const created = await this.prisma.mechanicProfile.create({
      data: {
        ownerId,
        businessName: dto.businessName.trim(),
        description: dto.description.trim(),
        serviceCategories: dto.serviceCategories.map((c) => c.trim()),
        address: dto.address.trim(),
        city: dto.city.trim(),
        contactPhone: dto.contactPhone.trim(),
        contactPhonePublic: Boolean(dto.contactPhonePublic),
        verificationStatus: MechanicVerificationStatus.PENDING_REVIEW,
        verifiedAt: null,
        verifiedByAdminId: null,
        verificationNotes: null,
      },
      include: {
        owner: { include: { profile: true } },
      },
    });

    return this.mapMechanicToDto(created);
  }

  async updateMechanic(
    mechanicId: string,
    actorId: string,
    actorRole: UserRole,
    dto: UpdateMechanicDto,
  ): Promise<MechanicItem> {
    const existing = await this.prisma.mechanicProfile.findUnique({
      where: { id: mechanicId },
    });

    if (!existing) {
      throw new NotFoundException('Mechanic profile not found.');
    }

    if (existing.ownerId !== actorId && actorRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only the workshop owner or an administrator can update this listing.',
      );
    }

    const updated = await this.prisma.mechanicProfile.update({
      where: { id: mechanicId },
      data: {
        ...(dto.businessName !== undefined
          ? { businessName: dto.businessName.trim() }
          : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() }
          : {}),
        ...(dto.serviceCategories !== undefined
          ? { serviceCategories: dto.serviceCategories.map((c) => c.trim()) }
          : {}),
        ...(dto.address !== undefined ? { address: dto.address.trim() } : {}),
        ...(dto.city !== undefined ? { city: dto.city.trim() } : {}),
        ...(dto.contactPhone !== undefined
          ? { contactPhone: dto.contactPhone.trim() }
          : {}),
        ...(dto.contactPhonePublic !== undefined
          ? { contactPhonePublic: dto.contactPhonePublic }
          : {}),
      },
      include: {
        owner: { include: { profile: true } },
      },
    });

    return this.mapMechanicToDto(updated);
  }

  async verifyMechanic(
    mechanicId: string,
    adminId: string,
    actorRole: UserRole,
    dto: VerifyMechanicDto,
  ): Promise<MechanicItem> {
    if (actorRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only an administrator can verify or reject a mechanic provider.',
      );
    }

    const existing = await this.prisma.mechanicProfile.findUnique({
      where: { id: mechanicId },
    });

    if (!existing) {
      throw new NotFoundException('Mechanic profile not found.');
    }

    const isVerified = dto.status === MechanicVerificationStatus.VERIFIED;

    const updated = await this.prisma.mechanicProfile.update({
      where: { id: mechanicId },
      data: {
        verificationStatus: dto.status,
        verifiedAt: isVerified ? new Date() : null,
        verifiedByAdminId: isVerified ? adminId : null,
        verificationNotes: dto.verificationNotes?.trim() || null,
      },
      include: {
        owner: { include: { profile: true } },
      },
    });

    return this.mapMechanicToDto(updated);
  }

  private mapMechanicToDto(record: MechanicRecordWithOwner): MechanicItem {
    return {
      id: record.id,
      ownerId: record.ownerId,
      businessName: record.businessName,
      description: record.description,
      serviceCategories: record.serviceCategories,
      address: record.address,
      city: record.city,
      contactPhonePublic: record.contactPhonePublic,
      displayPhone: record.contactPhonePublic
        ? record.contactPhone
        : this.maskPhoneNumber(record.contactPhone),
      verificationStatus:
        record.verificationStatus as MechanicVerificationStatus,
      verifiedAt: record.verifiedAt ? record.verifiedAt.toISOString() : null,
      verificationNotes: record.verificationNotes,
      owner: this.profilesService.mapUserWithProfileToPublicSummary(
        record.owner,
      ),
      createdAt: record.createdAt.toISOString(),
    };
  }

  private maskPhoneNumber(rawPhone: string): string {
    const trimmed = rawPhone.trim();
    if (trimmed.length <= 4) {
      return '•••' + trimmed;
    }
    const prefix = trimmed.slice(0, Math.min(8, trimmed.length - 4));
    const suffix = trimmed.slice(-2);
    return `${prefix.trim()} •••${suffix}`;
  }

  private async ensureInitialMechanicsSeeded(): Promise<void> {
    if (this.seededCheckComplete) {
      return;
    }
    this.seededCheckComplete = true;

    try {
      const count = await this.prisma.mechanicProfile.count();
      if (count > 0) {
        return;
      }

      const owner1 = await this.prisma.user.upsert({
        where: { email: 'arjun.apexmoto@ridersclub.example' },
        update: {},
        create: {
          email: 'arjun.apexmoto@ridersclub.example',
          role: UserRole.USER,
          allowDirectMessages: DirectMessagePrivacy.EVERYONE,
          profile: {
            create: {
              username: 'arjun_apexmoto',
              displayName: 'Arjun Shetty',
              bio: 'Master Technician • 14 years multi-brand big bike & car experience',
              city: 'Bengaluru',
            },
          },
        },
      });

      const owner2 = await this.prisma.user.upsert({
        where: { email: 'farhan.hwy44@ridersclub.example' },
        update: {},
        create: {
          email: 'farhan.hwy44@ridersclub.example',
          role: UserRole.USER,
          allowDirectMessages: DirectMessagePrivacy.EVERYONE,
          profile: {
            create: {
              username: 'farhan_hwy44',
              displayName: 'Farhan Ali',
              bio: '24x7 highway tire & brake specialist',
              city: 'Hyderabad',
            },
          },
        },
      });

      await this.prisma.mechanicProfile.create({
        data: {
          ownerId: owner1.id,
          businessName: 'Apex MotoWorks & Suspension Lab',
          description:
            'Factory-trained suspension tuning, Ohlins/WP rebuilds, Bosch ECU diagnostics, and comprehensive track/touring prep.',
          serviceCategories: [
            'Suspension Tuning',
            'ECU Diagnostics',
            'Periodic Service',
          ],
          address: '42 Indiranagar 100ft Road, HAL 2nd Stage',
          city: 'Bengaluru',
          contactPhone: '+91 98450 77812',
          contactPhonePublic: false,
          verificationStatus: MechanicVerificationStatus.VERIFIED,
          verifiedAt: new Date('2026-10-15T10:00:00.000Z'),
          verificationNotes:
            'Verified GST registration and physical workshop inspection in Indiranagar.',
        },
      });

      await this.prisma.mechanicProfile.create({
        data: {
          ownerId: owner2.id,
          businessName: 'Highway 44 Garage & Tire Center',
          description:
            'High-speed dynamic wheel balancing, sintered brake overhauls, and emergency flatbed recovery along NH-44.',
          serviceCategories: [
            'Tire Balancing',
            'Brake Overhaul',
            'Emergency Towing',
          ],
          address: 'Plot 19, Medchal Highway Service Road',
          city: 'Hyderabad',
          contactPhone: '+91 90001 44288',
          contactPhonePublic: false,
          verificationStatus: MechanicVerificationStatus.PENDING_REVIEW,
          verifiedAt: null,
          verificationNotes: null,
        },
      });
    } catch {
      // Ignore seed race conditions
    }
  }
}

