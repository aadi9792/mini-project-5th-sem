import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Bind to 0.0.0.0:4000 per doc 11 §5.2
  const port = process.env.PORT || 4000;

  // Global prefix /api/v1 per doc 11 §4
  app.setGlobalPrefix('api/v1');

  // Cookies
  app.use(cookieParser());

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS for dev frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  await app.listen(port, '0.0.0.0');
  console.log(`Skillverse Backend running on http://0.0.0.0:${port}/api/v1`);
}
bootstrap();
