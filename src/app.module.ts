import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { OrdersModule } from './modules/orders/orders.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ProductPriceModule } from './modules/product-prices/product-prices.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    OrdersModule,
    AuthModule,
    ProductPriceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
