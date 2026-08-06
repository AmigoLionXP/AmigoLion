import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateDiagnosticDto {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  gargalo?: string;

  @IsObject()
  respostas!: Record<string, number>;

  @IsOptional()
  @IsIn(['partial', 'complete'])
  status?: 'partial' | 'complete';
}
