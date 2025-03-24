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
      if (invalidProducts.length) {
        throw new BadRequestException(
          `유효하지 않은 상품: ${invalidProducts.map((p) => p.productId).join(', ')}`,
        );
      }

      const order = await this.prisma.order.create({
        data: {
          userId,
          deliveryDate,
          comment,
          orderItems: {
            create: items.map(({ productId, quantity }) => ({
              productId,
              quantity,
            })),
          },
        },
        include: { orderItems: true },
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
    const order = await this.prisma.order.findFirst({
      where: { deliveryDate, userId },
      include: { orderItems: true },
    });
    if (!order) {
      throw new NotFoundException('주문 내역을 찾을 수 없습니다.');
    }

    const userProductPrices =
      await this.productPriceService.findManyProductPriceForUser(userId);
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

    return {
      success: true,
      message: '주문 조회가 완료되었습니다.',
      order: {
        id: order.orderId,
        deliveryDate: order.deliveryDate,
        totalAmount: items.reduce(
          (sum, item) => sum + (item as NonNullable<typeof item>).amount,
          0,
        ),
        items,
      },
    };
  }
}
