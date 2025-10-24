import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';



async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS para frontend local
  app.enableCors({
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'x-api-key'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina propiedades desconocidas
      forbidNonWhitelisted: true, // lanza error si envían campos no permitidos
      transform: true, // transforma tipos básicos
    }),
  );
  await app.listen(process.env.PORT || 3000);
  console.log(`App escuchando en puerto ${process.env.PORT || 3000}`);
}
bootstrap();