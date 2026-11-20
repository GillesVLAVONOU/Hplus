import { IsInt, Min } from 'class-validator';
import { CreerReservationDto } from '../creer-reservation.dto/creer-reservation.dto.js';

export class CreerReservationPersonnelDto extends CreerReservationDto {
  @IsInt()
  @Min(1)
  clientId!: number;
}
