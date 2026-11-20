import { IsEmail, IsString, MaxLength } from 'class-validator';

export enum TypeCompteEnum {
  CLIENT = 'CLIENT',
  PERSONNEL = 'PERSONNEL',
}

export class ConnexionDto {
  @IsEmail()
  @MaxLength(160)
  email!: string;

  @IsString()
  @MaxLength(128)
  motDePasse!: string;
}
