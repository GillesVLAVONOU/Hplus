import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientEntity } from '../clients/entities/client.entity/client.entity.js';
import { AuditModule } from '../audit/audit.module.js';
import { UtilisateurPersonnelEntity } from './entities/utilisateur-personnel.entity/utilisateur-personnel.entity.js';
import { PersonnelController } from './personnel.controller.js';
import { PersonnelService } from './personnel.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([UtilisateurPersonnelEntity, ClientEntity]),
    AuditModule,
  ],
  controllers: [PersonnelController],
  providers: [PersonnelService],
  exports: [PersonnelService],
})
export class PersonnelModule {}
