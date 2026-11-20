import { Test, TestingModule } from '@nestjs/testing';
import { AuthentificationController } from './authentification.controller.js';
import { AuthentificationService } from './authentification.service.js';
import { ConfigService } from '@nestjs/config';

describe('AuthentificationController', () => {
  let controller: AuthentificationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthentificationController],
      providers: [
        { provide: AuthentificationService, useValue: {} },
        { provide: ConfigService, useValue: { get: () => '28800' } },
      ],
    }).compile();

    controller = module.get<AuthentificationController>(AuthentificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
