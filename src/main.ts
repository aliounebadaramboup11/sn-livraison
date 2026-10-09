import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // On récupère l'URL du frontend depuis les variables d'environnement
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  app.enableCors({
    origin: [
      frontendUrl,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:5177',
      'http://localhost:5178',
      'http://localhost:3000',
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      'http://localhost',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Length', 'X-Requested-With'],
    maxAge: 3600,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Backend NestJS démarré sur http://localhost:${port}`);
  console.log(`✅ CORS activé pour : ${frontendUrl}`);
}
bootstrap();
