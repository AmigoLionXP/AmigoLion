import { Type } from 'class-transformer';
import { IsDate, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateEventDto {
  @IsIn(['comunit', 'connect', 'round', 'summit'])
  tipo!: 'comunit' | 'connect' | 'round' | 'summit';

  @Type(() => Date)
  @IsDate()
  data!: Date;

  @IsOptional()
  @IsString()
  faixa?: string;
}
