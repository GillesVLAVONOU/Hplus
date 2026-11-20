import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { ReservationEntity } from '../../../reservations/entities/reservation.entity/reservation.entity.js';

@Entity({ name: 'clients' })
export class ClientEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 80 })
  nom!: string;

  @Column({ length: 80 })
  prenom!: string;

  @Column({ unique: true, length: 160 })
  email!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  telephone!: string | null;

  @Column({ name: 'mot_de_passe_hache', select: false })
  motDePasseHache!: string;

  @Column({ default: true })
  actif!: boolean;

  @OneToMany(() => ReservationEntity, (reservation) => reservation.client)
  reservations!: Relation<ReservationEntity[]>;
}
