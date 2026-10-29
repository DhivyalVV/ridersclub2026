import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBlogDto {
  @ApiProperty({ example: 'High-Altitude Braking & Clutch Care Before a Spiti Circuit' })
  @IsString()
  @MinLength(5)
  @MaxLength(160)
  title!: string;

  @ApiProperty({
    example:
      'How DOT 4 boiling points, braided steel lines, and clutch free-play adjustments prevent fade on steep mountain descents.',
  })
  @IsString()
  @MinLength(15)
  @MaxLength(350)
  excerpt!: string;

  @ApiProperty({
    example:
      'Before ascending above 3,500 meters, inspect your brake fluid moisture content and verify clutch cable free-play...',
  })
  @IsString()
  @MinLength(30)
  @MaxLength(25000)
  content!: string;

  @ApiPropertyOptional({ example: ['Brakes', 'Touring Prep', 'Safety'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateBlogDto {
  @ApiPropertyOptional({ example: 'Updated High-Altitude Braking & Clutch Guide' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(160)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(15)
  @MaxLength(350)
  excerpt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(30)
  @MaxLength(25000)
  content?: string;

  @ApiPropertyOptional({ example: ['Brakes', 'Touring Prep'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  tags?: string[];
}

export class CreateBlogCommentDto {
  @ApiProperty({
    example: 'Switched to DOT 5.1 before my Zanskar run and had zero lever sponge on Singge La!',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(1500)
  body!: string;
}

