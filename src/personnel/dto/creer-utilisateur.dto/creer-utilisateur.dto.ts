import { IsEmail, IsIn, IsString, Length, Matches } from 'class-validator';
import { RoleEnum } from '../../../authentification/enums/role.enum/role.enum.js';

export class CreerUtilisateurDto {
  @IsString()
  @Length(1, 80)
  nom!: string;

  @IsString()
  @Length(1, 80)
  prenom!: string;

  @IsEmail()
  @Length(3, 160)
  email!: string;

  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,128}$/)
  motDePasse!: string;

  @IsIn([RoleEnum.RECEPTIONNISTE, RoleEnum.ADMINISTRATEUR])
  role!: RoleEnum.RECEPTIONNISTE | RoleEnum.ADMINISTRATEUR;
}
