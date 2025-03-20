import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductPricesService } from './product-prices.service';
import {
  CreateProductPriceDto,
  CreateProductPriceResponseDto,
} from './dto/create-product-prices.dto';

@Controller('admin/product-price')
@ApiTags('product-price')
export class AdminProductPricesController {
  constructor(private productPriceService: ProductPricesService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '회원 별 상품 판매 정책 설정',
    description: '회원 별 상품 판매 정책 설정을 등록 합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '회원 별 상품 판매 정책 설정 성공',
    type: CreateProductPriceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '유효성 검사 실패',
    schema: {
      example: {
        message: 'price 또는 hidden은 반드시 포함되어야 합니다.',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '존재하지 않는 상품/ 사용자',
    schema: {
      example: {
        message: [
          '해당 상품은 존재하지 않습니다.',
          '해당 사용자는 존재하지 않습니다.',
        ],
        error: 'Not Found',
        statusCode: 404,
      },
    },
  })
  async postProductPrice(@Body() data: CreateProductPriceDto) {
    return await this.productPriceService.createProductPrice(data);
  }
}
