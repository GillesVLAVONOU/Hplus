import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class CreerClientDto {
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

  @IsOptional()
  @IsString()
  @Length(10, 128)
  motDePasse!: string;
}
