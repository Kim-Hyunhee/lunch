import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // 공통 메서드로 findFirst 처리
  private async findUser(where: { username: string }) {
    return this.prisma.user.findFirst({ where });
  }

  // 아이디 중복 체크
  async checkUsernameAvailability(username: string): Promise<boolean> {
    const user = await this.findUser({ username });

    return !user; // user가 있으면 false, 없으면 true
  }

  // 사용자 정보 찾기
  async findUserByUsername(username: string) {
    return this.findUser({ username });
  }
}
