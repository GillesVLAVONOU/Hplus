import { Test, TestingModule } from '@nestjs/testing';
import { PersonnelController } from './personnel.controller.js';
import { PersonnelService } from './personnel.service.js';

describe('PersonnelController', () => {
  let controller: PersonnelController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonnelController],
      providers: [{ provide: PersonnelService, useValue: {} }],
    }).compile();

    controller = module.get<PersonnelController>(PersonnelController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
