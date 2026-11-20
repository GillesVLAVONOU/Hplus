import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from '../audit/audit.service.js';
import { TypeChambreEntity } from '../types-chambres/entities/type-chambre.entity/type-chambre.entity.js';
import { ChambreEntity } from './entities/chambre.entity/chambre.entity.js';
import { ChambresService } from './chambres.service.js';

describe('ChambresService', () => {
  let service: ChambresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChambresService,
        { provide: getRepositoryToken(ChambreEntity), useValue: {} },
        { provide: getRepositoryToken(TypeChambreEntity), useValue: {} },
        { provide: AuditService, useValue: {} },
      ],
    }).compile();

    service = module.get<ChambresService>(ChambresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
