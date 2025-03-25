import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProductPricesService } from '../product-prices/product-prices.service';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';

jest.mock('@nestjs/axios');
// const mockedHttpService = HttpService as jest.Mocked<typeof HttpService>;

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
        data: [{ id: 1, name: 'Product 1', price: 10000 }],
      });

      const mockCreateOrder = jest.fn().mockResolvedValue({
        orderId: 1,
        userId,
        deliveryDate: new Date(orderData.deliveryDate),
        comment: orderData.comment,
      });

      const mockCreateManyOrderItems = jest.fn().mockResolvedValue({
        count: orderData.items.length,
      });

      prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        return callback({
          order: { create: mockCreateOrder },
          orderItem: { createMany: mockCreateManyOrderItems },
        });
      });

      const result = await service.createOrder(orderData, userId);

      expect(result).toEqual({
        success: true,
        message: '주문이 완료되었습니다.',
        order: expect.any(Object),
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockCreateOrder).toHaveBeenCalledWith({
        data: {
          userId,
          deliveryDate: new Date(orderData.deliveryDate),
          comment: orderData.comment,
        },
      });
      expect(mockCreateManyOrderItems).toHaveBeenCalledWith({
        data: [{ orderId: 1, productId: 1, quantity: 2 }],
      });
    });
  });

  describe('findOrder', () => {
    it('should return all orders for the given date and user', async () => {
      const userId = 123;
      const deliveryDate = '2025-03-25';

      // httpService.get을 mock하여 응답 설정
      httpService.get = jest.fn().mockResolvedValueOnce({
        data: { data: [{ id: 1, name: '가정식 도시락', price: 10000 }] },
      });

      // Prisma order.findFirst mock
      prisma.order.findMany = jest.fn().mockResolvedValueOnce([
        {
          id: 1,
          orderId: 1,
          userId,
          deliveryDate: new Date(deliveryDate),
          orderItems: [{ productId: 1, quantity: 2 }],
        },
        {
          id: 2,
          orderId: 2,
          userId,
          deliveryDate: new Date(deliveryDate),
          orderItems: [{ productId: 1, quantity: 3 }],
        },
      ]);

      // ProductPriceService 모킹
      productPriceService.findManyProductPriceForUser = jest
        .fn()
        .mockResolvedValueOnce([{ productId: 1, price: 8000, hidden: false }]);

      // 서비스 메서드 실행
      const result = await service.findOrder(deliveryDate, userId);

      // 금액 계산 (주문당 금액: 가격 * 수량)
      const expectedOrders = [
        {
          id: 1,
          deliveryDate: new Date(deliveryDate),
          totalAmount: 16000, // 8000 * 2
          items: [
            {
              productId: 1,
              productName: '가정식 도시락',
              quantity: 2,
              amount: 16000,
            },
          ],
        },
        {
          id: 2,
          deliveryDate: new Date(deliveryDate),
          totalAmount: 24000, // 8000 * 3
          items: [
            {
              productId: 1,
              productName: '가정식 도시락',
              quantity: 3,
              amount: 24000,
            },
          ],
        },
      ];

      // 결과 검증
      expect(result).toEqual({
        success: true,
        message: '주문 조회가 완료되었습니다.',
        order: expectedOrders,
      });

      // 각 메서드가 호출되었는지 확인
      expect(prisma.order.findMany).toHaveBeenCalled();
      expect(
        productPriceService.findManyProductPriceForUser,
      ).toHaveBeenCalled();

      // 첫 번째 주문 검증 (주문 1)
      expect(result.order[0].totalAmount).toBe(16000); // 8000 * 2
      expect(result.order[0].items[0]?.amount).toBe(16000); // 8000 * 2

      // 두 번째 주문 검증 (주문 2)
      expect(result.order[1].totalAmount).toBe(24000); // 8000 * 3
      expect(result.order[1].items[0]?.amount).toBe(24000); // 8000 * 2
    });

    it('should throw an error if no orders found for the given date and user', async () => {
      // Prisma에서 findFirst가 null을 반환하도록 설정
      prisma.order.findMany = jest.fn().mockResolvedValueOnce([]);

      await expect(service.findOrder('2025-03-25', 1)).rejects.toThrow(
        new NotFoundException('주문 내역을 찾을 수 없습니다.'),
      );
    });

    it('should throw an error for invalid date format', async () => {
      await expect(service.findOrder('invalid-date', 1)).rejects.toThrow(
        new BadRequestException('Invalid date format'),
      );
    });
  });
});
