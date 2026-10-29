import {
  Body,
  Controller,
  Get,
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
import {
  UserRole,
  type AuthenticatedUserAccount,
  type MechanicItem,
  type MechanicVerificationStatus,
} from '@ridersclub/types';
import {
  CurrentUser,
  JwtAuthGuard,
  OptionalJwtAuthGuard,
  Roles,
  RolesGuard,
} from '../auth/guards/jwt-auth.guard';
import type { JwtAccessPayload } from '../auth/token.service';
import {
  RegisterMechanicDto,
  UpdateMechanicDto,
  VerifyMechanicDto,
} from './dto/mechanic.dto';
import { MechanicsService } from './mechanics.service';

type AuthUserOrPayload = AuthenticatedUserAccount | JwtAccessPayload;

function resolveActorId(user: AuthUserOrPayload): string {
  return 'id' in user ? user.id : user.sub;
}

@ApiTags('mechanics')
@Controller('mechanics')
export class MechanicsController {
  constructor(private readonly mechanicsService: MechanicsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary:
      'List mechanics & service providers with specialty, city, search, and verification status filters',
  })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'verificationStatus', required: false })
  async listMechanics(
    @Query('category') category?: string,
    @Query('city') city?: string,
    @Query('search') search?: string,
    @Query('verificationStatus')
    verificationStatus?: MechanicVerificationStatus,
  ): Promise<MechanicItem[]> {
    return this.mechanicsService.listMechanics({
      category,
      city,
      search,
      verificationStatus,
    });
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get mechanic workshop details by ID' })
  async getMechanicById(@Param('id') id: string): Promise<MechanicItem> {
    return this.mechanicsService.getMechanicById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Self-register a mechanic workshop (always defaults to PENDING_REVIEW until verified by an Admin)',
  })
  async registerMechanic(
    @CurrentUser() user: AuthUserOrPayload,
    @Body() dto: RegisterMechanicDto,
  ): Promise<MechanicItem> {
    return this.mechanicsService.registerMechanic(resolveActorId(user), dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update mechanic workshop details (owner or administrator only)',
  })
  async updateMechanic(
    @Param('id') id: string,
    @CurrentUser() user: AuthUserOrPayload,
    @Body() dto: UpdateMechanicDto,
  ): Promise<MechanicItem> {
    return this.mechanicsService.updateMechanic(
      id,
      resolveActorId(user),
      user.role,
      dto,
    );
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Admin-only endpoint to verify or reject a mechanic provider and stamp verification metadata',
  })
  async verifyMechanic(
    @Param('id') id: string,
    @CurrentUser() user: AuthUserOrPayload,
    @Body() dto: VerifyMechanicDto,
  ): Promise<MechanicItem> {
    return this.mechanicsService.verifyMechanic(
      id,
      resolveActorId(user),
      user.role,
      dto,
    );
  }
}

