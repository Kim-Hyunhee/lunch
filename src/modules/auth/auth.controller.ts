import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, RegisterResponseDto } from './dto/register.dto';
import { LoginDto, LoginResponseDto } from './dto/login.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '회원가입',
    description: '사용자를 새로 등록합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '회원 가입 성공',
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '유효성 검사 실패',
    schema: {
      example: {
        message: [
          '이미 사용 중인 아이디입니다.',
          '아이디, 비밀번호, 이름, 휴대전화번호, 회사명을 입력해주세요.',
          '비밀번호는 8자 이상 20자 이하로 입력해주세요.',
          '휴대폰 번호는 E.164 형식이어야 합니다.',
        ],
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  async postRegister(@Body() data: RegisterDto) {
    return await this.authService.register(data);
  }

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '로그인',
    description: '로그인을 합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '유효성 검사 실패',
    schema: {
      example: {
        message: [
          '아이디, 비밀번호를 입력해주세요.',
          '비밀번호가 틀렸습니다.',
          '가입되지 않은 계정입니다.',
          '비밀번호는 8자 이상 20자 이하로 입력해주세요.',
          '특수문자를 포함해주세요.',
        ],
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '가입되지 않은 사용자',
    schema: {
      example: {
        message: '가입되지 않은 계정입니다.',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  })
  async postLogin(@Body() data: LoginDto) {
    return await this.authService.login(data);
  }
}
