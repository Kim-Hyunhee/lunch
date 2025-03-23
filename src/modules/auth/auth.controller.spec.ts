import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('postRegister', () => {
    it('should successfully register a user', async () => {
      const dto: RegisterDto = {
        username: 'testuser',
        password: 'password123',
        name: 'test',
        phone: '+821011111111',
        company: 'test',
      };
      const response = {
        success: true,
        message: '회원가입이 완료되었습니다.',
        user: {
          id: 1,
          username: 'testuser',
          name: 'test',
          phone: '+821011111111',
          company: 'test',
        },
      };

      authService.register = jest.fn().mockResolvedValue(response);

      const result = await authController.postRegister(dto);
      expect(result).toEqual(response);
      expect(authService.register).toHaveBeenCalledWith(dto);
    });

    it('should throw BadRequestException if registration fails', async () => {
      const dto: RegisterDto = {
        username: 'testuser',
        password: 'password123',
        name: 'test',
        phone: '+821011111111',
        company: 'test',
      };
      authService.register = jest
        .fn()
        .mockRejectedValue(
          new BadRequestException('이미 사용 중인 아이디입니다.'),
        );

      await expect(authController.postRegister(dto)).rejects.toThrow(
        new BadRequestException('이미 사용 중인 아이디입니다.'),
      );
    });
  });

  describe('postLogin', () => {
    it('should successfully log in a user', async () => {
      const dto: LoginDto = { username: 'testuser', password: 'password123' };
      const response = {
        success: true,
        message: '로그인 되었습니다',
        data: { accessToken: 'accessToken' },
        user: { id: 1, username: 'testuser' },
      };

      authService.login = jest.fn().mockResolvedValue(response);

      const result = await authController.postLogin(dto);
      expect(result).toEqual(response);
      expect(authService.login).toHaveBeenCalledWith(dto);
    });

    it('should throw BadRequestException if login fails due to incorrect password', async () => {
      const dto: LoginDto = { username: 'testuser', password: 'wrongPassword' };
      authService.login = jest
        .fn()
        .mockRejectedValue(new BadRequestException('비밀번호가 틀렸습니다.'));

      await expect(authController.postLogin(dto)).rejects.toThrow(
        new BadRequestException('비밀번호가 틀렸습니다.'),
      );
    });

    it('should throw NotFoundException if the user does not exist', async () => {
      const dto: LoginDto = {
        username: 'nonexistent',
        password: 'password123',
      };
      authService.login = jest
        .fn()
        .mockRejectedValue(new NotFoundException('가입되지 않은 계정입니다.'));

      await expect(authController.postLogin(dto)).rejects.toThrow(
        new NotFoundException('가입되지 않은 계정입니다.'),
      );
    });
  });
});
