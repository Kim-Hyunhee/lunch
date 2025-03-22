import { Test, TestingModule } from '@nestjs/testing';
import { UserProductPricesController } from './user-product-prices.controller';
import { ProductPricesService } from './product-prices.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';

describe('UserProductPricesController', () => {
  let controller: UserProductPricesController;
  let productPricesService: ProductPricesService;

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
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getManyProduct', () => {
    it('should return product prices for a user', async () => {
      // Given
      const userId = 1;
      const mockResponse = [
        { id: 1, productId: 1, price: 1000, hidden: false },
        { id: 2, productId: 2, price: 2000, hidden: false },
      ];

      // When
      mockProductPricesService.findManyProduct.mockResolvedValue(mockResponse);
      const result = await controller.getManyProduct(userId);

      // Then
      expect(result).toEqual(mockResponse);
      expect(productPricesService.findManyProduct).toHaveBeenCalledWith(userId);
    });
  });
});
