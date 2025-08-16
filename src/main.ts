// File: services/businesses-service/backend/src/main.ts
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
  Logger.log(`Businesses service listening on ${process.env.PORT ?? 3000}`);
}
console.log('DB_PASSWORD from env:', JSON.stringify(process.env.DB_PASSWORD));
bootstrap();