import {
  Column,
  Check,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { TypeChambreEntity } from '../../../types-chambres/entities/type-chambre.entity/type-chambre.entity.js';
import { LigneReservationEntity } from '../../../reservations/entities/ligne-reservation.entity/ligne-reservation.entity.js';
import { StatutChambreEnum } from '../../enums/statut-chambre.enum/statut-chambre.enum.js';

@Entity({ name: 'chambres' })
@Check(
  'ck_chambres_statut',
  `"statut" IN ('DISPONIBLE', 'MAINTENANCE', 'HORS_SERVICE')`,
)
@Index('idx_chambres_statut', ['statut'])
@Index('idx_chambres_type_chambre', ['typeChambre'])
export class ChambreEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 20 })
  numero!: string;

  @Column({ type: 'int', nullable: true })
  etage!: number | null;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  images!: string[];

  @Column({
    type: 'varchar',
    length: 20,
    default: StatutChambreEnum.DISPONIBLE,
  })
  statut!: StatutChambreEnum;

  @ManyToOne(() => TypeChambreEntity, (type) => type.chambres, {
    nullable: false,
  })
  @JoinColumn({ name: 'type_chambre_id' })
  typeChambre!: Relation<TypeChambreEntity>;

  @OneToMany(() => LigneReservationEntity, (ligne) => ligne.chambre)
  lignesReservation!: Relation<LigneReservationEntity[]>;
}
