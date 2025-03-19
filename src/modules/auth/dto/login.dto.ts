import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { UserResponseDto } from './register.dto';

export class LoginDto {
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
}

class AuthTokensDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Access Token',
  })
  accessToken: string;
}

export class LoginResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: '로그인 되었습니다.' })
  message: string;

  @ApiProperty({ type: AuthTokensDto })
  data: AuthTokensDto;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
