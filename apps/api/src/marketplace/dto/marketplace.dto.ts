import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ListingStatus, VehicleType } from '@ridersclub/types';

export class ListingPhotoUploadDto {
  @ApiProperty({ example: 'street-triple-front.jpg' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fileName!: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @ApiProperty({ example: 1450000 })
  @IsInt()
  @Min(1)
  @Max(5242880)
  sizeBytes!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500000)
  dataUrl?: string;
}

export class CreateMarketplaceListingDto {
  @ApiProperty({ enum: VehicleType, example: VehicleType.MOTORCYCLE })
  @IsEnum(VehicleType)
  vehicleType!: VehicleType;

  @ApiProperty({ example: 'Triumph' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(80)
  make!: string;

  @ApiProperty({ example: 'Street Triple 765 R' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(120)
  model!: string;

  @ApiProperty({ example: 2023 })
  @IsInt()
  @Min(1950)
  @Max(2035)
  year!: number;

  @ApiProperty({ example: 6400 })
  @IsInt()
  @Min(0)
  @Max(2000000)
  odometerKm!: number;

  @ApiProperty({ example: 895000 })
  @IsInt()
  @Min(1000)
  @Max(100000000)
  askingPriceInr!: number;

  @ApiProperty({
    example:
      'Single owner, 6,400 km on odometer, full dealership service history, frame sliders and radiator guard installed.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1200)
  description!: string;

  @ApiProperty({ example: 'Koramangala, Bengaluru' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  location!: string;

  @ApiPropertyOptional({ type: [ListingPhotoUploadDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => ListingPhotoUploadDto)
  photos?: ListingPhotoUploadDto[];
}

export class UpdateMarketplaceListingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  make?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1950)
  @Max(2035)
  year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2000000)
  odometerKm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(100000000)
  askingPriceInr?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(1200)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  location?: string;

  @ApiPropertyOptional({ enum: ListingStatus })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;
}

