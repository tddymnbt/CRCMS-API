import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import typeorm from './config/typeorm';
import { UsersModule } from './modules/users/users.module';
import { StatusModule } from './modules/status/status.module';
import { AuthenticationsModule } from './modules/authentications/authentications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeorm],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        configService.get('typeorm'),
    }),
    UsersModule,
    StatusModule,
    AuthenticationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
