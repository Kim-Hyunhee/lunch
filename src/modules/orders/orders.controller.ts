import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto, CreateOrderResponseDto } from './dto/create-order.dto';
import { CurrentUser } from 'src/decorators/currentUser.dto';
import { FindOrderDto, FindOrderResponseDto } from './dto/find-order.dto';

@Controller('orders')
@ApiTags('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JwtToken')
export class OrdersController {
  constructor(private orderService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '주문 등록',
    description: '주문을 등록 합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '주문 등록 성공',
    type: CreateOrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '유효성 검사 실패',
    schema: {
      example: {
        message: ['상품ID, 배송 요청일, 상품 수량을 입력해주세요.'],
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '존재하지 않는 상품',
    schema: {
      example: {
        message: '해당 상품은 존재하지 않습니다.',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  })
  async postOrder(@Body() data: CreateOrderDto, @CurrentUser() userId: number) {
    return await this.orderService.createOrder(data, userId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '주문 조회',
    description: '주문을 조회 합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '주문 조회 성공',
    type: FindOrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '유효성 검사 실패',
    schema: {
      example: {
        message: '배송 요청일을 입력해주세요.',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '존재하지 않는 주문',
    schema: {
      example: {
        message: '주문 내역을 찾을 수 없습니다.',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  })
  async getOrder(
    @Query() { deliveryDate }: FindOrderDto,
    @CurrentUser() userId: number,
  ) {
    return await this.orderService.findOrder(deliveryDate, userId);
  }
}
