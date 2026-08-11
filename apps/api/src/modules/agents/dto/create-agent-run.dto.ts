import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateAgentRunDto {
  @IsOptional()
  @IsString()
  agentKey?: string; // defaults to "7m-ai"

  @IsString()
  message!: string;

  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;

  @IsOptional()
  @IsIn(['pt', 'en'])
  lang?: 'pt' | 'en';
}
