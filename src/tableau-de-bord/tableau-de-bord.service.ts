import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ChambreEntity } from '../chambres/entities/chambre.entity/chambre.entity.js';
import { StatutChambreEnum } from '../chambres/enums/statut-chambre.enum/statut-chambre.enum.js';
import { ReservationEntity } from '../reservations/entities/reservation.entity/reservation.entity.js';
import { StatutReservationEnum } from '../reservations/enums/statut-reservation.enum/statut-reservation.enum.js';
import { dateLocaleHotel } from '../reservations/utils/reservation.util.js';

@Injectable()
export class TableauDeBordService {
  constructor(@InjectDataSource() private readonly source: DataSource) {}

  async obtenirIndicateurs() {
    const reservations = this.source.getRepository(ReservationEntity);
    const chambres = this.source.getRepository(ChambreEntity);
    const aujourdHui = dateLocaleHotel(new Date());
    const [
      totalReservations,
      enAttente,
      confirmees,
      enCours,
      terminees,
      annulees,
      totalChambres,
      chambresOperationnelles,
      chambresOccupees,
    ] = await Promise.all([
      reservations.count(),
      reservations.countBy({ statut: StatutReservationEnum.EN_ATTENTE }),
      reservations.countBy({ statut: StatutReservationEnum.CONFIRMEE }),
      reservations.countBy({ statut: StatutReservationEnum.EN_COURS }),
      reservations.countBy({ statut: StatutReservationEnum.TERMINEE }),
      reservations.countBy({ statut: StatutReservationEnum.ANNULEE }),
      chambres.count(),
      chambres
        .createQueryBuilder('chambre')
        .innerJoin('chambre.typeChambre', 'type')
        .where('chambre.statut = :statut', {
          statut: StatutChambreEnum.DISPONIBLE,
        })
        .andWhere('type.actif = true')
        .getCount(),
      reservations
        .createQueryBuilder('reservation')
        .innerJoin('reservation.lignes', 'ligne')
        .innerJoin('ligne.chambre', 'chambre')
        .innerJoin('chambre.typeChambre', 'type')
        .select('COUNT(DISTINCT chambre.id)', 'total')
        .where('reservation.dateArrivee <= :aujourdHui', { aujourdHui })
        .andWhere('reservation.dateDepart > :aujourdHui', { aujourdHui })
        .andWhere('chambre.statut = :chambreDisponible', {
          chambreDisponible: StatutChambreEnum.DISPONIBLE,
        })
        .andWhere('type.actif = true')
        .andWhere(
          '(reservation.statut IN (:...statuts) OR (reservation.statut = :attente AND reservation.expireLe > :instant))',
          {
            statuts: [
              StatutReservationEnum.CONFIRMEE,
              StatutReservationEnum.EN_COURS,
            ],
            attente: StatutReservationEnum.EN_ATTENTE,
            instant: new Date(),
          },
        )
        .getRawOne<{ total: string }>(),
    ]);

    const chambresOccupeesCount = Number(chambresOccupees?.total ?? 0);
    return {
      reservations: {
        total: totalReservations,
        enAttente,
        confirmees,
        enCours,
        terminees,
        annulees,
      },
      occupation: {
        chambresTotales: totalChambres,
        chambresOperationnelles,
        chambresOccupees: chambresOccupeesCount,
        tauxPourcent:
          chambresOperationnelles === 0
            ? 0
            : Number(
                ((chambresOccupeesCount / chambresOperationnelles) * 100).toFixed(2),
              ),
        date: aujourdHui,
      },
    };
  }
}
