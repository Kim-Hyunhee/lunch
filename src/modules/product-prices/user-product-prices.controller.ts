import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductPricesService } from './product-prices.service';

@Controller('user/product-price')
@ApiTags('user/product-price')
export class UserProductPricesController {
  constructor(private productPriceService: ProductPricesService) {}
}
