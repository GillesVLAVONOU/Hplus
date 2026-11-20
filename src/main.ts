import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule, ObserveInstrument } from './app.module.js';
import { ConfigService } from '@nestjs/config';
import { fileURLToPath } from 'node:url';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    instrument: ObserveInstrument,
  });
  app.useStaticAssets(fileURLToPath(new URL('../uploads/', import.meta.url)), {
    prefix: '/uploads/',
  });

  const configService = app.get(ConfigService);

  // Validation globale des données reçues
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Préfixe de toutes les routes
  app.setGlobalPrefix('api');

  const port = configService.get<number>('PORT') || 3000;

  app.enableCors({
    origin: configService.get<string>(
      'FRONTEND_ORIGIN',
      'http://localhost:5173',
    ),
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await app.listen(port);

  console.log(`Serveur démarré sur http://localhost:${port}/api`);
}

void bootstrap().catch((erreur: unknown) => {
  console.error('Échec du démarrage du serveur.', erreur);
  process.exitCode = 1;
});
