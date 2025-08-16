// File: services/businesses-service/backend/src/businesses/dto/create-business.dto.ts
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  ArrayMaxSize,
  IsInt,
} from 'class-validator';

export class CreateBusinessDto {
  @IsInt()
  organizationId!: number;

  @IsString()
  @Length(3, 120)
  name!: string;

  // Manual, globally unique, lowercase recommended
  @IsString()
  @Length(3, 140)
  @Matches(/^[a-z0-9]+(?:[-._][a-z0-9]+)*$/, {
    message: 'Slug may contain lowercase letters, numbers, and - . _ separators',
  })
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  tags?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  categoryIds?: string[];

  @IsOptional()
  seo?: Record<string, unknown>;
}
