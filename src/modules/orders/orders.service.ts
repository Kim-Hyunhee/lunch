import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createOrder(data: CreateOrderDto, userId: number) {
    const { deliveryDate, comment, items } = data;

    // 주문 생성
    const order = await this.prisma.order.create({
      data: {
        userId,
        deliveryDate,
        comment,
        orderItems: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: { orderItems: true },
    });

    return order;
  }
}
