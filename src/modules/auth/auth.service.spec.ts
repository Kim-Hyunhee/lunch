import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: PrismaService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: UsersService,
          useValue: {
            checkUsernameAvailability: jest.fn(),
            findUserByUsername: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw BadRequestException if username is already taken', async () => {
      const dto = {
        username: 'testuser',
        password: 'password123',
        name: 'test',
        phone: '+821011111111',
        company: 'test',
      };
      usersService.checkUsernameAvailability = jest
        .fn()
        .mockResolvedValue(false);

      await expect(authService.register(dto)).rejects.toThrow(
        new BadRequestException('이미 사용 중인 아이디입니다.'),
      );
    });

    it('should successfully register a user', async () => {
      const dto = {
        username: 'testuser',
        password: 'password123',
        name: 'test',
        phone: '+821011111111',
        company: 'test',
      };
      usersService.checkUsernameAvailability = jest
        .fn()
        .mockResolvedValue(true);

      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(
          async (password: string, saltOrRounds: number): Promise<string> => {
            return Promise.resolve('hashedPassword'); // 명시적인 Promise 반환
          },
        );
      prismaService.user.create = jest.fn().mockResolvedValue({
        id: 1,
        username: 'testuser',
        password: 'hashedPassword',
        name: 'test',
        phone: '+821011111111',
        company: 'test',
      });

      const result = await authService.register(dto);
      expect(result).toEqual({
        success: true,
        message: '회원가입이 완료되었습니다.',
        user: {
          id: 1,
          username: 'testuser',
          name: 'test',
          phone: '+821011111111',
          company: 'test',
        },
      });
    });
  });

  describe('login', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      const dto = { username: 'nonexistent', password: 'password123' };
      usersService.findUserByUsername = jest.fn().mockResolvedValue(null);

      await expect(authService.login(dto)).rejects.toThrow(
        new NotFoundException('가입되지 않은 계정입니다.'),
      );
    });

    it('should throw BadRequestException if password is incorrect', async () => {
      const dto = { username: 'testuser', password: 'wrongPassword' };
      usersService.findUserByUsername = jest.fn().mockResolvedValue({
        id: 1,
        username: 'testuser',
        password: 'hashedPassword',
      });
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(
          async (password: string, hash: string): Promise<boolean> => {
            return Promise.resolve(false); // 명시적인 Promise 반환
          },
        ); // 비밀번호 검증 Mock

      await expect(authService.login(dto)).rejects.toThrow(
        new BadRequestException('비밀번호가 틀렸습니다.'),
      );
    });

    it('should successfully log in a user', async () => {
      const dto = { username: 'testuser', password: 'password123' };
      usersService.findUserByUsername = jest.fn().mockResolvedValue({
        id: 1,
        username: 'testuser',
        password: 'hashedPassword',
      });
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(
          async (password: string, hash: string): Promise<boolean> => {
            return Promise.resolve(true); // 명시적인 Promise 반환
          },
        ); // 비밀번호 검증 Mock
      jwtService.sign = jest.fn().mockReturnValue('accessToken'); // JwtToken 발급 Mock

      const result = await authService.login(dto);
      expect(result).toEqual({
        success: true,
        message: '로그인 되었습니다',
        data: { accessToken: 'accessToken' },
        user: { id: 1, username: 'testuser' },
      });
    });
  });
});
