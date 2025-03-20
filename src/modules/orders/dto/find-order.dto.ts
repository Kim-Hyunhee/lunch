import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

class Item {
  @ApiProperty({
    example: 1,
    description: '주문 ID',
  })
  id: number;

  @ApiProperty({
    example: 1,
    description: '주문한 상품 ID',
  })
  productId: number;

  @ApiProperty({
    example: '가정식 도시락',
    description: '주문한 상품 이름',
  })
  productName: string;

  @ApiProperty({
    example: 10,
    description: '주문한 상품 수량',
  })
  quantity: number;

  @ApiProperty({
    example: 100000,
    description: '주문한 상품 금액',
  })
  amount: number;
}

export class FindOrderDto {
  @ApiProperty({
    example: '2025-02-20',
    description: '배송 요청일',
  })
  @IsDateString()
  @IsNotEmpty({ message: '배송 요청일을 입력해주세요.' })
  deliveryDate: string;
}

export class OrderResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '2025-02-20' })
  deliveryDate: string;

  @ApiProperty({ example: 140000 })
  totalAmount: number;

  @ApiProperty({ example: [Item] })
  items: Item;

  @ApiProperty({ example: '2025-03-19T12:00:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2025-03-19T12:00:00Z' })
  updatedAt: string;
}

export class FindOrderResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: '주문 조회가 완료되었습니다.' })
  message: string;

  @ApiProperty({ type: OrderResponseDto })
  order: OrderResponseDto;
}
