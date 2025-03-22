import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import axios from 'axios';
import { ProductPricesService } from '../product-prices/product-prices.service';

@Injectable()
export class OrdersService {
  private readonly PRODUCT_API = 'https://recruit-dev.lunchlab.me/v1';
  private INSTANCE = axios.create({ baseURL: this.PRODUCT_API });

  constructor(
    private prisma: PrismaService,
    private productPriceService: ProductPricesService,
  ) {}

  async createOrder(data: CreateOrderDto, userId: number) {
    const { deliveryDate, comment, items } = data;

    try {
      // 상품 목록 가져오기
      const { data: response } = await this.INSTANCE.get('/products');
      const allProduct = response.data;

      // 주문하려는 상품이 실제로 존재하는지 검증
      const allProductIds = new Set(allProduct.map((p) => p.id));

      const invalidProducts = items.filter(
        (item) => !allProductIds.has(item.productId),
      );
      if (invalidProducts.length > 0) {
        throw new BadRequestException(
          `유효하지 않은 상품이 포함되어 있습니다: ${invalidProducts.map((p) => p.productId).join(', ')}`,
        );
      }

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

      return { success: true, message: '주문이 완료되었습니다.', order };
    } catch (error) {
      // console.error('Error Status:', error.response?.status);
      // console.error('Error Message:', error.response?.data?.error?.message);
      // console.error('Error Headers:', error.response?.headers);

      throw new InternalServerErrorException(
        '주문 등록 중 오류가 발생했습니다.',
      );
    }
  }

  async findOrder(deliveryDate: string, userId: number) {
    // 상품 목록 가져오기
    let allProduct;
    try {
      // 상품 목록 가져오기 (axios 요청)
      const { data: response } = await this.INSTANCE.get('/products');

      allProduct = response.data;
    } catch (error) {
      // axios 요청 오류가 발생했을 경우 처리
      throw new InternalServerErrorException(
        '상품 목록을 가져오는 중 오류가 발생했습니다.',
      );
    }

    // 주문 정보 가져오기
    const order = await this.prisma.order.findFirst({
      where: { deliveryDate, userId },
      include: { orderItems: true },
    });
    // 주문이 없으면 예외 처리
    if (!order) {
      throw new NotFoundException('주문 내역을 찾을 수 없습니다.');
    }

    // 사용자별 가격 정책 가져오기
    const userProductPrices =
      await this.productPriceService.findManyProductPriceForUser(userId);

    // 주문한 상품 목록을 가공
    const items = order.orderItems
      .map((item) => {
        // 상품 ID로 기본 정보 가져오기
        const product = allProduct.find((p) => p.id === item.productId);
        if (!product) return null; // 상품이 존재하지 않으면 제외

        // 사용자별 가격 정책 적용
        const userPricePolicy = userProductPrices.find(
          (p) => p.productId === item.productId,
        );
        if (userPricePolicy?.hidden) return null; // 구매 불가능한 상품 제외

        return {
          id: item.id,
          productId: item.productId,
          productName: product.name, // API에서 가져온 상품명
          quantity: item.quantity,
          amount: (userPricePolicy?.price ?? product.price) * item.quantity, // 사용자 가격 or 기본 가격
        };
      })
      .filter((item) => item !== null); // null 값 제거

    // 총 주문 금액 계산
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

    // 최종 응답 데이터 반환
    return {
      success: true,
      message: '주문 조회가 완료되었습니다.',
      order: {
        id: order.orderId,
        deliveryDate: order.deliveryDate,
        totalAmount,
        items,
      },
    };
  }
}
