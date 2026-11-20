import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientEntity } from '../clients/entities/client.entity/client.entity.js';
import { UtilisateurPersonnelEntity } from '../personnel/entities/utilisateur-personnel.entity/utilisateur-personnel.entity.js';
import { AuthentificationController } from './authentification.controller.js';
import { AuthentificationService } from './authentification.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard/roles.guard.js';
import { JwtStrategy } from './strategies/jwt.strategy/jwt.strategy.js';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ClientEntity, UtilisateurPersonnelEntity]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.getOrThrow<string>('JWT_SECRET');
        const expiresIn = Number.parseInt(
          config.get<string>('JWT_EXPIRATION_SECONDS', '28800'),
          10,
        );
        if (secret.length < 32) {
          throw new Error('JWT_SECRET doit contenir au moins 32 caractères.');
        }
        if (!Number.isSafeInteger(expiresIn) || expiresIn <= 0) {
          throw new Error('JWT_EXPIRATION_SECONDS doit être un entier positif.');
        }
        return { secret, signOptions: { expiresIn } };
      },
    }),
  ],
  controllers: [AuthentificationController],
  providers: [AuthentificationService, JwtStrategy, JwtAuthGuard, RolesGuard],
  exports: [AuthentificationService, JwtModule, JwtAuthGuard, RolesGuard],
})
export class AuthentificationModule {}
