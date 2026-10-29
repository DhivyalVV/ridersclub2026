import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { CommunityVisibility } from '@ridersclub/types';

export class CreateCommunityDto {
  @ApiProperty({ example: 'Western Ghats ADV Tourers' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    example:
      'Weekend trail rides, monsoon preparedness checklists, and technical terrain mentorship across Karnataka, Goa, and Maharashtra.',
  })
  @IsString()
  @MinLength(15)
  @MaxLength(600)
  description!: string;

  @ApiProperty({ example: 'Adventure & Touring' })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  category!: string;

  @ApiProperty({ enum: CommunityVisibility, example: CommunityVisibility.PUBLIC })
  @IsEnum(CommunityVisibility)
  visibility!: CommunityVisibility;
}

export class CreateCommunityMessageDto {
  @ApiProperty({
    example: 'Morning riders! Meeting at Nice Road Toll Plaza at 05:45 AM sharp tomorrow.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(1500)
  body!: string;
}

