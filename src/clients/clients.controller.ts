import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthentificationService } from '../authentification/authentification.service.js';
import { InscriptionDto } from '../authentification/dto/inscription.dto/inscription.dto.js';
import { JwtAuthGuard } from '../authentification/guards/jwt-auth.guard/jwt-auth.guard.js';
import { RolesGuard } from '../authentification/guards/roles.guard/roles.guard.js';
import { Roles } from '../authentification/decorators/roles.decorator/roles.decorator.js';
import { UtilisateurConnecte } from '../authentification/decorators/utilisateur-connecte.decorator/utilisateur-connecte.decorator.js';
import { RoleEnum } from '../authentification/enums/role.enum/role.enum.js';
import type { UtilisateurAuthentifie } from '../authentification/strategies/jwt.strategy/jwt.strategy.js';
import { ClientsService } from './clients.service.js';
import { ModifierClientDto } from './dto/modifier-client.dto/modifier-client.dto.js';

@Controller('clients')
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly authentificationService: AuthentificationService,
  ) {}

  @Post('inscription')
  inscrire(@Body() dto: InscriptionDto) {
    return this.authentificationService.inscrireClient(dto);
  }

  @Get('moi')
  @UseGuards(JwtAuthGuard)
  obtenirProfil(@UtilisateurConnecte() utilisateur: UtilisateurAuthentifie) {
    return this.clientsService.obtenirProfil(utilisateur);
  }

  @Patch('moi')
  @UseGuards(JwtAuthGuard)
  modifierProfil(
    @UtilisateurConnecte() utilisateur: UtilisateurAuthentifie,
    @Body() dto: ModifierClientDto,
  ) {
    return this.clientsService.modifierProfil(utilisateur, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.RECEPTIONNISTE, RoleEnum.ADMINISTRATEUR)
  lister(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limite', new DefaultValuePipe(25), ParseIntPipe) limite: number,
  ) {
    return this.clientsService.lister(
      Math.max(1, page),
      Math.min(100, Math.max(1, limite)),
    );
  }
}
