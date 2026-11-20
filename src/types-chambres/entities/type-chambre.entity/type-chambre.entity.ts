import { Check, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { ChambreEntity } from '../../../chambres/entities/chambre.entity/chambre.entity.js';

@Entity({ name: 'types_chambres' })
@Check('ck_types_chambres_capacite', '"capacite" > 0')
@Check('ck_types_chambres_prix', '"prix_de_base" > 0')
export class TypeChambreEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 80 })
  nom!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  equipements!: string[];

  @Column({ type: 'int' })
  capacite!: number;

  @Column({
    name: 'prix_de_base',
    type: 'numeric',
    precision: 12,
    scale: 2,
  })
  prixDeBase!: string;

  @Column({ default: true })
  actif!: boolean;

  @OneToMany(() => ChambreEntity, (chambre) => chambre.typeChambre)
  chambres!: Relation<ChambreEntity[]>;
}
