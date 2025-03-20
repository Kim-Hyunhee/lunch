import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

class Items {
  @ApiProperty({
    example: 5,
    description: '주문 항목 ID',
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
    example: 1,
    description: '주문한 상품 수량',
  })
  quantity: number;

  @ApiProperty({
    example: 9000,
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

class OrdersResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '2025-02-20' })
  deliveryDate: string;

  @ApiProperty({ example: 9000 })
  totalAmount: number;

  @ApiProperty({ type: [Items] })
  items: Items[];

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

  @ApiProperty({ type: OrdersResponseDto })
  order: OrdersResponseDto;
}
