import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class ModifierTypeChambreDto {
  @IsOptional()
  @IsString()
  @Length(1, 80)
  nom?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipements?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  capacite?: number;

  @IsOptional()
  @IsNumberString()
  prixDeBase?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
