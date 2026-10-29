import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { VehicleType } from '@ridersclub/types';

export class CreateVehicleDto {
  @ApiProperty({ enum: VehicleType, example: VehicleType.MOTORCYCLE })
  @IsEnum(VehicleType)
  type!: VehicleType;

  @ApiProperty({ example: 'Royal Enfield' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(80)
  make!: string;

  @ApiProperty({ example: 'Himalayan 450 Hanle Black' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(120)
  model!: string;

  @ApiProperty({ example: 2025 })
  @IsInt()
  @Min(1950)
  @Max(2035)
  year!: number;

  @ApiPropertyOptional({ example: 'KA-01-RC-4500' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  registrationLabel?: string;

  @ApiProperty({ example: 11420 })
  @IsInt()
  @Min(0)
  @Max(2000000)
  currentOdometerKm!: number;

  @ApiPropertyOptional({
    example: 'Chain slack & valve clearance check at 12,000 km',
  })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  nextReminderLabel?: string;

  @ApiPropertyOptional({ example: 12000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2000000)
  nextServiceOdometerKm?: number;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional({ example: 'Royal Enfield' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  make?: string;

  @ApiPropertyOptional({ example: 'Himalayan 450 Hanle Black' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  model?: string;

  @ApiPropertyOptional({ example: 2025 })
  @IsOptional()
  @IsInt()
  @Min(1950)
  @Max(2035)
  year?: number;

  @ApiPropertyOptional({ example: 'KA-01-RC-4500' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  registrationLabel?: string;

  @ApiPropertyOptional({ example: 11850 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2000000)
  currentOdometerKm?: number;

  @ApiPropertyOptional({
    example: 'Chain slack & valve clearance check at 12,000 km',
  })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  nextReminderLabel?: string;

  @ApiPropertyOptional({ example: 12000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2000000)
  nextServiceOdometerKm?: number;
}

export class CreateServiceRecordDto {
  @ApiProperty({ example: '2026-10-15' })
  @IsDateString()
  serviceDate!: string;

  @ApiProperty({ example: 11500 })
  @IsInt()
  @Min(0)
  @Max(2000000)
  odometerKm!: number;

  @ApiProperty({
    example:
      '10,000 km Periodic Service — Fully synthetic 10W40 oil, oil filter, air filter, and throttle body sync.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(600)
  description!: string;

  @ApiProperty({ example: 4650 })
  @IsInt()
  @Min(0)
  @Max(10000000)
  costInr!: number;

  @ApiPropertyOptional({ example: 'Apex MotoWorks & Suspension Lab' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  workshopName?: string;
}

export class CreateVehicleNoteDto {
  @ApiProperty({
    example: 'Front fork preload set to standard; rear +2 clicks for luggage.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(400)
  content!: string;
}

