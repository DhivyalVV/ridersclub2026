import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { RideStatus } from '@ridersclub/types';

export class CreateRideDto {
  @ApiProperty({ example: 'Nandi Hills Sunrise Breakfast Run' })
  @IsString()
  @MinLength(5)
  @MaxLength(140)
  title!: string;

  @ApiProperty({
    example:
      'Disciplined staggered formation ride departing Hebbal flyover at 05:30 AM. Mandatory full riding gear (ECE helmet, gloves, jacket, boots).',
  })
  @IsString()
  @MinLength(15)
  @MaxLength(1500)
  description!: string;

  @ApiProperty({ example: 'Hebbal Flyover Toll, Bengaluru' })
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  startLocation!: string;

  @ApiProperty({ example: 'Nandi Hills Foothills Cafe' })
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  destination!: string;

  @ApiProperty({ example: '2026-11-02T05:30:00.000Z' })
  @IsDateString()
  departureAt!: string;

  @ApiProperty({ example: 20, minimum: 2, maximum: 200 })
  @IsInt()
  @Min(2)
  @Max(200)
  capacity!: number;
}

export class UpdateRideDto {
  @ApiPropertyOptional({ example: 'Updated Nandi Hills Sunrise Run' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(140)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(15)
  @MaxLength(1500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  startLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  destination?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  departureAt?: string;

  @ApiPropertyOptional({ minimum: 2, maximum: 200 })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(200)
  capacity?: number;

  @ApiPropertyOptional({ enum: RideStatus })
  @IsOptional()
  @IsEnum(RideStatus)
  status?: RideStatus;
}

