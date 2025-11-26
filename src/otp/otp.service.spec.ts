import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { OtpService } from './otp.service';
import { RedisService } from '../config/redis.service';

describe('OtpService', () => {
  let service: OtpService;
  let redisService: RedisService;

  const mockRedisService = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    ttl: jest.fn(),
    exists: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        OTP_EXPIRATION_SECONDS: 300,
        OTP_REQUEST_COOLDOWN_SECONDS: 60,
      };
      return config[key] !== undefined ? config[key] : defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
    redisService = module.get<RedisService>(RedisService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateOtp', () => {
    it('should generate a new OTP for a valid Chilean phone number', async () => {
      const phoneNumber = '+56912345678';
      mockRedisService.exists.mockResolvedValue(0); // No cooldown
      mockRedisService.get.mockResolvedValue(null); // No existing OTP

      const result = await service.generateOtp(phoneNumber);

      expect(result).toHaveProperty('message');
      expect(result.message).toContain('generated successfully');
      expect(result.expiresIn).toBe(300);
      expect(mockRedisService.set).toHaveBeenCalledTimes(2); // OTP + cooldown
    });

    it('should resend existing OTP if one already exists', async () => {
      const phoneNumber = '912345678';
      const existingOtp = '123456';
      mockRedisService.exists.mockResolvedValue(0); // No cooldown
      mockRedisService.get.mockResolvedValue(existingOtp);

      const result = await service.generateOtp(phoneNumber);

      expect(result.message).toContain('resent successfully');
      expect(mockRedisService.set).toHaveBeenCalledWith(
        expect.stringContaining('otp:'),
        existingOtp,
        300,
      );
    });

    it('should throw BadRequestException if cooldown is active', async () => {
      const phoneNumber = '+56912345678';
      mockRedisService.exists.mockResolvedValue(1); // Cooldown active
      mockRedisService.ttl.mockResolvedValue(45);

      await expect(service.generateOtp(phoneNumber)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.generateOtp(phoneNumber)).rejects.toThrow(
        'Please wait 45 seconds',
      );
    });

    it('should normalize phone numbers correctly', async () => {
      const phoneNumbers = ['+56912345678', '56912345678', '912345678'];
      mockRedisService.exists.mockResolvedValue(0);
      mockRedisService.get.mockResolvedValue(null);

      for (const phone of phoneNumbers) {
        await service.generateOtp(phone);
        // All should result in the same normalized key
        expect(mockRedisService.set).toHaveBeenCalledWith(
          'otp:56912345678',
          expect.any(String),
          300,
        );
        jest.clearAllMocks();
        mockRedisService.exists.mockResolvedValue(0);
        mockRedisService.get.mockResolvedValue(null);
      }
    });
  });

  describe('validateOtp', () => {
    it('should validate a correct OTP', async () => {
      const phoneNumber = '+56912345678';
      const otp = '123456';
      mockRedisService.get.mockResolvedValue(otp);
      mockRedisService.del.mockResolvedValue(1);

      const result = await service.validateOtp(phoneNumber, otp);

      expect(result.valid).toBe(true);
      expect(result.message).toBe('OTP validated successfully');
      expect(mockRedisService.del).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for incorrect OTP', async () => {
      const phoneNumber = '+56912345678';
      const otp = '123456';
      const wrongOtp = '654321';
      mockRedisService.get.mockResolvedValue(otp);

      await expect(service.validateOtp(phoneNumber, wrongOtp)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateOtp(phoneNumber, wrongOtp)).rejects.toThrow(
        'Invalid OTP',
      );
    });

    it('should throw UnauthorizedException if OTP does not exist', async () => {
      const phoneNumber = '+56912345678';
      const otp = '123456';
      mockRedisService.get.mockResolvedValue(null);

      await expect(service.validateOtp(phoneNumber, otp)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateOtp(phoneNumber, otp)).rejects.toThrow(
        'OTP has expired or does not exist',
      );
    });
  });

  describe('getOtpStatus', () => {
    it('should return OTP status when OTP exists', async () => {
      const phoneNumber = '+56912345678';
      mockRedisService.ttl.mockResolvedValue(250);

      const result = await service.getOtpStatus(phoneNumber);

      expect(result.exists).toBe(true);
      expect(result.remainingSeconds).toBe(250);
    });

    it('should return exists false when OTP does not exist', async () => {
      const phoneNumber = '+56912345678';
      mockRedisService.ttl.mockResolvedValue(-2); // -2 means key doesn't exist

      const result = await service.getOtpStatus(phoneNumber);

      expect(result.exists).toBe(false);
      expect(result.remainingSeconds).toBeUndefined();
    });
  });
});
