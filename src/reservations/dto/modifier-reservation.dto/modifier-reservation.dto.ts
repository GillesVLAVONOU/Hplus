import { IsArray, IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';

export class ModifierReservationDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateArrivee?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateDepart?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  nombrePersonnes?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  chambresIds?: number[];
}
