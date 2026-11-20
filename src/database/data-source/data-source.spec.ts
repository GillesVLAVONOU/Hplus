import { describe, expect, it } from 'vitest';
import { getMetadataArgsStorage } from 'typeorm';
import { LigneReservationEntity } from '../../reservations/entities/ligne-reservation.entity/ligne-reservation.entity.js';
import dataSource from './data-source.js';

describe('DataSource TypeORM', () => {
  it('charge toutes les entités sans erreur de dépendance circulaire ESM', () => {
    expect(dataSource.options.entities).toHaveLength(8);
    expect(dataSource.options.migrations).toHaveLength(3);
  });

  it('maps reservation line totals to the existing snake-case column', () => {
    const column = getMetadataArgsStorage().columns.find(
      (metadata) =>
        metadata.target === LigneReservationEntity &&
        metadata.propertyName === 'sousTotal',
    );
    expect(column?.options.name).toBe('sous_total');
  });
});
