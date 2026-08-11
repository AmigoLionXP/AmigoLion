import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterClientDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  nome!: string; // company name

  @IsOptional()
  @IsString()
  cnpj?: string;

  @IsOptional()
  @IsString()
  setor?: string;

  /** rep code that referred this client (base of the stacked override), if any */
  @IsOptional()
  @IsString()
  repCode?: string;
}
