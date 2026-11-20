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

export class CreerTypeChambreDto {
  @IsString()
  @Length(1, 80)
  nom!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipements?: string[];

  @IsInt()
  @Min(1)
  capacite!: number;

  @IsNumberString()
  prixDeBase!: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
