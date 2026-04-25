import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');
  await app.listen(3778, '0.0.0.0');
  console.log('🏋️ Gym+ API running at http://localhost:3778');
}
bootstrap();
