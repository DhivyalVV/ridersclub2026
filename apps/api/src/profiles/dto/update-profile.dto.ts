import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { DirectMessagePrivacy } from '@ridersclub/types';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Aarav Sharma' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  displayName?: string;

  @ApiPropertyOptional({ example: 'aarav_rides' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9_]{3,25}$/, {
    message:
      'Username must be 3–25 characters and contain only lowercase letters, numbers, or underscores.',
  })
  username?: string;

  @ApiPropertyOptional({ example: 'Touring enthusiast • Himalayan 450 & Octavia RS' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  bio?: string | null;

  @ApiPropertyOptional({ example: 'Bengaluru' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  city?: string | null;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-avatar' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string | null;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  showPhone?: boolean;

  @ApiPropertyOptional({ enum: DirectMessagePrivacy })
  @IsOptional()
  @IsEnum(DirectMessagePrivacy)
  allowDirectMessages?: DirectMessagePrivacy;
}

