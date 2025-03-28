import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProductPricesService } from './product-prices.service';
import { CurrentUser } from '../../decorators/currentUser.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { User } from '.prisma/client';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JwtToken')
@Controller('user/product-price')
@ApiTags('product-price')
export class UserProductPricesController {
  constructor(private productPriceService: ProductPricesService) {}

  @Get()
  async getManyProduct(@CurrentUser() user: User) {
    return await this.productPriceService.findManyProduct(user.id);
  }
}
