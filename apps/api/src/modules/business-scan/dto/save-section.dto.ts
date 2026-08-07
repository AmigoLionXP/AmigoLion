import { IsArray, IsObject, IsOptional } from 'class-validator';

export class SaveSectionDto {
  @IsObject()
  data!: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  skippedFields?: string[];
}
