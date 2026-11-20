import { IsBoolean, IsIn, IsOptional, IsString, Length } from 'class-validator';
import { RoleEnum } from '../../../authentification/enums/role.enum/role.enum.js';

export class ModifierUtilisateurDto {
  @IsOptional()
  @IsString()
  @Length(1, 80)
  nom?: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  prenom?: string;

  @IsOptional()
  @IsIn([RoleEnum.RECEPTIONNISTE, RoleEnum.ADMINISTRATEUR])
  role?: RoleEnum.RECEPTIONNISTE | RoleEnum.ADMINISTRATEUR;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
