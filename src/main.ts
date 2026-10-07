import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS explicite — liste les origines autorisées
  app.enableCors({
    origin: [
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      'http://localhost:3000',
      'http://localhost',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Length', 'X-Requested-With'],
    maxAge: 3600,
  });

  await app.listen(3000, '0.0.0.0');
  console.log('🚀 Backend NestJS démarré sur http://localhost:3000');
  console.log('✅ CORS activé pour : localhost:8080, 127.0.0.1:8080');
}
bootstrap();
