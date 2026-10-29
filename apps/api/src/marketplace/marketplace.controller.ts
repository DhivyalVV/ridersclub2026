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
import type {
  AuthenticatedUserAccount,
  ListingSortOption,
  ListingStatus,
  MarketplaceListingItem,
  VehicleType,
} from '@ridersclub/types';
import {
  CurrentUser,
  JwtAuthGuard,
  OptionalJwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';
import type { JwtAccessPayload } from '../auth/token.service';
import {
  CreateMarketplaceListingDto,
  UpdateMarketplaceListingDto,
} from './dto/marketplace.dto';
import { MarketplaceService } from './marketplace.service';

type AuthUserOrPayload = AuthenticatedUserAccount | JwtAccessPayload;

function resolveActorId(user: AuthUserOrPayload): string {
  return 'id' in user ? user.id : user.sub;
}

@ApiTags('marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('listings')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary:
      'List secondhand car and motorcycle listings with type, status, price range, search, and sort',
  })
  @ApiQuery({ name: 'vehicleType', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'minPrice', required: false })
  @ApiQuery({ name: 'maxPrice', required: false })
  @ApiQuery({ name: 'sort', required: false })
  async listListings(
    @Query('vehicleType') vehicleType?: VehicleType,
    @Query('status') status?: ListingStatus,
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sort') sort?: ListingSortOption,
  ): Promise<MarketplaceListingItem[]> {
    const parsedMin = minPrice !== undefined ? Number(minPrice) : undefined;
    const parsedMax = maxPrice !== undefined ? Number(maxPrice) : undefined;

    return this.marketplaceService.listListings({
      vehicleType,
      status,
      search,
      minPrice:
        parsedMin !== undefined && !Number.isNaN(parsedMin)
          ? parsedMin
          : undefined,
      maxPrice:
        parsedMax !== undefined && !Number.isNaN(parsedMax)
          ? parsedMax
          : undefined,
      sort,
    });
  }

  @Get('listings/:id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get marketplace listing details and seller summary' })
  async getListingById(
    @Param('id') id: string,
  ): Promise<MarketplaceListingItem> {
    return this.marketplaceService.getListingById(id);
  }

  @Post('listings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Create a new secondhand vehicle listing with validated photo uploads',
  })
  async createListing(
    @CurrentUser() user: AuthUserOrPayload,
    @Body() dto: CreateMarketplaceListingDto,
  ): Promise<MarketplaceListingItem> {
    return this.marketplaceService.createListing(resolveActorId(user), dto);
  }

  @Patch('listings/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Update marketplace listing details or status (seller or moderator/admin only)',
  })
  async updateListing(
    @Param('id') id: string,
    @CurrentUser() user: AuthUserOrPayload,
    @Body() dto: UpdateMarketplaceListingDto,
  ): Promise<MarketplaceListingItem> {
    return this.marketplaceService.updateListing(
      id,
      resolveActorId(user),
      user.role,
      dto,
    );
  }
}

