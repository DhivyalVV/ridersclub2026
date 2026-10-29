import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DirectMessagePrivacy,
  RideStatus,
  UserRole,
  type RideItem,
  type RideParticipantItem,
} from '@ridersclub/types';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService } from '../profiles/profiles.service';
import { CreateRideDto, UpdateRideDto } from './dto/ride.dto';
import {
  ROUTE_MAP_PROVIDER_TOKEN,
  type RouteMapProvider,
} from './route-map.provider';

@Injectable()
export class RidesService {
  private seededCheckComplete = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
    @Inject(ROUTE_MAP_PROVIDER_TOKEN)
    private readonly routeMapProvider: RouteMapProvider,
  ) {}

  async listRides(params: {
    status?: RideStatus;
    search?: string;
    viewerId?: string;
  }): Promise<RideItem[]> {
    await this.ensureInitialRidesSeeded();

    const search = params.search?.trim();

    const rides = await this.prisma.ride.findMany({
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { startLocation: { contains: search, mode: 'insensitive' } },
                { destination: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        organizer: { include: { profile: true } },
        participants: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: { departureAt: 'asc' },
    });

    return rides.map((ride) => this.mapRideToDto(ride, params.viewerId));
  }

  async getRideById(rideId: string, viewerId?: string): Promise<RideItem> {
    await this.ensureInitialRidesSeeded();

    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        organizer: { include: { profile: true } },
        participants: {
          include: {
            user: { include: { profile: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ride) {
      throw new NotFoundException('Group ride not found.');
    }

    const dto = this.mapRideToDto(ride, viewerId);
    const participants: RideParticipantItem[] = ride.participants.map((p) => ({
      id: p.id,
      rideId: p.rideId,
      userId: p.userId,
      joinedAt: p.createdAt.toISOString(),
      user: this.profilesService.mapUserWithProfileToPublicSummary(p.user),
    }));

    return {
      ...dto,
      participants,
    };
  }

  async createRide(organizerId: string, dto: CreateRideDto): Promise<RideItem> {
    const departureDate = new Date(dto.departureAt);
    if (Number.isNaN(departureDate.getTime())) {
      throw new BadRequestException('Invalid departureAt date format.');
    }

    const routePreview = this.routeMapProvider.buildRoutePreview({
      startLocation: dto.startLocation,
      destination: dto.destination,
    });

    const created = await this.prisma.ride.create({
      data: {
        organizerId,
        title: dto.title.trim(),
        description: dto.description.trim(),
        startLocation: dto.startLocation.trim(),
        destination: dto.destination.trim(),
        departureAt: departureDate,
        capacity: dto.capacity,
        estimatedDistanceKm: routePreview.estimatedDistanceKm,
        estimatedDurationMinutes: routePreview.estimatedDurationMinutes,
        status: RideStatus.UPCOMING,
        participants: {
          create: {
            userId: organizerId,
          },
        },
      },
      include: {
        organizer: { include: { profile: true } },
        participants: {
          select: { userId: true },
        },
      },
    });

    return this.mapRideToDto(created, organizerId);
  }

  async updateRide(
    rideId: string,
    actor: { sub: string; role: UserRole },
    dto: UpdateRideDto,
  ): Promise<RideItem> {
    const existing = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        _count: { select: { participants: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException('Group ride not found.');
    }

    const isModeratorOrAdmin =
      actor.role === UserRole.ADMIN || actor.role === UserRole.MODERATOR;

    if (existing.organizerId !== actor.sub && !isModeratorOrAdmin) {
      throw new ForbiddenException(
        'Only the ride organizer or a moderator/admin can update this group ride.',
      );
    }

    if (
      dto.capacity !== undefined &&
      dto.capacity < existing._count.participants
    ) {
      throw new BadRequestException(
        `Cannot reduce ride capacity (${dto.capacity}) below current participant count (${existing._count.participants}).`,
      );
    }

    const updated = await this.prisma.ride.update({
      where: { id: rideId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() }
          : {}),
        ...(dto.startLocation !== undefined
          ? { startLocation: dto.startLocation.trim() }
          : {}),
        ...(dto.destination !== undefined
          ? { destination: dto.destination.trim() }
          : {}),
        ...(dto.departureAt !== undefined
          ? { departureAt: new Date(dto.departureAt) }
          : {}),
        ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      include: {
        organizer: { include: { profile: true } },
        participants: { select: { userId: true } },
      },
    });

    return this.mapRideToDto(updated, actor.sub);
  }

  async cancelRide(
    rideId: string,
    actor: { sub: string; role: UserRole },
  ): Promise<RideItem> {
    return this.updateRide(rideId, actor, { status: RideStatus.CANCELLED });
  }

  async joinRide(
    rideId: string,
    userId: string,
  ): Promise<{ rideId: string; joined: boolean; participantCount: number; capacity: number }> {
    return this.prisma.$transaction(async (tx) => {
      const ride = await tx.ride.findUnique({
        where: { id: rideId },
      });

      if (!ride) {
        throw new NotFoundException('Group ride not found.');
      }

      if (ride.status !== RideStatus.UPCOMING) {
        throw new BadRequestException(
          `Cannot join a ride with status ${ride.status}.`,
        );
      }

      const existingParticipation = await tx.rideParticipant.findUnique({
        where: {
          rideId_userId: {
            rideId,
            userId,
          },
        },
      });

      if (existingParticipation) {
        const count = await tx.rideParticipant.count({ where: { rideId } });
        return {
          rideId,
          joined: true,
          participantCount: count,
          capacity: ride.capacity,
        };
      }

      const currentCount = await tx.rideParticipant.count({
        where: { rideId },
      });

      if (currentCount >= ride.capacity) {
        throw new ConflictException(
          'This group ride has reached maximum capacity.',
        );
      }

      await tx.rideParticipant.create({
        data: {
          rideId,
          userId,
        },
      });

      return {
        rideId,
        joined: true,
        participantCount: currentCount + 1,
        capacity: ride.capacity,
      };
    });
  }

  async leaveRide(
    rideId: string,
    userId: string,
  ): Promise<{ rideId: string; joined: boolean; participantCount: number }> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException('Group ride not found.');
    }

    if (ride.organizerId === userId) {
      throw new BadRequestException(
        'Ride organizers cannot leave their own ride; cancel the ride instead.',
      );
    }

    await this.prisma.rideParticipant.deleteMany({
      where: {
        rideId,
        userId,
      },
    });

    const participantCount = await this.prisma.rideParticipant.count({
      where: { rideId },
    });

    return {
      rideId,
      joined: false,
      participantCount,
    };
  }

  private mapRideToDto(
    ride: {
      id: string;
      title: string;
      description: string;
      startLocation: string;
      destination: string;
      departureAt: Date;
      capacity: number;
      estimatedDistanceKm: number;
      estimatedDurationMinutes: number;
      status: string;
      createdAt: Date;
      organizer: {
        id: string;
        role: string;
        phoneNumber: string | null;
        allowDirectMessages: string;
        profile: {
          userId: string;
          displayName: string;
          username: string;
          avatarUrl: string | null;
          bio: string | null;
          city: string | null;
          showPhone: boolean;
        } | null;
      };
      participants: Array<{ userId: string }>;
    },
    viewerId?: string,
  ): RideItem {
    const isJoinedByViewer = viewerId
      ? ride.participants.some((p) => p.userId === viewerId)
      : false;

    const dateTimeLabel = ride.departureAt.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      id: ride.id,
      title: ride.title,
      description: ride.description,
      startLocation: ride.startLocation,
      destination: ride.destination,
      departureAt: ride.departureAt.toISOString(),
      dateTimeLabel,
      capacity: ride.capacity,
      participantCount: ride.participants.length,
      status: ride.status as RideStatus,
      organizer: this.profilesService.mapUserWithProfileToPublicSummary(ride.organizer),
      isJoinedByViewer,
      routePreview: this.routeMapProvider.buildRoutePreview({
        startLocation: ride.startLocation,
        destination: ride.destination,
        estimatedDistanceKm: ride.estimatedDistanceKm,
        estimatedDurationMinutes: ride.estimatedDurationMinutes,
      }),
      createdAt: ride.createdAt.toISOString(),
    };
  }

  private async ensureInitialRidesSeeded(): Promise<void> {
    if (this.seededCheckComplete) {
      return;
    }
    this.seededCheckComplete = true;

    try {
      const count = await this.prisma.ride.count();
      if (count > 0) {
        return;
      }

      const organizer1 = await this.prisma.user.upsert({
        where: { email: 'vikram.adv@ridersclub.example' },
        update: {},
        create: {
          email: 'vikram.adv@ridersclub.example',
          role: UserRole.MODERATOR,
          allowDirectMessages: DirectMessagePrivacy.EVERYONE,
          profile: {
            create: {
              username: 'vikram_adv',
              displayName: 'Vikramaditya Rao',
              bio: 'Lead ride marshal • Tiger 900 Rally Pro',
              city: 'Bengaluru',
            },
          },
        },
      });

      const organizer2 = await this.prisma.user.upsert({
        where: { email: 'sid.tourer@ridersclub.example' },
        update: {},
        create: {
          email: 'sid.tourer@ridersclub.example',
          role: UserRole.USER,
          allowDirectMessages: DirectMessagePrivacy.EVERYONE,
          profile: {
            create: {
              username: 'sid_tourer',
              displayName: 'Siddharth Menon',
              bio: 'Endurance tourer • V-Strom 650 XT',
              city: 'Kochi',
            },
          },
        },
      });

      await this.prisma.ride.create({
        data: {
          organizerId: organizer1.id,
          title: 'Nandi Hills Sunrise Breakfast Run',
          description:
            'Disciplined staggered formation ride departing Hebbal flyover at 05:30 AM. Mandatory full riding gear (ECE helmet, gloves, jacket, boots).',
          startLocation: 'Hebbal Flyover Toll, Bengaluru',
          destination: 'Nandi Hills Foothills Cafe',
          departureAt: new Date('2026-11-02T05:30:00.000Z'),
          capacity: 20,
          estimatedDistanceKm: 65,
          estimatedDurationMinutes: 85,
          status: RideStatus.UPCOMING,
          participants: {
            create: [{ userId: organizer1.id }, { userId: organizer2.id }],
          },
        },
      });

      await this.prisma.ride.create({
        data: {
          organizerId: organizer2.id,
          title: 'Coorg Coffee Estate Weekend Overnighter',
          description:
            'Two-day touring circuit via Mysuru bypass and Kushalnagar with scenic tarmac and mild estate trails. Suitable for both touring motorcycles and sport sedans.',
          startLocation: 'NICE Road Junction, Kengeri',
          destination: 'Madikeri, Coorg',
          departureAt: new Date('2026-11-15T06:00:00.000Z'),
          capacity: 15,
          estimatedDistanceKm: 255,
          estimatedDurationMinutes: 310,
          status: RideStatus.UPCOMING,
          participants: {
            create: [{ userId: organizer2.id }],
          },
        },
      });
    } catch {
      // Ignore seed race conditions
    }
  }
}

