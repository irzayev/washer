import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { loadApiEnv } from '@washer/config';

async function bootstrap() {
  const env = loadApiEnv();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.use(helmet({ contentSecurityPolicy: false }));
  app.enableCors({
    origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  const swagger = new DocumentBuilder()
    .setTitle('Washer CRM API')
    .setDescription('eDetailing CRM REST API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(env.API_PORT, env.API_HOST);
  // eslint-disable-next-line no-console
  console.log(`API ready: http://${env.API_HOST}:${env.API_PORT}/api/v1  (docs: /api/docs)`);
}

void bootstrap();
