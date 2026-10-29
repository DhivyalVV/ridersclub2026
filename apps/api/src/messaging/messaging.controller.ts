import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  MessageEvent,
  Param,
  Post,
  Query,
  Req,
  Sse,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import type {
  DirectConversationItem,
  DirectMessageItem,
} from '@ridersclub/types';
import {
  CurrentUser,
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';
import { TokenService, type JwtAccessPayload } from '../auth/token.service';
import { OpenConversationDto, SendDirectMessageDto } from './dto/messaging.dto';
import { MessagingRealtimeService } from './messaging-realtime.service';
import { MessagingService } from './messaging.service';

@ApiTags('messaging')
@Controller('conversations')
export class MessagingController {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly realtimeService: MessagingRealtimeService,
    private readonly tokenService: TokenService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List all deduplicated 1:1 conversations and unread counters for current user',
  })
  async listMyConversations(
    @CurrentUser() user: JwtAccessPayload,
  ): Promise<DirectConversationItem[]> {
    return this.messagingService.listMyConversations(user.sub);
  }

  @Post('open')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Open or retrieve a deduplicated 1:1 conversation with another user',
  })
  async openConversation(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: OpenConversationDto,
  ): Promise<DirectConversationItem> {
    return this.messagingService.openOrGetConversation(user.sub, dto);
  }

  @Sse('stream')
  @ApiOperation({
    summary: 'Real-time Server-Sent Events stream for 1:1 direct messages and read receipts',
  })
  streamEvents(
    @Query('token') queryToken: string | undefined,
    @Req() req: Request,
  ): Observable<MessageEvent> {
    const authHeader = req.headers.authorization;
    const rawToken =
      queryToken?.trim() ||
      (authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '');

    if (!rawToken) {
      throw new UnauthorizedException('Missing authentication token for messaging stream.');
    }

    const payload = this.tokenService.verifyAccessToken(rawToken);
    return this.realtimeService.subscribeForUser(payload.sub);
  }

  @Get(':id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List message history for a 1:1 conversation' })
  async listMessages(
    @Param('id') id: string,
    @CurrentUser() user: JwtAccessPayload,
  ): Promise<DirectMessageItem[]> {
    return this.messagingService.listMessages(id, user.sub);
  }

  @Post(':id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a message in a 1:1 conversation' })
  async sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: SendDirectMessageDto,
  ): Promise<DirectMessageItem> {
    return this.messagingService.sendMessage(id, user.sub, dto);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark unread messages in a 1:1 conversation as read' })
  async markRead(
    @Param('id') id: string,
    @CurrentUser() user: JwtAccessPayload,
  ): Promise<{ conversationId: string; markedCount: number }> {
    return this.messagingService.markConversationRead(id, user.sub);
  }
}

