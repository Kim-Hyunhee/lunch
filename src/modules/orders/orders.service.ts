import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProductPricesService } from '../product-prices/product-prices.service';
import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';

@Injectable()
export class OrdersService {
  private readonly PRODUCT_API = 'https://recruit-dev.lunchlab.me/v1';
  private INSTANCE = axios.create({ baseURL: this.PRODUCT_API });
  constructor(
    private prisma: PrismaService,
    private productPriceService: ProductPricesService,
  ) {
    // axios-retry 설정
    axiosRetry(this.INSTANCE, {
      retries: 3, // 최대 재시도 횟수
      retryDelay: axiosRetry.exponentialDelay, // 지연 시간 설정
      retryCondition: (error: AxiosError<unknown, any>) => {
        // error.response가 존재하고 status가 5xx인 경우에만 재시도
        return error.response ? error.response.status >= 500 : false;
      },
    });
  }

  private async fetchAllProducts() {
    try {
      const { data: response } = await this.INSTANCE.get('/products');
      if (!response.data || response.data.length === 0) {
        throw new NotFoundException('상품 목록이 비어있습니다.');
      }

      return response.data;
    } catch (error) {
      throw new InternalServerErrorException(
        '상품 목록을 가져오는 중 오류가 발생했습니다.',
      );
    }
  }

  async createOrder(data: CreateOrderDto, userId: number) {
    const { deliveryDate, comment, items } = data;
    try {
      const allProducts = await this.fetchAllProducts();
      const allProductIds = new Set(allProducts.map((p) => p.id));

      const invalidProducts = items.filter(
        (item) => !allProductIds.has(item.productId),
      );
      if (invalidProducts.length > 0) {
        throw new BadRequestException(
          `유효하지 않은 상품: ${invalidProducts.map((p) => p.productId).join(', ')}`,
        );
      }

      const order = await this.prisma.$transaction(async (prisma) => {
        // 주문(Order) 생성
        const newOrder = await prisma.order.create({
          data: {
            userId,
            deliveryDate: new Date(deliveryDate), // Date 변환
            comment,
          },
        });

        // 주문 아이템(OrderItem) 생성
        await prisma.orderItem.createMany({
          data: items.map(({ productId, quantity }) => ({
            orderId: newOrder.orderId, // 생성된 orderId 사용
            productId,
            quantity,
          })),
        });

        return newOrder; // 최종 생성된 주문 반환
      });

      return { success: true, message: '주문이 완료되었습니다.', order };
    } catch (error) {
      throw new InternalServerErrorException(
        '주문 등록 중 오류가 발생했습니다.',
      );
    }
  }

  async findOrder(deliveryDate: string, userId: number) {
    const date = new Date(deliveryDate);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    const allProducts = await this.fetchAllProducts();
    const orders = await this.prisma.order.findMany({
      where: { deliveryDate: date, userId },
      include: { orderItems: true },
    });
    if (orders.length === 0) {
      throw new NotFoundException('주문 내역을 찾을 수 없습니다.');
    }

    const userProductPrices =
      await this.productPriceService.findManyProductPriceForUser(userId);

    const resultOrders = orders.map((order) => {
      const items = order.orderItems
        .map((item) => {
          const product = allProducts.find((p) => p.id === item.productId);
          if (!product) return null;

          const userPricePolicy = userProductPrices.find(
            (p) => p.productId === item.productId,
          );
          if (userPricePolicy?.hidden) return null;

          return {
            id: item.id,
            productId: item.productId,
            productName: product.name,
            quantity: item.quantity,
            amount: (userPricePolicy?.price ?? product.price) * item.quantity,
          };
        })
        .filter(Boolean);

      const totalAmount = items.reduce(
        (sum, item) => sum + (item as NonNullable<typeof item>).amount,
        0,
      );
      return {
        id: order.orderId,
        deliveryDate: order.deliveryDate,
        totalAmount,
        items,
      };
    });

    return {
      success: true,
      message: '주문 조회가 완료되었습니다.',
      order: resultOrders,
    };
  }
}
