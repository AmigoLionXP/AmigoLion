import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  titlePt!: string;

  @IsString()
  titleEn!: string;

  @IsOptional()
  @IsIn(['high', 'medium'])
  priority?: 'high' | 'medium';

  @IsString()
  prazoPt!: string;

  @IsString()
  prazoEn!: string;

  @IsOptional()
  @IsString()
  tempo?: string;

  @IsOptional()
  @IsString()
  impactoPt?: string;

  @IsOptional()
  @IsString()
  impactoEn?: string;

  @IsOptional()
  @IsString()
  specialist?: string;

  @IsOptional()
  @IsBoolean()
  done?: boolean;
}
