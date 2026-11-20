import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module.js';
import { ChambreEntity } from '../chambres/entities/chambre.entity/chambre.entity.js';
import { IndisponibiliteChambreEntity } from '../chambres/entities/indisponibilite-chambre.entity/indisponibilite-chambre.entity.js';
import { ClientEntity } from '../clients/entities/client.entity/client.entity.js';
import { UtilisateurPersonnelEntity } from '../personnel/entities/utilisateur-personnel.entity/utilisateur-personnel.entity.js';
import { LigneReservationEntity } from './entities/ligne-reservation.entity/ligne-reservation.entity.js';
import { ReservationEntity } from './entities/reservation.entity/reservation.entity.js';
import { ReservationsController } from './reservations.controller.js';
import { ReservationsService } from './reservations.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReservationEntity,
      LigneReservationEntity,
      ChambreEntity,
      IndisponibiliteChambreEntity,
      ClientEntity,
      UtilisateurPersonnelEntity,
    ]),
    AuditModule,
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
