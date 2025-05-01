import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductPriceDto } from './dto/create-product-prices.dto';
import { UsersService } from '../users/users.service';
import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { ProductService } from 'utils/product.service';

@Injectable()
export class ProductPricesService {
  // 상품 API의 기본 URL 설정
  // private readonly PRODUCT_API = 'https://recruit-dev.lunchlab.me/v1';
  // private INSTANCE = axios.create({ baseURL: this.PRODUCT_API });

  constructor(
    private readonly prisma: PrismaService, // Prisma 서비스 주입 (DB 연동)
    private readonly userService: UsersService, // 사용자 서비스 주입
    private readonly productService: ProductService,
  ) {
    // axios-retry 설정: 네트워크 요청 실패 시 재시도 가능하도록 설정
    // axiosRetry(this.INSTANCE, {
    //   retries: 3, // 최대 3번 재시도
    //   retryDelay: axiosRetry.exponentialDelay, // 재시도 간격을 지수적으로 증가
    //   retryCondition: (error: AxiosError<unknown, any>) => {
    //     // 5xx 서버 오류 발생 시에만 재시도
    //     return error.response ? error.response.status >= 500 : false;
    //   },
    // });
  }

  /**
   * 모든 상품 정보를 외부 API에서 가져오는 메서드
   */
  // private async getAllProducts() {
  //   try {
  //     // 상품 목록 가져오기
  //     const { data: response } = await this.INSTANCE.get('/products');
  //     if (!response.data || response.data.length === 0) {
  //       throw new NotFoundException('상품 목록이 비어있습니다.');
  //     }
  //     return response.data;
  //   } catch (error) {
  //     throw new InternalServerErrorException(
  //       '상품 목록을 가져오는 중 오류가 발생했습니다.',
  //     );
  //   }
  // }

  /**
   * 회원별 상품 가격 정책을 생성 또는 업데이트하는 메서드
   */
  async createProductPrice(data: CreateProductPriceDto) {
    // price 또는 hidden 값이 필수
    if (data.price === undefined && data.hidden === undefined) {
      throw new BadRequestException(
        'price 또는 hidden은 반드시 포함되어야 합니다.',
      );
    }

    // 유저 존재 여부 확인
    const user = await this.userService.findUser({ id: data.userId });
    if (!user) {
      throw new NotFoundException('해당 사용자는 존재하지 않습니다.');
    }

    // 상품 목록 가져오기
    const allProduct = await this.productService.getProductData();
    // const allProduct = await this.getAllProducts();
    // 외부 API의 product와 data로 들어온 productId 비교
    const existingProduct = allProduct.find(
      (product) => product.id === data.productId,
    );
    if (!existingProduct) {
      throw new NotFoundException('해당 상품은 존재하지 않습니다.');
    }

    // 기존 가격 정책 존재 여부 확인
    const existingPolicy = await this.prisma.productPrice.findFirst({
      where: {
        productId: data.productId,
        userId: data.userId,
      },
    });

    let productPrice;
    if (existingPolicy) {
      // 기존 정책이 존재하면 업데이트
      productPrice = await this.prisma.productPrice.update({
        where: { id: existingPolicy.id },
        data: { price: data.price, hidden: data.hidden },
      });
    } else {
      // 없으면 새로 생성
      productPrice = await this.prisma.productPrice.create({
        data: {
          productId: data.productId,
          userId: data.userId,
          price: data.price,
          hidden: data.hidden,
        },
      });
    }

    return {
      success: true,
      message: '회원 별 상품 판매 정책 설정이 완료되었습니다.',
      productPrice,
    };
  }

  /**
   * 특정 사용자의 특정 상품 가격 정보를 조회하는 메서드
   */
  async getProductPriceForUser(productId: number, userId: number) {
    return this.prisma.productPrice.findFirst({ where: { productId, userId } });
  }

  /**
   * 특정 사용자가 볼 수 있는 상품 목록을 조회하는 메서드
   */
  async findManyProduct(userId: number) {
    // 외부 API에서 상품 목록 조회하기
    const allProduct = await this.productService.getProductData();
    // const allProduct = await this.getAllProducts();

    // 사용자id와 상품에 정책이 있는지 확인
    const productsWithPrices = await Promise.all(
      allProduct.map(async (product) => {
        const productPrice = await this.getProductPriceForUser(
          product.id,
          userId,
        );
        return {
          ...product,
          price: productPrice ? productPrice.price : product.price, // 가격 정책이 있으면 적용
          hidden: productPrice ? productPrice.hidden : false,
        };
      }),
    );

    // 숨김 상품 제외
    return productsWithPrices.filter((product) => !product.hidden);
  }

  /**
   * 특정 사용자의 모든 상품 가격 정보를 조회하는 메서드
   */
  async findManyProductPriceForUser(userId: number) {
    return this.prisma.productPrice.findMany({
      where: { userId, hidden: true },
    });
  }
}
