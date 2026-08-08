import { IsArray, IsBoolean } from 'class-validator';

export class GuidedChallengeDto {
  @IsArray()
  @IsBoolean({ each: true })
  answers!: boolean[];
}
