import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  MessageEvent,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import type {
  CommunityChatMessageItem,
  CommunityDetailResponse,
  CommunityItem,
  CommunityMemberItem,
  CommunityMemberRole,
  CommunityMembershipStatus,
} from '@ridersclub/types';
import {
  CurrentUser,
  JwtAuthGuard,
  OptionalJwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';
import { TokenService, type JwtAccessPayload } from '../auth/token.service';
import { CommunitiesService } from './communities.service';
import { CreateCommunityDto, CreateCommunityMessageDto } from './dto/community.dto';

@ApiTags('communities')
@Controller('communities')
export class CommunitiesController {
  constructor(
    private readonly communitiesService: CommunitiesService,
    private readonly tokenService: TokenService,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'List and search riding communities with membership status' })
  @ApiQuery({ name: 'search', required: false })
  async listCommunities(
    @Query('search') search?: string,
    @CurrentUser() user?: JwtAccessPayload | null,
  ): Promise<CommunityItem[]> {
    return this.communitiesService.listCommunities({
      search,
      viewerId: user?.sub,
    });
  }

  @Sse('stream')
  @ApiOperation({
    summary: 'Real-time Server-Sent Events stream for community group chat messages',
  })
  streamCommunityMessages(
    @Query('token') queryToken: string | undefined,
    @Req() req: Request,
  ): Observable<MessageEvent> {
    const authHeader = req.headers.authorization;
    const rawToken =
      queryToken?.trim() ||
      (authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '');

    let viewerId: string | undefined;
    if (rawToken) {
      try {
        const payload = this.tokenService.verifyAccessToken(rawToken);
        viewerId = payload.sub;
      } catch {
        // Proceed as anonymous viewer for public communities
      }
    }

    return this.communitiesService.subscribeToStream(viewerId);
  }

  @Get(':idOrSlug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get community details, approved roster, and pending join requests' })
  async getCommunityDetails(
    @Param('idOrSlug') idOrSlug: string,
    @CurrentUser() user?: JwtAccessPayload | null,
  ): Promise<CommunityDetailResponse> {
    return this.communitiesService.getCommunityDetails(idOrSlug, user);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new public or private riding community' })
  async createCommunity(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreateCommunityDto,
  ): Promise<CommunityItem> {
    return this.communitiesService.createCommunity(user.sub, dto);
  }

  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Join a public community immediately or request membership in a private community',
  })
  async joinCommunity(
    @Param('id') id: string,
    @CurrentUser() user: JwtAccessPayload,
  ): Promise<{
    communityId: string;
    status: CommunityMembershipStatus;
    role: CommunityMemberRole;
  }> {
    return this.communitiesService.joinCommunity(id, user.sub);
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave a community' })
  async leaveCommunity(
    @Param('id') id: string,
    @CurrentUser() user: JwtAccessPayload,
  ): Promise<{ communityId: string; left: boolean }> {
    return this.communitiesService.leaveCommunity(id, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Delete a community (Admins: any community; Owner: own private community only)',
  })
  async deleteCommunity(
    @Param('id') id: string,
    @CurrentUser() user: JwtAccessPayload,
  ): Promise<{ communityId: string; deleted: boolean }> {
    return this.communitiesService.deleteCommunity(id, user);
  }

  @Patch(':id/members/:memberUserId/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Approve a pending membership request for a private community (Founder/Moderator/Admin)',
  })
  async approveMember(
    @Param('id') id: string,
    @Param('memberUserId') memberUserId: string,
    @CurrentUser() user: JwtAccessPayload,
  ): Promise<CommunityMemberItem> {
    return this.communitiesService.approveMember(id, memberUserId, user);
  }

  @Get(':id/messages')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'List persistent messages in community chat' })
  async listMessages(
    @Param('id') id: string,
    @CurrentUser() user?: JwtAccessPayload | null,
  ): Promise<CommunityChatMessageItem[]> {
    return this.communitiesService.listMessages(id, user);
  }

  @Post(':id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a message to community chat (approved members only)' })
  async postMessage(
    @Param('id') id: string,
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreateCommunityMessageDto,
  ): Promise<CommunityChatMessageItem> {
    return this.communitiesService.postMessage(id, user.sub, dto);
  }
}

