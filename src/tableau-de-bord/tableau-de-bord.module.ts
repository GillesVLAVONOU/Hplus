import { Module } from '@nestjs/common';
import { AuthentificationModule } from '../authentification/authentification.module.js';
import { TableauDeBordController } from './tableau-de-bord.controller.js';
import { TableauDeBordService } from './tableau-de-bord.service.js';

@Module({
  imports: [AuthentificationModule],
  controllers: [TableauDeBordController],
  providers: [TableauDeBordService],
})
export class TableauDeBordModule {}
