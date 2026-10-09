import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LivreursModule } from './livreurs/livreurs.module';
import { LocationsModule } from './locations/locations.module';
import { ParcelsModule } from './parcels/parcels.module';
import { User } from './users/user.entity';
import { LivreurDocument } from './livreurs/livreur-document.entity';
import { Location } from './locations/location.entity';
import { Parcel } from './parcels/parcel.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [User, LivreurDocument, Location, Parcel],
        synchronize: true,
        ssl: configService.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    LivreursModule,
    LocationsModule,
    ParcelsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
