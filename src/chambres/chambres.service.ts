import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service.js';
import { UtilisateurAuthentifie } from '../authentification/strategies/jwt.strategy/jwt.strategy.js';
import { TypeChambreEntity } from '../types-chambres/entities/type-chambre.entity/type-chambre.entity.js';
import { CreerChambreDto } from './dto/creer-chambre.dto/creer-chambre.dto.js';
import { ModifierChambreDto } from './dto/modifier-chambre.dto/modifier-chambre.dto.js';
import { ChambreEntity } from './entities/chambre.entity/chambre.entity.js';

type ImageChambreImportee = Pick<Express.Multer.File, 'buffer' | 'mimetype'>;

const extensionsImages: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

@Injectable()
export class ChambresService {
  constructor(
    @InjectRepository(ChambreEntity)
    private readonly chambres: Repository<ChambreEntity>,
    @InjectRepository(TypeChambreEntity)
    private readonly types: Repository<TypeChambreEntity>,
    private readonly audit: AuditService,
  ) {}

  lister() {
    return this.chambres.find({
      relations: { typeChambre: true },
      order: { numero: 'ASC' },
    });
  }

  async creer(
    dto: CreerChambreDto,
    utilisateur: UtilisateurAuthentifie,
    images: ImageChambreImportee[] = [],
  ) {
    if (await this.chambres.existsBy({ numero: dto.numero.trim() })) {
      throw new ConflictException('Ce numéro de chambre existe déjà.');
    }
    const type = await this.types.findOneBy({ id: dto.typeChambreId, actif: true });
    if (!type) throw new NotFoundException('Type de chambre actif introuvable.');

    for (const image of images) {
      if (!imageEstValide(image)) {
        throw new BadRequestException(
          'Une image ne correspond pas à son format JPEG, PNG ou WebP déclaré.',
        );
      }
    }

    const dossierImages = fileURLToPath(
      new URL('../../uploads/chambres/', import.meta.url),
    );
    await mkdir(dossierImages, { recursive: true });
    const fichiersCrees: string[] = [];
    const cheminsImages: string[] = [];
    try {
      for (const image of images) {
        const nomFichier = `${randomUUID()}${extensionsImages[image.mimetype]}`;
        const chemin = join(dossierImages, nomFichier);
        await writeFile(chemin, image.buffer, { flag: 'wx' });
        fichiersCrees.push(chemin);
        cheminsImages.push(`/uploads/chambres/${nomFichier}`);
      }
    } catch (cause) {
      await Promise.all(fichiersCrees.map((chemin) => unlink(chemin)));
      throw cause;
    }

    let chambre: ChambreEntity;
    try {
      chambre = await this.chambres.save(
        this.chambres.create({
          numero: dto.numero.trim(),
          etage: dto.etage ?? null,
          typeChambre: type,
          statut: dto.statut,
          images: cheminsImages,
        }),
      );
    } catch (cause) {
      await Promise.all(fichiersCrees.map((chemin) => unlink(chemin)));
      throw cause;
    }

    await this.audit.enregistrer({
      action: 'CREATION_CHAMBRE',
      entite: 'Chambre',
      entiteId: chambre.id,
      details: { numero: chambre.numero },
      utilisateurId: utilisateur.id,
    });
    return this.chambres.findOne({
      where: { id: chambre.id },
      relations: { typeChambre: true },
    });
  }

  async modifier(
    id: number,
    dto: ModifierChambreDto,
    utilisateur: UtilisateurAuthentifie,
  ) {
    const chambre = await this.chambres.findOne({
      where: { id },
      relations: { typeChambre: true },
    });
    if (!chambre) throw new NotFoundException('Chambre introuvable.');
    if (dto.numero && dto.numero.trim() !== chambre.numero) {
      if (await this.chambres.existsBy({ numero: dto.numero.trim() })) {
        throw new ConflictException('Ce numéro de chambre existe déjà.');
      }
      chambre.numero = dto.numero.trim();
    }
    if (dto.etage !== undefined) chambre.etage = dto.etage;
    if (dto.statut !== undefined) chambre.statut = dto.statut;
    if (dto.typeChambreId !== undefined) {
      const type = await this.types.findOneBy({
        id: dto.typeChambreId,
        actif: true,
      });
      if (!type) throw new NotFoundException('Type de chambre actif introuvable.');
      chambre.typeChambre = type;
    }
    await this.chambres.save(chambre);
    await this.audit.enregistrer({
      action: 'MODIFICATION_CHAMBRE',
      entite: 'Chambre',
      entiteId: id,
      details: {
        numero: dto.numero,
        etage: dto.etage,
        typeChambreId: dto.typeChambreId,
        statut: dto.statut,
      },
      utilisateurId: utilisateur.id,
    });
    return this.chambres.findOne({
      where: { id },
      relations: { typeChambre: true },
    });
  }
}

function imageEstValide(image: ImageChambreImportee): boolean {
  if (!extensionsImages[image.mimetype]) return false;
  const { buffer, mimetype } = image;
  if (mimetype === 'image/jpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimetype === 'image/png') {
    return buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  }
  return (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  );
}
