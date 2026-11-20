import { IsString, Matches } from 'class-validator';

export class PlanningPeriodeDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  debut!: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fin!: string;
}
