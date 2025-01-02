import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // transforms query/body strings to actual number, boolean, etc.
    }),
  );
  await app.listen(8080);
}

bootstrap();
