import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';

export class RechercherDisponibilitesDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  arrivee!: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  depart!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  personnes?: number;
}
