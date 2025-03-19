import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async checkUsernameAvailability(username: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({ where: { username } });

    // 아이디가 이미 존재하면 false 반환
    return user ? false : true;
  }
}
