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

@Injectable()
export class ProductPricesService {
  private readonly PRODUCT_API = 'https://recruit-dev.lunchlab.me/v1';
  private INSTANCE = axios.create({ baseURL: this.PRODUCT_API });
  constructor(
    private prisma: PrismaService,
    private userService: UsersService,
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

  private async getAllProducts() {
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

  async createProductPrice(data: CreateProductPriceDto) {
    if (data.price === undefined && data.hidden === undefined) {
      throw new BadRequestException(
        'price 또는 hidden은 반드시 포함되어야 합니다.',
      );
    }

    const user = await this.userService.findUser({ id: data.userId });
    if (!user) {
      throw new NotFoundException('해당 사용자는 존재하지 않습니다.');
    }

    const allProduct = await this.getAllProducts();
    const existingProduct = allProduct.find(
      (product) => product.id === data.productId,
    );
    if (!existingProduct) {
      throw new NotFoundException('해당 상품은 존재하지 않습니다.');
    }

    const existingPolicy = await this.prisma.productPrice.findFirst({
      where: {
        productId: data.productId,
        userId: data.userId,
      },
    });

    let productPrice;
    if (existingPolicy) {
      productPrice = await this.prisma.productPrice.update({
        where: {
          id: existingPolicy.id, // 기존 레코드의 ID로 업데이트
        },
        data: { price: data.price, hidden: data.hidden },
      });
    } else {
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

  async getProductPriceForUser(productId: number, userId: number) {
    return this.prisma.productPrice.findFirst({ where: { productId, userId } });
  }

  async findManyProduct(userId: number) {
    const allProduct = await this.getAllProducts();

    const productsWithPrices = await Promise.all(
      allProduct.map(async (product) => {
        const productPrice = await this.getProductPriceForUser(
          product.id,
          userId,
        );
        return {
          ...product,
          price: productPrice ? productPrice.price : product.price,
          hidden: productPrice ? productPrice.hidden : false,
        };
      }),
    );
    return productsWithPrices.filter((product) => !product.hidden);
  }

  async findManyProductPriceForUser(userId: number) {
    return this.prisma.productPrice.findMany({ where: { userId } });
  }
}
