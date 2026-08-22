/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:5000',
    'http://localhost:5001',
    'https://lwph-sims.vercel.app',
    'https://lwphsims-uat.up.railway.app',
    'https://lwphsims-prod.up.railway.app',
    'https://crcms-git-uat-jerryfel13s-projects.vercel.app',
    'https://lwphsims-fe-uat.up.railway.app',
    'http://127.0.0.1:4200',
    'http://127.0.0.1:4300',
    'http://localhost:4200',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`Blocked by CORS: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('LWPH SIMS API Documentation')
    .setDescription('UAT API for LWPH SIMS')
    .setVersion(process.env.npm_package_version || '1.0')
    .addTag('api')
    .addTag('status', 'Service health and version')
    .addTag('authentications', 'Login, OTP verification and logout')
    .addTag('users', 'User accounts and role assignment')
    .addTag('rbac', 'Roles and permissions management')
    .addTag('clients', 'Client records, consignors and celebrants')
    .addTag('products', 'Product inventory, stocks and transactions')
    .addTag('brands', 'Product brands')
    .addTag('categories', 'Product categories')
    .addTag('authenticators', 'Product authenticators')
    .addTag('sales', 'Sale transactions, payments and statistics')
    .addTag('activity logs', 'User activity audit trail')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT', // Optional, can be omitted
      },
      'access-token', // This is the name you'll use in @ApiBearerAuth()
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Global validation pipe with options
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    }),
  );

  app.getHttpAdapter().get('/', (_req, res) => {
    res.redirect(301, '/api');
  });

  await app.listen(3000);
  console.log('API is now running at http://localhost:3000/api');
}
bootstrap();
