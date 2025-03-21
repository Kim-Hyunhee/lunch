import { Test, TestingModule } from '@nestjs/testing';
import { ProductPricesService } from './product-prices.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import axios from 'axios';

jest.mock('axios'); // axios 모듈을 모킹합니다.

describe('ProductPricesService', () => {
  let service: ProductPricesService;
  let prismaService: PrismaService;
  let usersService: UsersService;

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
      ],
    }).compile();

    service = module.get<ProductPricesService>(ProductPricesService);
    prismaService = module.get<PrismaService>(PrismaService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks(); // 각 테스트 후 모킹된 함수들을 초기화합니다.
  });

  describe('createProductPrice', () => {
    it('should throw BadRequestException if price and hidden are not provided', async () => {
      const dto = { userId: 2, productId: 1 }; // price와 hidden이 없음
      await expect(service.createProductPrice(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createProductPrice(dto)).rejects.toThrow(
        'price 또는 hidden은 반드시 포함되어야 합니다.',
      );
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const dto = { userId: 2, productId: 1, price: 2000, hidden: false };
      usersService.findUserByUserId = jest.fn().mockResolvedValue(null); // 사용자 없음
      await expect(service.createProductPrice(dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createProductPrice(dto)).rejects.toThrow(
        '해당 사용자는 존재하지 않습니다.',
      );
    });

    it('should throw NotFoundException if product does not exist', async () => {
      const dto = { userId: 2, productId: 1, price: 2000, hidden: false };
      usersService.findUserByUserId = jest.fn().mockResolvedValue({ id: 2 }); // 사용자 존재
      (axios.get as jest.Mock).mockResolvedValue({ data: { data: [] } }); // 상품 없음
      await expect(service.createProductPrice(dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createProductPrice(dto)).rejects.toThrow(
        '해당 상품은 존재하지 않습니다.',
      );
    });

    it('should create a new product price', async () => {
      const dto = { userId: 2, productId: 1, price: 2000, hidden: false };
      usersService.findUserByUserId = jest.fn().mockResolvedValue({ id: 2 });
      (axios.get as jest.Mock).mockResolvedValue({
        data: { data: [{ id: 1 }] },
      }); // 상품 존재
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

    it('should update an existing product price', async () => {
      const dto = { userId: 2, productId: 1, price: 1500, hidden: false };
      usersService.findUserByUserId = jest.fn().mockResolvedValue({ id: 2 });
      (axios.get as jest.Mock).mockResolvedValue({
        data: { data: [{ id: 1 }] },
      });
      prismaService.productPrice.findUnique = jest
        .fn()
        .mockResolvedValue({ id: 1 });
      prismaService.productPrice.update = jest
        .fn()
        .mockResolvedValue({ id: 1, ...dto });

      const result = await service.createProductPrice(dto);
      expect(result).toEqual({
        success: true,
        message: '회원 별 상품 판매 정책 설정이 완료되었습니다.',
        productPrice: { id: 1, ...dto },
      });
    });

    it('should throw InternalServerErrorException if fetching products fails', async () => {
      const userId = 2;

      // Axios 호출이 실패하도록 모킹
      (axios.get as jest.Mock).mockRejectedValue(
        new InternalServerErrorException(
          '상품 가격 설정 중 오류가 발생했습니다.',
        ),
      );
      await expect(service.findManyProduct(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.findManyProduct(userId)).rejects.toThrow(
        '상품 목록 조회 중 오류가 발생했습니다.',
      );
    });
  });

  describe('getProductPriceForUser', () => {
    it('should return product price for user', async () => {
      const userId = 2;
      const productId = 1;
      const mockProductPrice = {
        id: 1,
        userId,
        productId,
        price: 100,
        hidden: false,
      };

      prismaService.productPrice.findFirst = jest
        .fn()
        .mockResolvedValue(mockProductPrice);

      const result = await service.getProductPriceForUser(productId, userId);
      expect(result).toEqual(mockProductPrice);
      expect(prismaService.productPrice.findFirst).toHaveBeenCalledWith({
        where: { productId, userId },
      });
    });

    it('should return null if no product price exists', async () => {
      const userId = 2;
      const productId = 1;

      prismaService.productPrice.findFirst = jest.fn().mockResolvedValue(null);

      const result = await service.getProductPriceForUser(productId, userId);
      expect(result).toBeNull();
      expect(prismaService.productPrice.findFirst).toHaveBeenCalledWith({
        where: { productId, userId },
      });
    });
  });

  describe('findManyProduct', () => {
    it('should return products with prices for user', async () => {
      const userId = 2;
      const mockProducts = [
        { productId: 1, price: 2000 },
        { productId: 2, price: 3000 },
      ];
      const mockProductPrices = [
        { productId: 1, userId, price: 1500, hidden: false },
      ];

      (axios.get as jest.Mock).mockResolvedValue({
        data: { data: mockProducts },
      });
      prismaService.productPrice.findFirst = jest
        .fn()
        .mockImplementation((args) => {
          return (
            mockProductPrices.find(
              (price) =>
                price.productId === args.where.productId &&
                price.userId === userId,
            ) || null
          );
        });

      const result = await service.findManyProduct(userId);
      expect(result).toEqual([
        { id: 1, price: 1500, hidden: false },
        { id: 2, price: 3000, hidden: false },
      ]);
    });

    it('should exclude hidden products', async () => {
      const userId = 2;
      const mockProducts = [
        { productId: 1, price: 2000 },
        { productId: 2, price: 3000 },
      ];
      const mockProductPrices = [
        { productId: 1, userId, price: 1500, hidden: true },
      ];

      (axios.get as jest.Mock).mockResolvedValue({
        data: { data: mockProducts },
      });
      prismaService.productPrice.findFirst = jest
        .fn()
        .mockImplementation((args) => {
          return (
            mockProductPrices.find(
              (price) =>
                price.productId === args.where.productId &&
                price.userId === userId,
            ) || null
          );
        });

      const result = await service.findManyProduct(userId);
      expect(result).toEqual([{ id: 2, price: 3000, hidden: false }]); // hidden이 true인 상품 제외
    });

    it('should throw InternalServerErrorException if fetching products fails', async () => {
      const userId = 2;
      // Axios 호출이 실패하도록 모킹
      (axios.get as jest.Mock).mockRejectedValue(
        new InternalServerErrorException(
          '상품 목록 조회 중 오류가 발생했습니다.',
        ),
      );

      await expect(service.findManyProduct(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.findManyProduct(userId)).rejects.toThrow(
        '상품 목록 조회 중 오류가 발생했습니다.',
      );
    });
  });

  describe('findManyProductPriceForUser', () => {
    it('should return all product prices for user', async () => {
      const userId = 2;
      const mockProductPrices = [
        { id: 1, userId, productId: 1, price: 1000 },
        { id: 2, userId, productId: 2, price: 2000 },
      ];

      prismaService.productPrice.findMany = jest
        .fn()
        .mockResolvedValue(mockProductPrices);

      const result = await service.findManyProductPriceForUser(userId);
      expect(result).toEqual(mockProductPrices);
      expect(prismaService.productPrice.findMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });
});
