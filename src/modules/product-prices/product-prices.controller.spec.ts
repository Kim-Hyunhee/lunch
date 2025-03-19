import { Test, TestingModule } from '@nestjs/testing';
import { AdminProductPricesController } from './admin-product-prices.controller';

describe('ProductPricesController', () => {
  let controller: AdminProductPricesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminProductPricesController],
    }).compile();

    controller = module.get<AdminProductPricesController>(
      AdminProductPricesController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
