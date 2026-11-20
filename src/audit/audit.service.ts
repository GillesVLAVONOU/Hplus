import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { JournalAuditEntity } from './entities/journal-audit.entity/journal-audit.entity.js';

export interface EntreeAudit {
  action: string;
  entite: string;
  entiteId?: number | null;
  details?: Record<string, unknown>;
  utilisateurId?: number | null;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(JournalAuditEntity)
    private readonly entrees: Repository<JournalAuditEntity>,
  ) {}

  async enregistrer(
    entree: EntreeAudit,
    gestionnaire?: EntityManager,
  ): Promise<void> {
    const depot = gestionnaire
      ? gestionnaire.getRepository(JournalAuditEntity)
      : this.entrees;
    await depot.save(depot.create({
      action: entree.action,
      entite: entree.entite,
      entiteId: entree.entiteId ?? null,
      details: entree.details ?? {},
      utilisateur: entree.utilisateurId
        ? { id: entree.utilisateurId }
        : null,
    }));
  }

  async lister(page = 1, limite = 25) {
    const [entrees, total] = await this.entrees.findAndCount({
      relations: { utilisateur: true },
      select: {
        id: true,
        action: true,
        entite: true,
        entiteId: true,
        details: true,
        creeLe: true,
        utilisateur: { id: true, nom: true, prenom: true, email: true },
      },
      order: { creeLe: 'DESC' },
      skip: (page - 1) * limite,
      take: limite,
    });
    return { entrees, total, page, limite };
  }
}
