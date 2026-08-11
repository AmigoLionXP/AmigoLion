import { IsOptional, IsString } from 'class-validator';

export class VoiceTranscriptDto {
  @IsString()
  text!: string;

  @IsOptional()
  @IsString()
  fieldKey?: string;
}
