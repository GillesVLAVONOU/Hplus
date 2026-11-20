import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { JournalAuditEntity } from '../../audit/entities/journal-audit.entity/journal-audit.entity.js';
import { ChambreEntity } from '../../chambres/entities/chambre.entity/chambre.entity.js';
import { IndisponibiliteChambreEntity } from '../../chambres/entities/indisponibilite-chambre.entity/indisponibilite-chambre.entity.js';
import { ClientEntity } from '../../clients/entities/client.entity/client.entity.js';
import { LigneReservationEntity } from '../../reservations/entities/ligne-reservation.entity/ligne-reservation.entity.js';
import { ReservationEntity } from '../../reservations/entities/reservation.entity/reservation.entity.js';
import { TypeChambreEntity } from '../../types-chambres/entities/type-chambre.entity/type-chambre.entity.js';
import { UtilisateurPersonnelEntity } from '../../personnel/entities/utilisateur-personnel.entity/utilisateur-personnel.entity.js';
import { InitialHotelSchema20261031000000 } from '../migrations/20261031000000-InitialHotelSchema.js';
import { ImagesChambres20261106000000 } from '../migrations/20261106000000-ImagesChambres.js';
import { IndisponibilitesChambres20261106010000 } from '../migrations/20261106010000-IndisponibilitesChambres.js';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_DATABASE ?? 'hotel',
  entities: [
    TypeChambreEntity,
    ChambreEntity,
    IndisponibiliteChambreEntity,
    ClientEntity,
    UtilisateurPersonnelEntity,
    ReservationEntity,
    LigneReservationEntity,
    JournalAuditEntity,
  ],
  migrations: [
    InitialHotelSchema20261031000000,
    ImagesChambres20261106000000,
    IndisponibilitesChambres20261106010000,
  ],
  synchronize: false,
});
