import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class ModifierClientDto {
  @IsOptional()
  @IsString()
  @Length(1, 80)
  nom?: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  prenom?: string;

  @IsOptional()
  @IsEmail()
  @Length(3, 160)
  email?: string;

  @IsOptional()
  @IsString()
  @Length(1, 30)
  telephone?: string;
}
