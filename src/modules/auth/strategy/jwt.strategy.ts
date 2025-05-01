import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'modules/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UsersService) {
    const secretKey = process.env.JWT_ACCESS_SECRET;

    // secretKey가 없으면 서버 실행 시 에러 발생
    if (!secretKey) {
      throw new Error('JWT_ACCESS_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Authorization 헤더에서 Bearer 토큰 추출
      ignoreExpiration: false, // 만료된 토큰은 거부
      secretOrKey: secretKey, // JWT 검증을 위한 비밀 키
    });
  }

  async validate(payload: { username: string }) {
    const { username } = payload;

    // DB에서 해당 사용자를 찾음
    const user = await this.userService.findUser({ username });
    if (!user) {
      throw new UnauthorizedException('탈퇴한 회원이거나 회원이 아닙니다.');
    }

    return user; // Passport가 요청 객체(req.user)에 user 정보를 추가함
  }
}
