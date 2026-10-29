import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { HelpCategory, HelpRequestStatus } from '@ridersclub/types';

export class CreateHelpRequestDto {
  @ApiProperty({ enum: HelpCategory, example: HelpCategory.FLAT_TIRE })
  @IsEnum(HelpCategory)
  category!: HelpCategory;

  @ApiProperty({
    example:
      'Rear tube puncture on NH-48 near Tumakuru bypass. Need a portable air inflator or 17mm axle wrench.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(600)
  description!: string;

  @ApiPropertyOptional({ example: 'Hero XPulse 200 4V (White/Blue)' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  vehicleSummary?: string;

  @ApiProperty({
    description:
      'Explicit opt-in consent required before storing or displaying GPS coordinates.',
    example: true,
  })
  @IsBoolean()
  locationConsentGranted!: boolean;

  @ApiPropertyOptional({
    example: 'NH-48 Tumakuru Bypass Toll Plaza',
  })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  locationLabel?: string;

  @ApiPropertyOptional({ example: 13.3409 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 77.101 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}

export class OfferHelpDto {
  @ApiPropertyOptional({
    example: 'I am 12 mins away on NH-48 with a portable CO2/electric inflator and 17mm spanner.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

export class UpdateHelpStatusDto {
  @ApiProperty({
    enum: HelpRequestStatus,
    example: HelpRequestStatus.RESOLVED,
  })
  @IsEnum(HelpRequestStatus)
  status!: HelpRequestStatus;
}

