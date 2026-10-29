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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  AuthenticatedUserAccount,
  GarageVehicleItem,
} from '@ridersclub/types';
import {
  CurrentUser,
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';
import type { JwtAccessPayload } from '../auth/token.service';
import {
  CreateServiceRecordDto,
  CreateVehicleDto,
  CreateVehicleNoteDto,
  UpdateVehicleDto,
} from './dto/garage.dto';
import { GarageService } from './garage.service';

type AuthUserOrPayload = AuthenticatedUserAccount | JwtAccessPayload;

function resolveOwnerId(user: AuthUserOrPayload): string {
  return 'id' in user ? user.id : user.sub;
}

@ApiTags('garage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('garage')
export class GarageController {
  constructor(private readonly garageService: GarageService) {}

  @Get('vehicles')
  @ApiOperation({
    summary:
      'List private vehicles, service history, and notes owned by the authenticated rider',
  })
  async listMyVehicles(
    @CurrentUser() user: AuthUserOrPayload,
  ): Promise<GarageVehicleItem[]> {
    return this.garageService.listMyVehicles(resolveOwnerId(user));
  }

  @Get('vehicles/:id')
  @ApiOperation({
    summary: 'Get a private garage vehicle by ID (strict owner-only access)',
  })
  async getVehicleById(
    @Param('id') id: string,
    @CurrentUser() user: AuthUserOrPayload,
  ): Promise<GarageVehicleItem> {
    return this.garageService.getVehicleById(id, resolveOwnerId(user));
  }

  @Post('vehicles')
  @ApiOperation({ summary: 'Add a new private motorcycle or car to My Garage' })
  async createVehicle(
    @CurrentUser() user: AuthUserOrPayload,
    @Body() dto: CreateVehicleDto,
  ): Promise<GarageVehicleItem> {
    return this.garageService.createVehicle(resolveOwnerId(user), dto);
  }

  @Patch('vehicles/:id')
  @ApiOperation({
    summary:
      'Update private vehicle odometer, reminder, or metadata (owner-only)',
  })
  async updateVehicle(
    @Param('id') id: string,
    @CurrentUser() user: AuthUserOrPayload,
    @Body() dto: UpdateVehicleDto,
  ): Promise<GarageVehicleItem> {
    return this.garageService.updateVehicle(id, resolveOwnerId(user), dto);
  }

  @Delete('vehicles/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a private vehicle and its service logs (owner-only)' })
  async deleteVehicle(
    @Param('id') id: string,
    @CurrentUser() user: AuthUserOrPayload,
  ): Promise<{ deleted: boolean; vehicleId: string }> {
    return this.garageService.deleteVehicle(id, resolveOwnerId(user));
  }

  @Post('vehicles/:id/service-records')
  @ApiOperation({
    summary:
      'Log a new odometer- and cost-validated service record for a private vehicle (owner-only)',
  })
  async addServiceRecord(
    @Param('id') id: string,
    @CurrentUser() user: AuthUserOrPayload,
    @Body() dto: CreateServiceRecordDto,
  ): Promise<GarageVehicleItem> {
    return this.garageService.addServiceRecord(id, resolveOwnerId(user), dto);
  }

  @Post('vehicles/:id/notes')
  @ApiOperation({ summary: 'Add a private maintenance note to a vehicle (owner-only)' })
  async addVehicleNote(
    @Param('id') id: string,
    @CurrentUser() user: AuthUserOrPayload,
    @Body() dto: CreateVehicleNoteDto,
  ): Promise<GarageVehicleItem> {
    return this.garageService.addVehicleNote(id, resolveOwnerId(user), dto);
  }

  @Delete('vehicles/:id/notes/:noteId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a private maintenance note (owner-only)' })
  async deleteVehicleNote(
    @Param('id') id: string,
    @Param('noteId') noteId: string,
    @CurrentUser() user: AuthUserOrPayload,
  ): Promise<GarageVehicleItem> {
    return this.garageService.deleteVehicleNote(
      id,
      noteId,
      resolveOwnerId(user),
    );
  }
}

