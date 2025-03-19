import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private userService: UsersService,
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
}
