import { Test, TestingModule } from '@nestjs/testing';
import { ChambresController } from './chambres.controller.js';
import { ChambresService } from './chambres.service.js';

describe('ChambresController', () => {
  let controller: ChambresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChambresController],
      providers: [{ provide: ChambresService, useValue: {} }],
    }).compile();

    controller = module.get<ChambresController>(ChambresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
