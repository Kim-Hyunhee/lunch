import { Test, TestingModule } from '@nestjs/testing';
import { AdminProductPricesController } from './admin-product-prices.controller';
import { ProductPricesService } from './product-prices.service';
import { CreateProductPriceDto } from './dto/create-product-prices.dto';
import { HttpStatus } from '@nestjs/common';

describe('AdminProductPricesController', () => {
  let controller: AdminProductPricesController;
  let productPricesService: ProductPricesService;

  const mockProductPricesService = {
    createProductPrice: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminProductPricesController],
      providers: [
        {
          provide: ProductPricesService,
          useValue: mockProductPricesService,
        },
      ],
    }).compile();

    controller = module.get<AdminProductPricesController>(
      AdminProductPricesController,
    );
    productPricesService =
      module.get<ProductPricesService>(ProductPricesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('postProductPrice', () => {
    it('should create a product price and return response', async () => {
      // Given
      const dto: CreateProductPriceDto = {
        userId: 1,
        productId: 1,
        price: 1000,
        hidden: false,
      };

      const mockResponse = {
        id: 1,
        ...dto,
      };

      // When
      mockProductPricesService.createProductPrice.mockResolvedValue(
        mockResponse,
      );
      const result = await controller.postProductPrice(dto);

      // Then
      expect(result).toEqual(mockResponse);
      expect(productPricesService.createProductPrice).toHaveBeenCalledWith(dto);
    });

    it('should return 400 error if required fields are missing', async () => {
      // Given
      const dto: Partial<CreateProductPriceDto> = {
        userId: 1,
        productId: 1,
      }; // price 또는 hidden 없음

      // When
      mockProductPricesService.createProductPrice.mockRejectedValue({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'price 또는 hidden은 반드시 포함되어야 합니다.',
      });

      // Then
      await expect(
        controller.postProductPrice(dto as CreateProductPriceDto),
      ).rejects.toEqual({
        statusCode: 400,
        message: 'price 또는 hidden은 반드시 포함되어야 합니다.',
      });

      expect(productPricesService.createProductPrice).toHaveBeenCalledWith(
        dto as CreateProductPriceDto,
      );
    });
  });
});
