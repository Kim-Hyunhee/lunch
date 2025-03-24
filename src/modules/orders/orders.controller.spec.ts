import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { NotFoundException } from '@nestjs/common';
import { FindOrderDto } from './dto/find-order.dto';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: { findOrder: jest.fn() }, // mock
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  const findOrderDto = new FindOrderDto();
  findOrderDto.deliveryDate = '2025-02-20';
  const user = {
    id: 3,
    username: 'username',
    role: 'user',
    name: 'name',
    password: 'string',
    phone: 'string',
    company: 'string',
    createdAt: new Date('2025-03-19T12:00:00Z'),
    updatedAt: new Date('2025-03-19T12:00:00Z'),
  };
  describe('findOrder', () => {
    it('should return the order details', async () => {
      const mockOrderResponse = {
        success: true,
        message: '주문 조회가 완료되었습니다.',
        order: {
          id: 5,
          deliveryDate: '2025-02-20',
          totalAmount: 8000,
          items: [
            {
              id: 5,
              productId: 1,
              productName: '가정식 도시락',
              quantity: 1,
              amount: 8000,
            },
          ],
        },
      };

      service.findOrder = jest.fn().mockResolvedValue(mockOrderResponse);

      const result = await controller.getOrder(findOrderDto, user);
      expect(result).toEqual(mockOrderResponse);
    });

    it('should throw NotFoundException if order not found', async () => {
      service.findOrder = jest
        .fn()
        .mockRejectedValue(
          new NotFoundException('주문 내역을 찾을 수 없습니다.'),
        );
      await expect(controller.getOrder(findOrderDto, user)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
