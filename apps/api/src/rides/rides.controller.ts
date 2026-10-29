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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { RideItem, RideStatus } from '@ridersclub/types';
import {
  CurrentUser,
  JwtAuthGuard,
  OptionalJwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';
import type { JwtAccessPayload } from '../auth/token.service';
import { CreateRideDto, UpdateRideDto } from './dto/ride.dto';
import { RidesService } from './rides.service';

@ApiTags('rides')
@Controller('rides')
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'List group rides with status filter and route map preview' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  async listRides(
    @Query('status') status?: RideStatus,
    @Query('search') search?: string,
    @CurrentUser() user?: JwtAccessPayload | null,
  ): Promise<RideItem[]> {
    return this.ridesService.listRides({
      status,
      search,
      viewerId: user?.sub,
    });
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get group ride details, route preview, and confirmed participant roster' })
  async getRideById(
    @Param('id') id: string,
    @CurrentUser() user?: JwtAccessPayload | null,
  ): Promise<RideItem> {
    return this.ridesService.getRideById(id, user?.sub);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Host a new capacity-managed group ride' })
  async createRide(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreateRideDto,
  ): Promise<RideItem> {
    return this.ridesService.createRide(user.sub, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a group ride (organizer or moderator/admin only)' })
  async updateRide(
    @Param('id') id: string,
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: UpdateRideDto,
  ): Promise<RideItem> {
    return this.ridesService.updateRide(id, user, dto);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel an upcoming group ride (organizer or moderator/admin only)' })
  async cancelRide(
    @Param('id') id: string,
    @CurrentUser() user: JwtAccessPayload,
  ): Promise<RideItem> {
    return this.ridesService.cancelRide(id, user);
  }

  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join a group ride with transactional capacity enforcement' })
  async joinRide(
    @Param('id') id: string,
    @CurrentUser() user: JwtAccessPayload,
  ): Promise<{ rideId: string; joined: boolean; participantCount: number; capacity: number }> {
    return this.ridesService.joinRide(id, user.sub);
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave a group ride' })
  async leaveRide(
    @Param('id') id: string,
    @CurrentUser() user: JwtAccessPayload,
  ): Promise<{ rideId: string; joined: boolean; participantCount: number }> {
    return this.ridesService.leaveRide(id, user.sub);
  }
}

