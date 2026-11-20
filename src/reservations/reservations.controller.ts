import {
  Body,
  Controller,
  Delete,
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
import { ChangerStatutReservationDto } from './dto/changer-statut-reservation.dto/changer-statut-reservation.dto.js';
import { CreerReservationPersonnelDto } from './dto/creer-reservation-personnel.dto/creer-reservation-personnel.dto.js';
import { CreerReservationDto } from './dto/creer-reservation.dto/creer-reservation.dto.js';
import { CreerIndisponibiliteDto } from './dto/creer-indisponibilite.dto/creer-indisponibilite.dto.js';
import { PlanningPeriodeDto } from './dto/planning-periode.dto/planning-periode.dto.js';
import { ModifierReservationDto } from './dto/modifier-reservation.dto/modifier-reservation.dto.js';
import { RechercherDisponibilitesDto } from './dto/rechercher-disponibilites.dto/rechercher-disponibilites.dto.js';
import { ReservationsService } from './reservations.service.js';

@Controller()
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get('chambres/disponibles')
  rechercherDisponibilites(@Query() dto: RechercherDisponibilitesDto) {
    return this.reservationsService.rechercherDisponibilites(
      dto.arrivee,
      dto.depart,
      dto.personnes,
    );
  }

  @Post('reservations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.CLIENT)
  creer(
    @Body() dto: CreerReservationDto,
    @UtilisateurConnecte() utilisateur: UtilisateurAuthentifie,
  ) {
    return this.reservationsService.creerPourClient(utilisateur.id, dto);
  }

  @Get('reservations/mes-reservations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.CLIENT)
  listerMesReservations(
    @UtilisateurConnecte() utilisateur: UtilisateurAuthentifie,
  ) {
    return this.reservationsService.listerMesReservations(utilisateur.id);
  }

  @Patch('reservations/:id/annulation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.CLIENT)
  annuler(
    @Param('id', ParseIntPipe) id: number,
    @UtilisateurConnecte() utilisateur: UtilisateurAuthentifie,
  ) {
    return this.reservationsService.annulerParClient(id, utilisateur);
  }

  @Get('personnel/reservations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.RECEPTIONNISTE, RoleEnum.ADMINISTRATEUR)
  listerPourPersonnel(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limite', new DefaultValuePipe(25), ParseIntPipe) limite: number,
  ) {
    return this.reservationsService.listerPourPersonnel(
      Math.max(1, page),
      Math.min(100, Math.max(1, limite)),
    );
  }

  @Get('personnel/planning')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.RECEPTIONNISTE, RoleEnum.ADMINISTRATEUR)
  rechercherPlanning(@Query() periode: PlanningPeriodeDto) {
    return this.reservationsService.rechercherPlanning(periode);
  }

  @Post('personnel/indisponibilites')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.RECEPTIONNISTE, RoleEnum.ADMINISTRATEUR)
  creerIndisponibilite(
    @Body() dto: CreerIndisponibiliteDto,
    @UtilisateurConnecte() utilisateur: UtilisateurAuthentifie,
  ) {
    return this.reservationsService.creerIndisponibilite(dto, utilisateur);
  }

  @Delete('personnel/indisponibilites/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.RECEPTIONNISTE, RoleEnum.ADMINISTRATEUR)
  supprimerIndisponibilite(
    @Param('id', ParseIntPipe) id: number,
    @UtilisateurConnecte() utilisateur: UtilisateurAuthentifie,
  ) {
    return this.reservationsService.supprimerIndisponibilite(id, utilisateur);
  }

  @Post('personnel/reservations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.RECEPTIONNISTE, RoleEnum.ADMINISTRATEUR)
  creerAuComptoir(
    @Body() dto: CreerReservationPersonnelDto,
    @UtilisateurConnecte() utilisateur: UtilisateurAuthentifie,
  ) {
    return this.reservationsService.creerPourClient(
      dto.clientId,
      dto,
      utilisateur.id,
    );
  }

  @Patch('personnel/reservations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.RECEPTIONNISTE, RoleEnum.ADMINISTRATEUR)
  modifier(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ModifierReservationDto,
    @UtilisateurConnecte() utilisateur: UtilisateurAuthentifie,
  ) {
    return this.reservationsService.modifier(id, dto, utilisateur);
  }

  @Patch('personnel/reservations/:id/statut')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.RECEPTIONNISTE, RoleEnum.ADMINISTRATEUR)
  changerStatut(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangerStatutReservationDto,
    @UtilisateurConnecte() utilisateur: UtilisateurAuthentifie,
  ) {
    return this.reservationsService.changerStatut(id, dto.statut, utilisateur);
  }
}
