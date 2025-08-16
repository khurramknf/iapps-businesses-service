// File: services/businesses-service/backend/src/businesses/dto/update-business.dto.ts
import {
  IsArray,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  IsBoolean,
  ArrayMaxSize,
} from 'class-validator';

export class UpdateBusinessDto {
  @IsOptional()
  @IsString()
  @Length(3, 120)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(3, 140)
  @Matches(/^[a-z0-9]+(?:[-._][a-z0-9]+)*$/)
  slug?: string;

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
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  seo?: Record<string, unknown>;
}
