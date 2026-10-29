import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  AccountStatus,
  DirectMessagePrivacy,
  ModerationTargetType,
  ReportStatus,
  UserRole,
} from '@ridersclub/types';
import { AdminService } from './admin.service';

describe('AdminService (Phase 13 — Moderation, RBAC & Audit Logs)', () => {
  const mockReporter = {
    id: 'user-reporter-1',
    role: UserRole.USER,
    phoneNumber: null,
    allowDirectMessages: DirectMessagePrivacy.EVERYONE,
    profile: {
      userId: 'user-reporter-1',
      username: 'reporter_one',
      displayName: 'Reporter One',
      bio: 'Rider',
      avatarUrl: null,
      city: 'Bengaluru',
      showPhone: false,
    },
  };

  const mockAdminActor = {
    id: 'admin-1',
    role: UserRole.ADMIN,
    phoneNumber: null,
    allowDirectMessages: DirectMessagePrivacy.EVERYONE,
    profile: {
      userId: 'admin-1',
      username: 'rc_admin',
      displayName: 'RC Admin',
      bio: 'Governance Admin',
      avatarUrl: null,
      city: 'Bengaluru',
      showPhone: false,
    },
  };

  function createService() {
    const mockTx = {
      contentReport: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'report-1',
          reporterId: 'user-reporter-1',
          targetType: ModerationTargetType.LISTING,
          targetId: 'list-suspicious-01',
          targetLabel: 'Suspicious Listing',
          reason: 'Requested advance UPI payment',
          status: ReportStatus.OPEN,
        }),
        update: jest.fn().mockImplementation(
          async ({
            data,
          }: {
            data: {
              status: string;
              resolutionNotes: string | null;
              resolvedById: string;
              resolvedAt: Date;
            };
          }) => ({
            id: 'report-1',
            reporterId: 'user-reporter-1',
            targetType: ModerationTargetType.LISTING,
            targetId: 'list-suspicious-01',
            targetLabel: 'Suspicious Listing',
            reason: 'Requested advance UPI payment',
            status: data.status,
            resolutionNotes: data.resolutionNotes,
            resolvedById: data.resolvedById,
            resolvedAt: data.resolvedAt,
            createdAt: new Date('2026-10-21T10:00:00.000Z'),
            updatedAt: new Date('2026-10-21T11:00:00.000Z'),
            reporter: mockReporter,
          }),
        ),
      },
      moderationAuditLog: {
        create: jest.fn().mockImplementation(
          async ({
            data,
          }: {
            data: {
              actorId: string;
              action: string;
              targetType: string;
              targetId: string;
              reason: string;
            };
          }) => ({
            id: 'audit-1',
            actorId: data.actorId,
            action: data.action,
            targetType: data.targetType,
            targetId: data.targetId,
            reason: data.reason,
            createdAt: new Date('2026-10-21T11:00:00.000Z'),
            actor: mockAdminActor,
          }),
        ),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-target-99',
          accountStatus: AccountStatus.ACTIVE,
        }),
        update: jest.fn().mockImplementation(
          async ({
            data,
          }: {
            data: {
              accountStatus: string;
            };
          }) => ({
            id: 'user-target-99',
            accountStatus: data.accountStatus,
          }),
        ),
      },
    };

    const mockPrisma = {
      contentReport: {
        count: jest.fn().mockResolvedValue(2),
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      moderationAuditLog: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      user: {
        count: jest.fn().mockResolvedValue(12),
      },
      mechanicProfile: {
        count: jest.fn().mockResolvedValue(1),
      },
      ride: {
        count: jest.fn().mockResolvedValue(3),
      },
      helpRequest: {
        count: jest.fn().mockResolvedValue(1),
      },
      marketplaceListing: {
        count: jest.fn().mockResolvedValue(4),
      },
      $transaction: jest.fn(async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
    };

    const mockProfilesService = {
      mapUserWithProfileToPublicSummary: jest.fn(
        (u: {
          id: string;
          role: UserRole;
          profile?: {
            username?: string;
            displayName?: string;
            bio?: string | null;
            city?: string | null;
          } | null;
        }) => ({
          id: u.id,
          username: u.profile?.username ?? 'user',
          displayName: u.profile?.displayName ?? 'User',
          avatarUrl: null,
          bio: u.profile?.bio ?? null,
          city: u.profile?.city ?? null,
          role: u.role,
          canReceiveDirectMessage: true,
        }),
      ),
    };

    const service = new AdminService(
      mockPrisma as never,
      mockProfilesService as never,
    );

    return { service, mockPrisma, mockTx };
  }

  it('rejects getAdminOverview and resolveReport for regular USER role (ForbiddenException)', async () => {
    const { service } = createService();

    await expect(service.getAdminOverview(UserRole.USER)).rejects.toThrow(
      ForbiddenException,
    );

    await expect(
      service.resolveReport('report-1', 'user-1', UserRole.USER, {
        status: ReportStatus.ACTIONED,
        actionTaken: 'LISTING_REMOVED',
        resolutionNotes: 'Confirmed scam attempt',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows MODERATOR or ADMIN to resolve a report and writes an immutable ModerationAuditLog entry', async () => {
    const { service, mockTx } = createService();

    const resolved = await service.resolveReport(
      'report-1',
      'admin-1',
      UserRole.MODERATOR,
      {
        status: ReportStatus.ACTIONED,
        actionTaken: 'LISTING_REMOVED_FRAUD_PREVENTION',
        resolutionNotes: 'Verified advance token request; listing removed.',
      },
    );

    expect(resolved.report.status).toBe(ReportStatus.ACTIONED);
    expect(resolved.auditLog.action).toBe('LISTING_REMOVED_FRAUD_PREVENTION');
    expect(resolved.auditLog.targetType).toBe(ModerationTargetType.LISTING);
    expect(mockTx.moderationAuditLog.create).toHaveBeenCalledTimes(1);
  });

  it('enforces ADMIN-only privileges for user account status updates and prevents self-suspension', async () => {
    const { service, mockTx } = createService();

    // Moderator cannot suspend user accounts (Admin only)
    await expect(
      service.updateUserAccountStatus(
        'user-target-99',
        'mod-1',
        UserRole.MODERATOR,
        {
          accountStatus: AccountStatus.SUSPENDED,
          reason: 'Repeated spam',
        },
      ),
    ).rejects.toThrow(ForbiddenException);

    // Admin cannot suspend their own account
    await expect(
      service.updateUserAccountStatus('admin-1', 'admin-1', UserRole.ADMIN, {
        accountStatus: AccountStatus.SUSPENDED,
        reason: 'Self test',
      }),
    ).rejects.toThrow(BadRequestException);

    // Admin can suspend another user account and record an audit log
    const updated = await service.updateUserAccountStatus(
      'user-target-99',
      'admin-1',
      UserRole.ADMIN,
      {
        accountStatus: AccountStatus.SUSPENDED,
        reason: 'Fraudulent token payment requests in marketplace',
      },
    );

    expect(updated.accountStatus).toBe(AccountStatus.SUSPENDED);
    expect(updated.auditLog.action).toBe('USER_STATUS_SUSPENDED');
    expect(mockTx.moderationAuditLog.create).toHaveBeenCalledTimes(1);
  });
});
