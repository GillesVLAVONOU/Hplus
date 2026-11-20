import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { AuditService } from '../audit/audit.service.js';
import { ReservationsService } from './reservations.service.js';

describe('ReservationsService', () => {
  let service: ReservationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: getDataSourceToken(), useValue: {} },
        { provide: AuditService, useValue: {} },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects invalid planning dates before querying the database', async () => {
    await expect(
      service.rechercherPlanning({ debut: '2026-02-30', fin: '2026-03-01' }),
    ).rejects.toThrow('La période du planning est invalide.');
  });

  it('rejects planning periods longer than 62 days', async () => {
    await expect(
      service.rechercherPlanning({ debut: '2026-01-01', fin: '2026-03-05' }),
    ).rejects.toThrow('La période du planning est invalide.');
  });
});
