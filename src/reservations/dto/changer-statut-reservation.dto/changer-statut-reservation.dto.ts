import { IsEnum } from 'class-validator';
import { StatutReservationEnum } from '../../enums/statut-reservation.enum/statut-reservation.enum.js';

export class ChangerStatutReservationDto {
  @IsEnum(StatutReservationEnum)
  statut!: StatutReservationEnum;
}
