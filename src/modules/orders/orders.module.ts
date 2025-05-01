import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProductPriceModule } from '../product-prices/product-prices.module';
import { ProductService } from 'utils/product.service';

@Module({
  imports: [ProductPriceModule],
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService, ProductService],
})
export class OrdersModule {}
