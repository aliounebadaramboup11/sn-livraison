import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ParcelsModule } from './parcels/parcels.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { WalletModule } from './wallet/wallet.module';
import { PositionsModule } from './positions/positions.module';
import { ReviewsModule } from './reviews/reviews.module';
import { LocationsModule } from './locations/locations.module';
import { LivreursModule } from './livreurs/livreurs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        ssl: { rejectUnauthorized: false },
        autoLoadEntities: true,
        synchronize: true,
        logging: false,
      }),
    }),
    UsersModule,
    AuthModule,
    ParcelsModule,
    DeliveriesModule,
    WalletModule,
    PositionsModule,
    ReviewsModule,
    LocationsModule,
    LivreursModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
