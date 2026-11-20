import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthentificationModule } from '../authentification/authentification.module.js';
import { UtilisateurPersonnelEntity } from '../personnel/entities/utilisateur-personnel.entity/utilisateur-personnel.entity.js';
import { ClientEntity } from './entities/client.entity/client.entity.js';
import { ClientsController } from './clients.controller.js';
import { ClientsService } from './clients.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClientEntity, UtilisateurPersonnelEntity]),
    AuthentificationModule,
  ],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
