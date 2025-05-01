import { Module } from '@nestjs/common';
import { ProductPricesService } from './product-prices.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminProductPricesController } from './admin-product-prices.controller';
import { UserProductPricesController } from './user-product-prices.controller';
import { UsersModule } from '../users/users.module';
import { ProductService } from 'utils/product.service';

@Module({
  imports: [UsersModule],
  controllers: [AdminProductPricesController, UserProductPricesController],
  providers: [ProductPricesService, PrismaService, ProductService],
  exports: [ProductPricesService],
})
export class ProductPriceModule {}
