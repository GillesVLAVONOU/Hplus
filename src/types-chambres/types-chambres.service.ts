import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service.js';
import { UtilisateurAuthentifie } from '../authentification/strategies/jwt.strategy/jwt.strategy.js';
import { CreerTypeChambreDto } from './dto/creer-type-chambre.dto/creer-type-chambre.dto.js';
import { ModifierTypeChambreDto } from './dto/modifier-type-chambre.dto/modifier-type-chambre.dto.js';
import { TypeChambreEntity } from './entities/type-chambre.entity/type-chambre.entity.js';
import { centimes, formaterMontant } from '../reservations/utils/reservation.util.js';

@Injectable()
export class TypesChambresService {
  constructor(
    @InjectRepository(TypeChambreEntity)
    private readonly types: Repository<TypeChambreEntity>,
    private readonly audit: AuditService,
  ) {}

  lister(actifsSeulement = true) {
    return this.types.find({
      where: actifsSeulement ? { actif: true } : {},
      relations: { chambres: true },
      order: { nom: 'ASC' },
    });
  }

  async obtenir(id: number) {
    const type = await this.types.findOne({
      where: { id, actif: true },
      relations: { chambres: true },
    });
    if (!type) throw new NotFoundException('Type de chambre introuvable.');
    return type;
  }

  async creer(dto: CreerTypeChambreDto, utilisateur: UtilisateurAuthentifie) {
    const nom = dto.nom.trim();
    if (await this.types.existsBy({ nom })) {
      throw new ConflictException('Ce nom de type de chambre existe déjà.');
    }
    const type = await this.types.save(
      this.types.create({
        nom,
        description: dto.description?.trim() || null,
        equipements: dto.equipements ?? [],
        capacite: dto.capacite,
        prixDeBase: prixValide(dto.prixDeBase),
        actif: dto.actif ?? true,
      }),
    );
    await this.audit.enregistrer({
      action: 'CREATION_TYPE_CHAMBRE',
      entite: 'TypeChambre',
      entiteId: type.id,
      details: { nom: type.nom },
      utilisateurId: utilisateur.id,
    });
    return type;
  }

  async modifier(
    id: number,
    dto: ModifierTypeChambreDto,
    utilisateur: UtilisateurAuthentifie,
  ) {
    const type = await this.types.findOneBy({ id });
    if (!type) throw new NotFoundException('Type de chambre introuvable.');
    if (dto.nom && dto.nom.trim() !== type.nom) {
      if (await this.types.existsBy({ nom: dto.nom.trim() })) {
        throw new ConflictException('Ce nom de type de chambre existe déjà.');
      }
      type.nom = dto.nom.trim();
    }
    if (dto.description !== undefined) type.description = dto.description.trim() || null;
    if (dto.equipements !== undefined) type.equipements = dto.equipements;
    if (dto.capacite !== undefined) type.capacite = dto.capacite;
    if (dto.prixDeBase !== undefined) type.prixDeBase = prixValide(dto.prixDeBase);
    if (dto.actif !== undefined) type.actif = dto.actif;

    const saved = await this.types.save(type);
    await this.audit.enregistrer({
      action: 'MODIFICATION_TYPE_CHAMBRE',
      entite: 'TypeChambre',
      entiteId: id,
      details: {
        nom: dto.nom,
        description: dto.description,
        equipements: dto.equipements,
        capacite: dto.capacite,
        prixDeBase: dto.prixDeBase,
        actif: dto.actif,
      },
      utilisateurId: utilisateur.id,
    });
    return saved;
  }
}

function prixValide(valeur: string): string {
  if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(valeur)) {
    throw new BadRequestException('Le prix doit être positif et comporter au plus deux décimales.');
  }
  const cents = centimes(valeur);
  if (cents <= 0n) throw new BadRequestException('Le prix doit être supérieur à zéro.');
  return formaterMontant(cents);
}
