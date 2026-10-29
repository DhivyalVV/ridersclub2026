import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountStatus,
  DirectMessagePrivacy,
  HelpRequestStatus,
  ListingStatus,
  MechanicVerificationStatus,
  ModerationTargetType,
  ReportStatus,
  RideStatus,
  UserRole,
  type AdminPlatformOverview,
  type ContentReportItem,
  type ModerationAuditLogItem,
} from '@ridersclub/types';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService } from '../profiles/profiles.service';
import {
  AdminUpdateUserStatusDto,
  CreateContentReportDto,
  ResolveContentReportDto,
} from './dto/admin.dto';

interface ContentReportRecordWithReporter {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  reason: string;
  status: string;
  resolutionNotes: string | null;
  resolvedById: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  reporter: {
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

interface AuditLogRecordWithActor {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  createdAt: Date;
  actor: {
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
export class AdminService {
  private seededCheckComplete = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
  ) {}

  async createReport(
    reporterId: string,
    dto: CreateContentReportDto,
  ): Promise<ContentReportItem> {
    const created = await this.prisma.contentReport.create({
      data: {
        reporterId,
        targetType: dto.targetType,
        targetId: dto.targetId.trim(),
        targetLabel: dto.targetLabel.trim(),
        reason: dto.reason.trim(),
        status: ReportStatus.OPEN,
      },
      include: {
        reporter: { include: { profile: true } },
      },
    });

    return this.mapReportToDto(created);
  }

  async getAdminOverview(actorRole: UserRole): Promise<AdminPlatformOverview> {
    this.assertModeratorOrAdmin(actorRole);
    await this.ensureInitialModerationSeeded();

    const [
      totalUsers,
      openReportsCount,
      pendingMechanicsCount,
      activeRidesCount,
      activeHelpRequestsCount,
      activeListingsCount,
      reports,
      auditLogs,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.contentReport.count({
        where: { status: ReportStatus.OPEN },
      }),
      this.prisma.mechanicProfile.count({
        where: {
          verificationStatus: MechanicVerificationStatus.PENDING_REVIEW,
        },
      }),
      this.prisma.ride.count({
        where: { status: RideStatus.UPCOMING },
      }),
      this.prisma.helpRequest.count({
        where: {
          status: {
            in: [
              HelpRequestStatus.OPEN,
              HelpRequestStatus.ASSISTANCE_OFFERED,
            ],
          },
        },
      }),
      this.prisma.marketplaceListing.count({
        where: { status: ListingStatus.ACTIVE },
      }),
      this.prisma.contentReport.findMany({
        include: {
          reporter: { include: { profile: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      this.prisma.moderationAuditLog.findMany({
        include: {
          actor: { include: { profile: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);

    return {
      totalUsers,
      openReportsCount,
      pendingMechanicsCount,
      activeRidesCount,
      activeHelpRequestsCount,
      activeListingsCount,
      reports: reports.map((r) => this.mapReportToDto(r)),
      auditLogs: auditLogs.map((log) => this.mapAuditLogToDto(log)),
    };
  }

  async resolveReport(
    reportId: string,
    actorId: string,
    actorRole: UserRole,
    dto: ResolveContentReportDto,
  ): Promise<{
    report: ContentReportItem;
    auditLog: ModerationAuditLogItem;
  }> {
    this.assertModeratorOrAdmin(actorRole);

    if (
      dto.status !== ReportStatus.ACTIONED &&
      dto.status !== ReportStatus.DISMISSED
    ) {
      throw new BadRequestException(
        'Report resolution status must be ACTIONED or DISMISSED.',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.contentReport.findUnique({
        where: { id: reportId },
      });

      if (!existing) {
        throw new NotFoundException('Content report not found.');
      }

      const updatedReport = await tx.contentReport.update({
        where: { id: reportId },
        data: {
          status: dto.status,
          resolutionNotes: dto.resolutionNotes?.trim() || null,
          resolvedById: actorId,
          resolvedAt: new Date(),
        },
        include: {
          reporter: { include: { profile: true } },
        },
      });

      const createdAuditLog = await tx.moderationAuditLog.create({
        data: {
          actorId,
          action: dto.actionTaken.trim(),
          targetType: existing.targetType,
          targetId: existing.targetId,
          reason:
            dto.resolutionNotes?.trim() ||
            `Report ${reportId} marked ${dto.status}`,
        },
        include: {
          actor: { include: { profile: true } },
        },
      });

      return { updatedReport, createdAuditLog };
    });

    return {
      report: this.mapReportToDto(result.updatedReport),
      auditLog: this.mapAuditLogToDto(result.createdAuditLog),
    };
  }

  async updateUserAccountStatus(
    targetUserId: string,
    actorId: string,
    actorRole: UserRole,
    dto: AdminUpdateUserStatusDto,
  ): Promise<{
    userId: string;
    accountStatus: AccountStatus;
    auditLog: ModerationAuditLogItem;
  }> {
    if (actorRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only an administrator can suspend, deactivate, or reactivate user accounts.',
      );
    }

    if (targetUserId === actorId) {
      throw new BadRequestException(
        'Administrators cannot suspend or deactivate their own active account.',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { id: targetUserId },
      });

      if (!existingUser) {
        throw new NotFoundException('Target user account not found.');
      }

      const updatedUser = await tx.user.update({
        where: { id: targetUserId },
        data: {
          accountStatus: dto.accountStatus,
        },
      });

      const createdAuditLog = await tx.moderationAuditLog.create({
        data: {
          actorId,
          action: `USER_STATUS_${dto.accountStatus}`,
          targetType: ModerationTargetType.USER,
          targetId: targetUserId,
          reason: dto.reason.trim(),
        },
        include: {
          actor: { include: { profile: true } },
        },
      });

      return { updatedUser, createdAuditLog };
    });

    return {
      userId: result.updatedUser.id,
      accountStatus: result.updatedUser.accountStatus as AccountStatus,
      auditLog: this.mapAuditLogToDto(result.createdAuditLog),
    };
  }

  private assertModeratorOrAdmin(role: UserRole): void {
    if (role !== UserRole.ADMIN && role !== UserRole.MODERATOR) {
      throw new ForbiddenException(
        'Moderator or Administrator privileges are required for this action.',
      );
    }
  }

  private mapReportToDto(
    record: ContentReportRecordWithReporter,
  ): ContentReportItem {
    return {
      id: record.id,
      reporterId: record.reporterId,
      targetType: record.targetType as ModerationTargetType,
      targetId: record.targetId,
      targetLabel: record.targetLabel,
      reason: record.reason,
      status: record.status as ReportStatus,
      resolutionNotes: record.resolutionNotes,
      resolvedById: record.resolvedById,
      resolvedAt: record.resolvedAt ? record.resolvedAt.toISOString() : null,
      reporter: this.profilesService.mapUserWithProfileToPublicSummary(
        record.reporter,
      ),
      createdAt: record.createdAt.toISOString(),
    };
  }

  private mapAuditLogToDto(
    record: AuditLogRecordWithActor,
  ): ModerationAuditLogItem {
    return {
      id: record.id,
      actorId: record.actorId,
      action: record.action,
      targetType: record.targetType as ModerationTargetType,
      targetId: record.targetId,
      reason: record.reason,
      actor: this.profilesService.mapUserWithProfileToPublicSummary(
        record.actor,
      ),
      createdAt: record.createdAt.toISOString(),
    };
  }

  private async ensureInitialModerationSeeded(): Promise<void> {
    if (this.seededCheckComplete) {
      return;
    }
    this.seededCheckComplete = true;

    try {
      const count = await this.prisma.contentReport.count();
      if (count > 0) {
        return;
      }

      const adminUser = await this.prisma.user.upsert({
        where: { email: 'admin.governance@ridersclub.example' },
        update: {},
        create: {
          email: 'admin.governance@ridersclub.example',
          role: UserRole.ADMIN,
          allowDirectMessages: DirectMessagePrivacy.EVERYONE,
          profile: {
            create: {
              username: 'rc_admin_safety',
              displayName: 'RidersClub Trust & Safety',
              bio: 'Platform Administrator & Governance Lead',
              city: 'Bengaluru',
            },
          },
        },
      });

      const reporterUser = await this.prisma.user.upsert({
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

      await this.prisma.contentReport.create({
        data: {
          reporterId: reporterUser.id,
          targetType: ModerationTargetType.LISTING,
          targetId: 'list-suspicious-01',
          targetLabel: '2022 Yamaha R15 V4 — Urgent Advance Token Requested',
          reason:
            'Seller requested UPI token payment before allowing physical vehicle inspection.',
          status: ReportStatus.OPEN,
        },
      });

      await this.prisma.contentReport.create({
        data: {
          reporterId: reporterUser.id,
          targetType: ModerationTargetType.MECHANIC,
          targetId: 'mech-2',
          targetLabel: 'Highway 44 Garage & Tire Center',
          reason:
            'Pending trade license verification before granting Verified Provider badge.',
          status: ReportStatus.OPEN,
        },
      });

      await this.prisma.moderationAuditLog.create({
        data: {
          actorId: adminUser.id,
          action: 'MECHANIC_VERIFIED',
          targetType: ModerationTargetType.MECHANIC,
          targetId: 'mech-1',
          reason:
            'Verified GST registration and physical workshop inspection for Apex MotoWorks & Suspension Lab.',
        },
      });
    } catch {
      // Ignore seed race conditions
    }
  }
}

