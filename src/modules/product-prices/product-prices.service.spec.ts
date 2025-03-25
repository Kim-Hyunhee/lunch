import { Test, TestingModule } from '@nestjs/testing';
import { ProductPricesService } from './product-prices.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

describe('ProductPricesService', () => {
  let service: ProductPricesService;
  let prismaService: PrismaService;
  let usersService: UsersService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductPricesService,
        {
          provide: PrismaService,
          useValue: {
            productPrice: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: UsersService,
          useValue: {
            findUserByUserId: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductPricesService>(ProductPricesService);
    prismaService = module.get<PrismaService>(PrismaService);
    usersService = module.get<UsersService>(UsersService);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProductPrice', () => {
    it('should throw BadRequestException if price and hidden are not provided', async () => {
      const dto = { userId: 2, productId: 1 };

      await expect(service.createProductPrice(dto)).rejects.toThrow(
        new BadRequestException(
          'price 또는 hidden은 반드시 포함되어야 합니다.',
        ),
      );
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const dto = { userId: 2, productId: 1, price: 2000, hidden: false };
      usersService.findUser = jest.fn().mockResolvedValue(null);

      await expect(service.createProductPrice(dto)).rejects.toThrow(
        new NotFoundException('해당 사용자는 존재하지 않습니다.'),
      );
    });

    it('should throw NotFoundException if product does not exist', async () => {
      const dto = { userId: 2, productId: 100, price: 2000, hidden: false };
      usersService.findUser = jest.fn().mockResolvedValue({ id: 2 });

      // httpService.get이 빈 배열을 반환하도록 mock 설정
      httpService.get = jest.fn().mockResolvedValue({ data: { data: [] } });

      await expect(service.createProductPrice(dto)).rejects.toThrow(
        new NotFoundException('해당 상품은 존재하지 않습니다.'),
      );
    });

    it('should create a new product price', async () => {
      const dto = { userId: 2, productId: 1, price: 2000, hidden: false };
      usersService.findUser = jest.fn().mockResolvedValue({ id: 2 });

      httpService.get = jest
        .fn()
        .mockReturnValue(of({ data: { data: [{ id: 1 }] } }));

      prismaService.productPrice.create = jest
        .fn()
        .mockResolvedValue({ id: 1, ...dto });

      const result = await service.createProductPrice(dto);
      expect(result).toEqual({
        success: true,
        message: '회원 별 상품 판매 정책 설정이 완료되었습니다.',
        productPrice: { id: 1, ...dto },
      });
    });
  });

  describe('findManyProduct', () => {
    it('should return products with prices for user', async () => {
      const userId = 2;
      const mockProducts = [
        { id: 1, name: '가정식 도시락', price: 2000 },
        { id: 23, name: '샐러드', price: 9000 },
        { id: 24, name: '샌드위치', price: 7000 },
        { id: 42, name: '치킨', price: 20000 },
      ];
      const mockProductPrices = [
        { productId: 1, userId, price: 1500, hidden: false },
      ];

      // httpService.get이 올바른 상품 목록을 반환하도록 mock 설정
      httpService.get = jest
        .fn()
        .mockResolvedValueOnce({ data: { data: mockProducts } });

      prismaService.productPrice.findFirst = jest
        .fn()
        .mockImplementation(({ where }) =>
          Promise.resolve(
            mockProductPrices.find(
              (p) => p.productId === where.productId && p.userId === userId,
            ) || null,
          ),
        );

      const result = await service.findManyProduct(userId);
      expect(result).toEqual([
        { id: 1, name: '가정식 도시락', hidden: false, price: 1500 },
        { id: 23, name: '샐러드', hidden: false, price: 9000 },
        { id: 24, name: '샌드위치', hidden: false, price: 7000 },
        { id: 42, name: '치킨', hidden: false, price: 20000 },
      ]);
    });
  });
});
