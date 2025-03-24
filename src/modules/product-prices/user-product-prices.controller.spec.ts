import { Test, TestingModule } from '@nestjs/testing';
import { UserProductPricesController } from './user-product-prices.controller';
import { ProductPricesService } from './product-prices.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';
import { UsersService } from '../users/users.service';

describe('UserProductPricesController', () => {
  let controller: UserProductPricesController;
  let productPricesService: ProductPricesService;
  let userService: UsersService;

  const mockProductPricesService = {
    findManyProduct: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn((context: ExecutionContext) => {
      return true; // 인증된 사용자가 접근 가능하도록 설정
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserProductPricesController],
      providers: [
        {
          provide: ProductPricesService,
          useValue: mockProductPricesService,
        },
        {
          provide: UsersService,
          useValue: {
            findUserByUserId: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<UserProductPricesController>(
      UserProductPricesController,
    );
    productPricesService =
      module.get<ProductPricesService>(ProductPricesService);
    userService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getManyProduct', () => {
    it('should return product prices for a user', async () => {
      // Given
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
      const mockResponse = [
        { id: 1, productId: 1, price: 1000, hidden: false },
        { id: 2, productId: 2, price: 2000, hidden: false },
      ];

      // When
      mockProductPricesService.findManyProduct.mockResolvedValue(mockResponse);
      const result = await controller.getManyProduct(user);

      // Then
      expect(result).toEqual(mockResponse);
      expect(productPricesService.findManyProduct).toHaveBeenCalledWith(
        user.id,
      );
    });
  });
});
