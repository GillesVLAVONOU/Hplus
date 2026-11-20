import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthentificationModule } from './authentification/authentification.module.js';
import { ClientsModule } from './clients/clients.module.js';
import { PersonnelModule } from './personnel/personnel.module.js';
import { TypesChambresModule } from './types-chambres/types-chambres.module.js';
import { ChambresModule } from './chambres/chambres.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';
import { TableauDeBordModule } from './tableau-de-bord/tableau-de-bord.module.js';
import { AuditModule } from './audit/audit.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'h+_back',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const port = Number.parseInt(config.get<string>('DB_PORT') ?? '5432', 10);
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
          throw new Error('DB_PORT doit être un port valide.');
        }
        return {
          type: 'postgres' as const,
          host: config.get<string>('DB_HOST') ?? 'localhost',
          port,
          username: config.get<string>('DB_USERNAME') ?? 'postgres',
          password: config.get<string>('DB_PASSWORD') ?? '',
          database: config.get<string>('DB_DATABASE') ?? 'hotel',
          autoLoadEntities: true,
          synchronize: false,
        };
      },
    }),

    AuthentificationModule,

    ClientsModule,

    PersonnelModule,

    TypesChambresModule,

    ChambresModule,

    ReservationsModule,

    TableauDeBordModule,

    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
