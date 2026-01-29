import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { AllExceptionsFilter } from './filters/http-exception.filter';

dotenv.config();
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply Global Validation Middleware
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips away properties not in the DTO
      forbidNonWhitelisted: true, // Throws error if extra properties are sent
      transform: true, // Automatically transforms payloads to DTO instances
    }),
  );

  // Standard API middleware
  app.setGlobalPrefix('api');
  app.enableCors();

  // Apply the global filter
  app.useGlobalFilters(new AllExceptionsFilter());

  const PORT = process.env.PORT ?? 3000;
  await app.listen(PORT, () =>
    console.log(`Server running on http://localhost:${PORT}`),
  );
}
bootstrap();
