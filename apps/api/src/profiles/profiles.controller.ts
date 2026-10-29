import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type {
  AuthenticatedUserAccount,
  PublicUserSummary,
} from '@ridersclub/types';
import {
  CurrentUser,
  JwtAuthGuard,
  OptionalJwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfilesService } from './profiles.service';

@ApiTags('Rider Profiles & Privacy')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'List or search public rider profiles with privacy & blocking rules applied',
  })
  @ApiQuery({ name: 'search', required: false })
  async listProfiles(
    @Query('search') search?: string,
    @CurrentUser() viewer?: AuthenticatedUserAccount,
  ): Promise<PublicUserSummary[]> {
    return this.profilesService.listPublicProfiles(search, viewer?.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update the signed-in rider profile and privacy settings' })
  async updateMyProfile(
    @CurrentUser() user: AuthenticatedUserAccount,
    @Body() dto: UpdateProfileDto,
  ): Promise<AuthenticatedUserAccount> {
    return this.profilesService.updateMyProfile(user.id, dto);
  }

  @Get(':usernameOrId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'View another rider public profile by username or UUID' })
  async getPublicProfile(
    @Param('usernameOrId') usernameOrId: string,
    @CurrentUser() viewer?: AuthenticatedUserAccount,
  ): Promise<PublicUserSummary> {
    return this.profilesService.getPublicProfileByUsernameOrId(
      usernameOrId,
      viewer?.id,
    );
  }

  @Post(':targetUserId/block')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Block another user to prevent direct messaging and interaction' })
  async blockUser(
    @CurrentUser() user: AuthenticatedUserAccount,
    @Param('targetUserId') targetUserId: string,
  ): Promise<{ blocked: boolean; targetUserId: string }> {
    return this.profilesService.blockUser(user.id, targetUserId);
  }

  @Delete(':targetUserId/block')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unblock a previously blocked user' })
  async unblockUser(
    @CurrentUser() user: AuthenticatedUserAccount,
    @Param('targetUserId') targetUserId: string,
  ): Promise<{ blocked: boolean; targetUserId: string }> {
    return this.profilesService.unblockUser(user.id, targetUserId);
  }
}

