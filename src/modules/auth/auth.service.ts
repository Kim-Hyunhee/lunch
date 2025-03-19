import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  // 회원가입 로직
  async register(data: RegisterDto) {
    const { password, ...otherData } = data;

    // 이메일 중복 체크
    const isUsernameAvailable =
      await this.userService.checkUsernameAvailability(data.username);
    if (!isUsernameAvailable) {
      throw new BadRequestException('이미 사용 중인 아이디입니다.');
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 유저 생성
    const user = await this.prisma.user.create({
      data: { password: hashedPassword, ...otherData },
    });

    const { password: hashingPassword, ...userWithoutPassword } = user;

    // 성공 메시지 반환(비밀번호 제외)
    return {
      success: true,
      message: '회원가입이 완료되었습니다.',
      user: userWithoutPassword,
    };
  }

  // 로그인 로직
  async login(data: LoginDto) {
    // 사용자 확인
    const user = await this.userService.findUserByUsername(data.username);
    if (!user) {
      throw new NotFoundException('가입되지 않은 계정입니다.');
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('비밀번호가 틀렸습니다.');
    }

    // JwtToken 발급 (payload: { id: number; username: string })
    const accessToken = this.jwtService.sign(
      { sub: user.id, username: user.username },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '1h' },
    );

    const { password, ...otherUserData } = user;

    // 성공 응답 반환
    return {
      success: true,
      message: '로그인 되었습니다',
      data: { accessToken },
      user: otherUserData,
    };
  }
}
