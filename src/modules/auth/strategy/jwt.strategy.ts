import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from 'jsonwebtoken';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UsersService) {
    const secretKey = process.env.JWT_ACCESS_SECRET;

    // secretKey가 없다면 예외를 던지거나 기본값 설정
    if (!secretKey) {
      throw new Error('JWT_ACCESS_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secretKey, // secretKey를 문자열로 전달
    });
  }

  async validate(payload: JwtPayload) {
    const { username } = payload;

    const user = await this.userService.findUserByUsername(username);
    if (!user) {
      throw new UnauthorizedException('탈퇴한 회원이거나 회원이 아닙니다.');
    }

    return user;
  }
}
