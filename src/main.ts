import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';


async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(rateLimit({ windowMs: 60_000, max: 120 }));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, transform: true, forbidNonWhitelisted: true,
  }));

  app.enableCors({
    origin: [
      'http://localhost:8080',
      'http://localhost:5173',
      'http://frontend.local',
      'https://cloudwalk-challenge-frontend-f1e2opzpu-icarowils-projects.vercel.app',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, X-Requested-With',
    credentials: false,
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT') ?? 3000;

  const configDoc = new DocumentBuilder()
    .setTitle('Cloudwalk Chat API')
    .setDescription('Roteamento de agentes: Router, Math, Knowledge')
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, configDoc);
  SwaggerModule.setup('/docs', app, document);

  await app.listen(port, '0.0.0.0');
  app.get(Logger).log(`API listening on :${port}`);
}
bootstrap();
