import { IsInt, IsString, Matches, MaxLength, Min } from 'class-validator';

export class CreerIndisponibiliteDto {
  @IsInt()
  @Min(1)
  chambreId!: number;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateDebut!: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateFin!: string;

  @IsString()
  @MaxLength(200)
  motif!: string;
}
