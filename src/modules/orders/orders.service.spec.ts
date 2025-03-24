import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProductPricesService } from '../product-prices/product-prices.service';
import { HttpService } from '@nestjs/axios';
import { NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { of } from 'rxjs';

jest.mock('@nestjs/axios');
const mockedHttpService = HttpService as jest.Mocked<typeof HttpService>;

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: PrismaService;
  let productPriceService: ProductPricesService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: {
            order: {
              create: jest.fn(),
              findFirst: jest.fn(),
            },
          },
        },
        {
          provide: ProductPricesService,
          useValue: {
            findManyProductPriceForUser: jest.fn(),
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

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);
    productPriceService =
      module.get<ProductPricesService>(ProductPricesService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrder', () => {
    it('should create an order successfully', async () => {
      const orderData: CreateOrderDto = {
        deliveryDate: '2025-03-25',
        comment: 'Fast delivery please',
        items: [{ productId: 1, quantity: 2 }],
      };
      const userId = 123;

      httpService.get = jest.fn().mockResolvedValueOnce({
        data: { data: [{ id: 1, name: 'Product 1', price: 10000 }] },
      });

      prisma.order.create = jest.fn().mockResolvedValueOnce({
        id: 1,
        userId,
        deliveryDate: orderData.deliveryDate,
        comment: orderData.comment,
        orderItems: [{ productId: 1, quantity: 2 }],
      });

      const result = await service.createOrder(orderData, userId);

      expect(result).toEqual({
        success: true,
        message: '주문이 완료되었습니다.',
        order: expect.any(Object),
      });
      expect(prisma.order.create).toHaveBeenCalled();
    });
  });

  describe('findOrder', () => {
    it('should return an order successfully', async () => {
      const userId = 123;
      const deliveryDate = '2025-03-23';

      // httpService.get을 mock하여 응답 설정
      httpService.get = jest.fn().mockResolvedValueOnce({
        data: { data: [{ id: 1, name: 'Product 1', price: 10000 }] },
      });

      // Prisma order.findFirst mock
      prisma.order.findFirst = jest.fn().mockResolvedValueOnce({
        orderId: 1,
        userId,
        deliveryDate,
        orderItems: [{ productId: 1, quantity: 2 }],
      });

      // ProductPriceService 모킹
      productPriceService.findManyProductPriceForUser = jest
        .fn()
        .mockResolvedValueOnce([{ productId: 1, price: 8000, hidden: false }]);

      // 서비스 메서드 실행
      const result = await service.findOrder(deliveryDate, userId);

      // 결과 검증
      expect(result).toEqual({
        success: true,
        message: '주문 조회가 완료되었습니다.',
        order: expect.any(Object),
      });

      // 각 메서드가 호출되었는지 확인
      expect(prisma.order.findFirst).toHaveBeenCalled();
      expect(
        productPriceService.findManyProductPriceForUser,
      ).toHaveBeenCalled();
    });

    it('should throw NotFoundException if no order is found', async () => {
      const userId = 123;
      const deliveryDate = '2025-03-23';

      // Prisma에서 findFirst가 null을 반환하도록 설정
      prisma.order.findFirst = jest.fn().mockResolvedValueOnce(null);

      // NotFoundException이 발생해야 함
      await expect(service.findOrder(deliveryDate, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
