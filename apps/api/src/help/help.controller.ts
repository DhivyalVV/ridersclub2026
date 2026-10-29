import {
  Body,
  Controller,
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
  HelpCategory,
  HelpRequestItem,
  HelpRequestStatus,
} from '@ridersclub/types';
import {
  CurrentUser,
  JwtAuthGuard,
  OptionalJwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';
import type { JwtAccessPayload } from '../auth/token.service';
import {
  CreateHelpRequestDto,
  OfferHelpDto,
  UpdateHelpStatusDto,
} from './dto/help.dto';
import { HelpService } from './help.service';

@ApiTags('help')
@Controller('help')
export class HelpController {
  constructor(private readonly helpService: HelpService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary:
      'List roadside help requests with status/category filter and optional nearby distance calculation',
  })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'lat', required: false })
  @ApiQuery({ name: 'lng', required: false })
  @ApiQuery({ name: 'radiusKm', required: false })
  async listHelpRequests(
    @Query('status') status?: HelpRequestStatus,
    @Query('category') category?: HelpCategory,
    @Query('search') search?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radiusKm') radiusKm?: string,
    @CurrentUser() user?: JwtAccessPayload | null,
  ): Promise<HelpRequestItem[]> {
    const parsedLat = lat !== undefined ? Number(lat) : undefined;
    const parsedLng = lng !== undefined ? Number(lng) : undefined;
    const parsedRadius = radiusKm !== undefined ? Number(radiusKm) : undefined;

    return this.helpService.listHelpRequests({
      status,
      category,
      search,
      viewerLat:
        parsedLat !== undefined && !Number.isNaN(parsedLat)
          ? parsedLat
          : undefined,
      viewerLng:
        parsedLng !== undefined && !Number.isNaN(parsedLng)
          ? parsedLng
          : undefined,
      radiusKm:
        parsedRadius !== undefined && !Number.isNaN(parsedRadius)
          ? parsedRadius
          : undefined,
      viewerId: user?.sub,
    });
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get roadside help request details and peer offers' })
  async getHelpRequestById(
    @Param('id') id: string,
    @CurrentUser() user?: JwtAccessPayload | null,
  ): Promise<HelpRequestItem> {
    return this.helpService.getHelpRequestById(id, user?.sub);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Create a roadside help request with explicit opt-in location-sharing consent',
  })
  async createHelpRequest(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreateHelpRequestDto,
  ): Promise<HelpRequestItem> {
    return this.helpService.createHelpRequest(user.sub, dto);
  }

  @Post(':id/offer')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Offer peer assistance on an open roadside help request' })
  async offerAssistance(
    @Param('id') id: string,
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: OfferHelpDto,
  ): Promise<HelpRequestItem> {
    return this.helpService.offerAssistance(id, user.sub, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Update help request status (requester or moderator/admin; auto-redacts GPS coordinates when resolved/cancelled)',
  })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: UpdateHelpStatusDto,
  ): Promise<HelpRequestItem> {
    return this.helpService.updateStatus(id, user, dto);
  }
}

