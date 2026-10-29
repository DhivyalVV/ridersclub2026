import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  UserRole,
  type AccountStatus,
  type AdminPlatformOverview,
  type AuthenticatedUserAccount,
  type ContentReportItem,
  type ModerationAuditLogItem,
} from '@ridersclub/types';
import {
  CurrentUser,
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '../auth/guards/jwt-auth.guard';
import type { JwtAccessPayload } from '../auth/token.service';
import { AdminService } from './admin.service';
import {
  AdminUpdateUserStatusDto,
  CreateContentReportDto,
  ResolveContentReportDto,
} from './dto/admin.dto';

type AuthUserOrPayload = AuthenticatedUserAccount | JwtAccessPayload;

function resolveActorId(user: AuthUserOrPayload): string {
  return 'id' in user ? user.id : user.sub;
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('reports')
  @ApiOperation({
    summary:
      'Submit a content or safety report against a blog, community, user, help request, mechanic, or listing',
  })
  async createReport(
    @CurrentUser() user: AuthUserOrPayload,
    @Body() dto: CreateContentReportDto,
  ): Promise<ContentReportItem> {
    return this.adminService.createReport(resolveActorId(user), dto);
  }

  @Get('overview')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Get platform moderation overview, open content reports queue, and immutable audit logs (Moderator/Admin only)',
  })
  async getAdminOverview(
    @CurrentUser() user: AuthUserOrPayload,
  ): Promise<AdminPlatformOverview> {
    return this.adminService.getAdminOverview(user.role);
  }

  @Patch('reports/:id/resolve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Action or dismiss a content report and record an immutable ModerationAuditLog entry (Moderator/Admin only)',
  })
  async resolveReport(
    @Param('id') id: string,
    @CurrentUser() user: AuthUserOrPayload,
    @Body() dto: ResolveContentReportDto,
  ): Promise<{
    report: ContentReportItem;
    auditLog: ModerationAuditLogItem;
  }> {
    return this.adminService.resolveReport(
      id,
      resolveActorId(user),
      user.role,
      dto,
    );
  }

  @Patch('users/:userId/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Suspend, deactivate, or reactivate a user account and record an immutable ModerationAuditLog entry (Admin only)',
  })
  async updateUserAccountStatus(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthUserOrPayload,
    @Body() dto: AdminUpdateUserStatusDto,
  ): Promise<{
    userId: string;
    accountStatus: AccountStatus;
    auditLog: ModerationAuditLogItem;
  }> {
    return this.adminService.updateUserAccountStatus(
      userId,
      resolveActorId(user),
      user.role,
      dto,
    );
  }
}

