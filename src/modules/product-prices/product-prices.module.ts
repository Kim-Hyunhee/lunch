import { Module } from '@nestjs/common';
import { ProductPricesService } from './product-prices.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminProductPricesController } from './admin-product-prices.controller';
import { UserProductPricesController } from './user-product-prices.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AdminProductPricesController, UserProductPricesController],
  providers: [ProductPricesService, PrismaService],
  exports: [ProductPricesService],
})
export class ProductPriceModule {}
