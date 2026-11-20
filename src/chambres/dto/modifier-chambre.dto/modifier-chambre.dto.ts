import { IsEnum, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { StatutChambreEnum } from '../../enums/statut-chambre.enum/statut-chambre.enum.js';

export class ModifierChambreDto {
  @IsOptional()
  @IsString()
  @Length(1, 20)
  numero?: string;

  @IsOptional()
  @IsInt()
  etage?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  typeChambreId?: number;

  @IsOptional()
  @IsEnum(StatutChambreEnum)
  statut?: StatutChambreEnum;
}
