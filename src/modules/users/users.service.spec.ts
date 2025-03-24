import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  // PrismaService를 mock하기 위한 객체
  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    // TestingModule을 생성하고 mockPrismaService를 주입합니다.
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkUsernameAvailability', () => {
    it('should return true if the username is available', async () => {
      // mockPrismaService.user.findFirst가 null을 반환하도록 설정
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      const result =
        await service.checkUsernameAvailability('availableUsername');
      expect(result).toBe(true); // username이 없으면 true
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { username: 'availableUsername' },
      });
    });

    it('should return false if the username is taken', async () => {
      // mockPrismaService.user.findFirst가 사용자 정보를 반환하도록 설정
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 1,
        username: 'takenUsername',
      });

      const result = await service.checkUsernameAvailability('takenUsername');
      expect(result).toBe(false); // username이 있으면 false
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { username: 'takenUsername' },
      });
    });
  });

  describe('findUserByUsername', () => {
    it('should return user if found', async () => {
      const mockUser = { id: 1, username: 'foundUsername' };
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.findUser({ username: 'foundUsername' });
      expect(result).toEqual(mockUser); // 해당 유저가 반환되어야 함
    });

    it('should return null if user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      const result = await service.findUser({
        username: 'nonExistingUsername',
      });
      expect(result).toBeNull(); // 유저가 없으면 null 반환
    });
  });

  describe('findUserByUserId', () => {
    it('should return user if found by userId', async () => {
      const mockUser = { id: 1, username: 'foundById' };
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.findUser({ id: 1 });
      expect(result).toEqual(mockUser); // 해당 유저가 반환되어야 함
    });

    it('should return null if user not found by userId', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      const result = await service.findUser({ id: 999 });
      expect(result).toBeNull(); // 유저가 없으면 null 반환
    });
  });
});
