import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class CreerReservationDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateArrivee!: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateDepart!: string;

  @IsInt()
  @Min(1)
  nombrePersonnes!: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  chambresIds!: number[];
}
