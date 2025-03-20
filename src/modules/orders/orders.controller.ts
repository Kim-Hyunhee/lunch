import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CurrentUser } from 'src/decorators/currentUser.dto';

@Controller('orders')
@ApiTags('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JwtToken')
export class OrdersController {
  constructor(private orderService: OrdersService) {}

  @Post()
  async postOrder(@Body() data: CreateOrderDto, @CurrentUser() userId: number) {
    return await this.orderService.createOrder(data, userId);
  }
}
