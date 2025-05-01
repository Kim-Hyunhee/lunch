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
import { ProductService } from 'utils/product.service';

@Injectable()
export class OrdersService {
  // private readonly PRODUCT_API = 'https://recruit-dev.lunchlab.me/v1';
  // private INSTANCE = axios.create({ baseURL: this.PRODUCT_API });
  constructor(
    private readonly prisma: PrismaService,
    private readonly productPriceService: ProductPricesService,
    private readonly productService: ProductService,
  ) {
    // axios-retry 설정: 네트워크 요청 실패 시 최대 3회 재시도, 5xx 에러 발생 시만 재시도
    // axiosRetry(this.INSTANCE, {
    //   retries: 3, // 최대 재시도 횟수
    //   retryDelay: axiosRetry.exponentialDelay, // 지연 시간 설정
    //   retryCondition: (error: AxiosError<unknown, any>) => {
    //     return error.response ? error.response.status >= 500 : false;
    //   },
    // });
  }

  // 외부 API에서 전체 상품 목록을 가져오는 메서드
  // private async fetchAllProducts() {
  //   try {
  //     const { data } = await this.INSTANCE.get('/products');
  //     if (!data || data.length === 0) {
  //       throw new NotFoundException('상품 목록이 비어있습니다.');
  //     }
  //     return data.data;
  //   } catch (error) {
  //     throw new InternalServerErrorException(
  //       '상품 목록을 가져오는 중 오류가 발생했습니다.',
  //     );
  //   }
  // }

  // 주문을 생성하는 메서드
  async createOrder(data: CreateOrderDto, userId: number) {
    const { deliveryDate, comment, items } = data;

    // 외부 API에서 상품 목록을 가져와 존재하는 상품인지 확인
    // const allProducts = await this.fetchAllProducts();
    const allProducts = await this.productService.getProductData();

    // Set을 사용하여 상품 ID를 저장 -> O(1) 복잡도로 빠르게 포함 여부 확인 가능
    const allProductIds = new Set(allProducts.map((p) => p.id));

    // 사용자가 요청한 상품이 존재하는 상품인지 검증
    const invalidProducts = items.filter(
      (item) => !allProductIds.has(item.productId),
    );
    if (invalidProducts.length > 0) {
      throw new BadRequestException(
        `유효하지 않은 상품: ${invalidProducts.map((p) => p.productId).join(', ')}`,
      );
    }

    // 사용자의 상품별 가격 정책 조회
    const userProductPrices =
      await this.productPriceService.findManyProductPriceForUser(userId);

    // hidden 상태인 상품 확인
    const hiddenProducts = userProductPrices.map(
      (product) => product.productId,
    ); // 필터링된 상품들의 productId만 추출

    const hiddenItems = items.filter((item) =>
      hiddenProducts.includes(item.productId),
    );
    if (hiddenItems.length > 0) {
      throw new BadRequestException(
        `주문할 수 없는 상품: ${hiddenItems.map((p) => p.productId).join(', ')}`,
      );
    }

    // 트랜잭션을 사용하여 주문과 주문 아이템을 생성
    const order = await this.prisma.$transaction(async (prisma) => {
      // 주문(Order) 생성
      const newOrder = await prisma.order.create({
        data: {
          userId,
          deliveryDate: new Date(deliveryDate), // Date 변환하여 저장
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
  }

  // 특정 날짜의 주문을 조회하는 메서드
  async findOrder(deliveryDate: string, userId: number) {
    const date = new Date(deliveryDate);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    // 외부 API에서 상품 정보 가져오기
    // const allProducts = await this.fetchAllProducts();
    const allProducts = await this.productService.getProductData();

    // 사용자의 특정 날짜 주문 조회
    const orders = await this.prisma.order.findMany({
      where: { deliveryDate: date, userId },
      include: { orderItems: true },
    });
    if (orders.length === 0) {
      throw new NotFoundException('주문 내역을 찾을 수 없습니다.');
    }

    // 사용자의 상품별 가격 정책 조회 (hidden === true)
    const userProductPrices =
      await this.productPriceService.findManyProductPriceForUser(userId);

    // 주문 정보 가공
    const resultOrders = orders.map((order) => {
      // 오더 아이템에서 상품이 없으면 필터링
      const items = order.orderItems
        .map((item) => {
          const product = allProducts.find((p) => p.id === item.productId);
          if (!product) return null;

          // 사용자의 개별 가격 정책이 존재하는 경우 적용, 숨겨진 상품은 필터링
          const userPricePolicy = userProductPrices.find(
            (p) => p.productId === item.productId,
          );
          // if (userPricePolicy?.hidden) return null;

          return {
            id: item.id,
            productId: item.productId,
            productName: product.name,
            quantity: item.quantity,
            amount: (userPricePolicy?.price ?? product.price) * item.quantity,
          };
        })
        .filter(Boolean); // null 값 제거

      // 총 주문 금액 계산
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
