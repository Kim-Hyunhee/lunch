import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductPriceDto } from './dto/create-product-prices.dto';
import axios from 'axios';
import { UsersService } from '../users/users.service';

@Injectable()
export class ProductPricesService {
  private readonly PRODUCT_API = 'https://recruit-dev.lunchlab.me/v1';
  private INSTANCE = axios.create({ baseURL: this.PRODUCT_API });

  constructor(
    private prisma: PrismaService,
    private userService: UsersService,
  ) {}

  async createProductPrice(data: CreateProductPriceDto) {
    // price 또는 hidden이 반드시 있어야 함
    if (data.price === undefined && data.hidden === undefined) {
      throw new BadRequestException(
        'price 또는 hidden은 반드시 포함되어야 합니다.',
      );
    }

    const user = await this.userService.findUserByUserId(data.userId);
    if (!user) {
      throw new NotFoundException('해당 사용자는 존재하지 않습니다.');
    }

    let allProduct;
    // 상품 목록 가져오기 (axios 요청을 try-catch로 감쌈)
    try {
      const { data: response } = await this.INSTANCE.get('/products');
      allProduct = response.data;
      // 상품 목록이 비어있으면 예외 처리
      if (!allProduct || allProduct.length === 0) {
        throw new NotFoundException('상품 목록이 비어있습니다.');
      }
    } catch (error) {
      throw new InternalServerErrorException(
        '상품 목록을 가져오는 중 오류가 발생했습니다.',
      );
    }
    // response 배열에서 productId와 일치하는 id가 있는지 확인 후 에러 처리
    const existingProduct = allProduct.find(
      (product) => product.id === data.productId,
    );
    if (!existingProduct) {
      throw new NotFoundException('해당 상품은 존재하지 않습니다.');
    }

    // 이미 해당 유저에 대해 설정된 상품 가격 정책이 있는지 확인
    const existingPolicy = await this.prisma.productPrice.findUnique({
      where: {
        productId_userId: {
          productId: data.productId,
          userId: data.userId,
        },
      },
    });

    if (existingPolicy) {
      // 기존 정책이 있다면 업데이트
      const productPrice = this.prisma.productPrice.update({
        where: {
          productId_userId: {
            productId: data.productId,
            userId: data.userId,
          },
        },
        data: {
          price: data.price, // 새로운 가격으로 업데이트
          hidden: data.hidden, // 새로운 hidden 값으로 업데이트
        },
      });

      return {
        success: true,
        message: '회원 별 상품 판매 정책 설정이 완료되었습니다.',
        productPrice,
      };
    } else {
      // 새 정책을 생성
      const productPrice = await this.prisma.productPrice.create({
        data: {
          productId: data.productId,
          userId: data.userId,
          price: data.price,
          hidden: data.hidden,
        },
      });

      return {
        success: true,
        message: '회원 별 상품 판매 정책 설정이 완료되었습니다.',
        productPrice,
      };
    }
  }

  async getProductPriceForUser(productId: number, userId: number) {
    return this.prisma.productPrice.findFirst({
      where: {
        productId, // 상품 ID
        userId, // 사용자 ID
      },
    });
  }

  async findManyProduct(userId: number) {
    let allProduct;

    // 상품 목록 가져오기 (axios 요청을 try-catch로 감쌈)
    try {
      const { data: response } = await this.INSTANCE.get('/products');
      allProduct = response.data;
    } catch (error) {
      throw new InternalServerErrorException(
        '상품 목록을 가져오는 중 오류가 발생했습니다.',
      );
    }

    // 각 상품에 대해 가격과 구매 가능 여부를 처리
    const productsWithPrices = await Promise.all(
      allProduct.map(async (product) => {
        const productPrice = await this.getProductPriceForUser(
          product.id,
          userId,
        );

        // 가격 정책이 없다면 기본 가격을 사용
        const finalPrice = productPrice ? productPrice.price : product.price;
        const isHidden = productPrice ? productPrice.hidden : false;

        return {
          ...product,
          price: finalPrice,
          hidden: isHidden,
        };
      }),
    );

    // hidden이 true인 상품은 제외
    return productsWithPrices.filter((product) => !product.hidden);
  }

  async findManyProductPriceForUser(userId: number) {
    return this.prisma.productPrice.findMany({
      where: {
        userId, // 사용자 ID
      },
    });
  }
}
