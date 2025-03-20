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
    description: '주문할 상품 ID',
  })
  @IsNumber()
  @IsNotEmpty({ message: '상품 ID를 입력해주세요.' })
  productId: number;

  @ApiProperty({
    example: 1,
    description: '주문할 상품 수량',
  })
  @IsNumber()
  @IsNotEmpty({ message: '상품 수량을 입력해주세요.' })
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({
    example: '2025-02-20',
    description: '배송 요청일',
  })
  @IsDateString()
  @IsNotEmpty({ message: '배송 요청일을 입력해주세요.' })
  deliveryDate: string;

  @ApiProperty({
    description: '주문할 상품 목록',
    type: [Item],
  })
  @IsNotEmpty({ message: '상품 ID를 입력해주세요.' })
  items: Item[];

  @ApiProperty({
    example: '배송 시 문 앞에 두어주세요',
    description: '주문 요청 사항',
    required: false,
  })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class OrderResponseDto {
  @ApiProperty({ example: 5 })
  orderId: number;

  @ApiProperty({ example: '2025-02-20' })
  deliveryDate: string;

  @ApiProperty({ example: 3 })
  userId: number;

  @ApiProperty({ example: '배송 시 문 앞에 두어주세요' })
  comment: string;

  @ApiProperty({ type: [Item] })
  items: Item[];

  @ApiProperty({ example: '2025-03-20T04:55:04.823Z' })
  createdAt: string;

  @ApiProperty({ example: '2025-03-20T04:55:04.823Z' })
  updatedAt: string;
}

export class CreateOrderResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: '주문이 완료되었습니다.' })
  message: string;

  @ApiProperty({ type: OrderResponseDto })
  order: OrderResponseDto;
}
