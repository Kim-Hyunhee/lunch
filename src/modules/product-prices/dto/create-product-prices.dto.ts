import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateProductPriceDto {
  @ApiProperty({
    example: 1,
    description: '상품 ID',
  })
  @IsNumber()
  @IsNotEmpty({ message: '상품 ID를 입력해주세요.' })
  productId: number;

  @ApiProperty({
    example: 1,
    description: '회원 ID',
  })
  @IsNumber()
  @IsNotEmpty({ message: '회원 ID를 입력해주세요.' })
  userId: number;

  @ApiProperty({
    example: 12800,
    description: '상품 가격',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  price: number;

  @ApiProperty({
    example: false,
    description: '구매가능여부',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  hidden: boolean;
}

export class ProductPriceResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 23 })
  productId: number;

  @ApiProperty({ example: 2 })
  userId: number;

  @ApiProperty({ example: 12800 })
  price: number;

  @ApiProperty({ example: false })
  hidden: boolean;

  @ApiProperty({ example: '2025-03-19T12:00:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2025-03-19T12:00:00Z' })
  updatedAt: string;
}

export class CreateProductPriceResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: '회원 별 상품 판매 정책 설정이 완료되었습니다.' })
  message: string;

  @ApiProperty({ type: ProductPriceResponseDto })
  productPrice: ProductPriceResponseDto;
}
