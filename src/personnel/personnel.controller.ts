import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UtilisateurConnecte } from '../authentification/decorators/utilisateur-connecte.decorator/utilisateur-connecte.decorator.js';
import { Roles } from '../authentification/decorators/roles.decorator/roles.decorator.js';
import { JwtAuthGuard } from '../authentification/guards/jwt-auth.guard/jwt-auth.guard.js';
import { RolesGuard } from '../authentification/guards/roles.guard/roles.guard.js';
import { RoleEnum } from '../authentification/enums/role.enum/role.enum.js';
import type { UtilisateurAuthentifie } from '../authentification/strategies/jwt.strategy/jwt.strategy.js';
import { CreerUtilisateurDto } from './dto/creer-utilisateur.dto/creer-utilisateur.dto.js';
import { ModifierUtilisateurDto } from './dto/modifier-utilisateur.dto/modifier-utilisateur.dto.js';
import { PersonnelService } from './personnel.service.js';

@Controller('personnel')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMINISTRATEUR)
export class PersonnelController {
  constructor(private readonly personnelService: PersonnelService) {}

  @Get()
  lister(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limite', new DefaultValuePipe(25), ParseIntPipe) limite: number,
  ) {
    return this.personnelService.lister(
      Math.max(1, page),
      Math.min(100, Math.max(1, limite)),
    );
  }

  @Post()
  creer(
    @Body() dto: CreerUtilisateurDto,
    @UtilisateurConnecte() auteur: UtilisateurAuthentifie,
  ) {
    return this.personnelService.creer(dto, auteur);
  }

  @Patch(':id')
  modifier(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ModifierUtilisateurDto,
    @UtilisateurConnecte() auteur: UtilisateurAuthentifie,
  ) {
    return this.personnelService.modifier(id, dto, auteur);
  }
}
