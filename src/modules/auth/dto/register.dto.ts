import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'lunchlab',
    description: '사용자의 아이디',
  })
  @IsString()
  @IsNotEmpty({ message: '아이디를 입력해주세요.' })
  username: string;

  @ApiProperty({
    example: 'Lunchlab@1137',
    description: '사용자의 비밀번호',
  })
  @IsString()
  @IsNotEmpty({ message: '비밀번호를 입력해주세요.' })
  @Length(8, 20, { message: '비밀번호는 8자 이상 20자 이하로 입력해주세요.' })
  @Matches(/^(?=.*[!@#$%^&*])/, { message: '특수문자를 포함해주세요.' })
  password: string;

  @ApiProperty({
    example: '홍길동',
    description: '사용자의 이름',
  })
  @IsNotEmpty({ message: '이름을 입력해주세요.' })
  @IsString()
  name: string;

  @ApiProperty({
    example: '+821012341234',
    description: '사용자의 휴대전화번호(e164)',
  })
  @IsNotEmpty({ message: '휴대전화번호를 입력해주세요.' })
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: '휴대폰 번호는 E.164 형식이어야 합니다. 예: +821012345678',
  })
  phone: string;

  @ApiProperty({
    example: '(주) 런치랩',
    description: '사용자의 회사명',
  })
  @IsNotEmpty({ message: '회사명을 입력해주세요.' })
  @IsString()
  company: string;
}

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'lunchlab' })
  username: string;

  @ApiProperty({ example: '홍길동' })
  name: string;

  @ApiProperty({ example: '+821012345678' })
  phone: string;

  @ApiProperty({ example: '(주) 런치랩' })
  company: string;

  @ApiProperty({ example: '2025-03-19T12:00:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2025-03-19T12:00:00Z' })
  updatedAt: string;
}

export class RegisterResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: '회원가입이 완료되었습니다.' })
  message: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
