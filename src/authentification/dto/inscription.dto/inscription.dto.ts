import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';

export class InscriptionDto {
  @IsString()
  @Length(1, 80)
  nom!: string;

  @IsString()
  @Length(1, 80)
  prenom!: string;

  @IsEmail()
  @Length(3, 160)
  email!: string;

  @IsOptional()
  @IsString()
  @Length(1, 30)
  telephone?: string;

  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,128}$/)
  motDePasse!: string;
}
