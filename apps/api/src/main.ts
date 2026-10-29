import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('API_PORT', 4000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  const corsOriginsRaw = configService.get<string>(
    'CORS_ORIGINS',
    'http://localhost:5000,http://localhost:5001,http://localhost:5002,http://localhost:5003,http://localhost:5004,http://localhost:5005,http://localhost:5006',
  );

  app.setGlobalPrefix(apiPrefix);

  app.enableCors({
    origin: corsOriginsRaw.split(',').map((origin) => origin.trim()),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('RidersClub Enterprise API')
    .setDescription(
      'REST API contracts for RidersClub (Auth, Profiles, Blogs, Communities, Chat, Rides, Help, Mechanics, Garage, Marketplace, Admin).',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  logger.log(`RidersClub API listening on http://localhost:${port}/${apiPrefix}`);
  logger.log(`OpenAPI / Swagger documentation available at http://localhost:${port}/api/docs`);
}

void bootstrap();

