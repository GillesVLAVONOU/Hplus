import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from '../audit/audit.service.js';
import { TypeChambreEntity } from './entities/type-chambre.entity/type-chambre.entity.js';
import { TypesChambresService } from './types-chambres.service.js';

describe('TypesChambresService', () => {
  let service: TypesChambresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypesChambresService,
        { provide: getRepositoryToken(TypeChambreEntity), useValue: {} },
        { provide: AuditService, useValue: {} },
      ],
    }).compile();

    service = module.get<TypesChambresService>(TypesChambresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
