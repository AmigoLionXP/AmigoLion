import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  nome!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  diagnosticId?: string;
}
