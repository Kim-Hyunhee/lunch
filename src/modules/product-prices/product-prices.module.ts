import { Module } from '@nestjs/common';
import { ProductPricesService } from './product-prices.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminProductPricesController } from './admin-product-prices.controller';
import { UsersService } from '../users/users.service';
import { UserProductPricesController } from './user-product-prices.controller';

@Module({
  controllers: [AdminProductPricesController, UserProductPricesController],
  providers: [ProductPricesService, PrismaService, UsersService],
  exports: [ProductPricesService],
})
export class ProductPriceModule {}
