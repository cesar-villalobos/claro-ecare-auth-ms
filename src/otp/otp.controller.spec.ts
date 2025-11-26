import { Test, TestingModule } from '@nestjs/testing';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';

describe('OtpController', () => {
  let controller: OtpController;
  let service: OtpService;

  const mockOtpService = {
    generateOtp: jest.fn(),
    validateOtp: jest.fn(),
    getOtpStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OtpController],
      providers: [
        {
          provide: OtpService,
          useValue: mockOtpService,
        },
      ],
    }).compile();

    controller = module.get<OtpController>(OtpController);
    service = module.get<OtpService>(OtpService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateOtp', () => {
    it('should call otpService.generateOtp with phone number', async () => {
      const dto = { phoneNumber: '+56912345678' };
      const expectedResult = {
        message: 'OTP generated successfully for +56912345678',
        expiresIn: 300,
      };
      mockOtpService.generateOtp.mockResolvedValue(expectedResult);

      const result = await controller.generateOtp(dto);

      expect(service.generateOtp).toHaveBeenCalledWith(dto.phoneNumber);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('validateOtp', () => {
    it('should call otpService.validateOtp with phone number and OTP', async () => {
      const dto = { phoneNumber: '+56912345678', otp: '123456' };
      const expectedResult = {
        valid: true,
        message: 'OTP validated successfully',
      };
      mockOtpService.validateOtp.mockResolvedValue(expectedResult);

      const result = await controller.validateOtp(dto);

      expect(service.validateOtp).toHaveBeenCalledWith(
        dto.phoneNumber,
        dto.otp,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getOtpStatus', () => {
    it('should call otpService.getOtpStatus with phone number', async () => {
      const phoneNumber = '+56912345678';
      const expectedResult = {
        exists: true,
        remainingSeconds: 250,
      };
      mockOtpService.getOtpStatus.mockResolvedValue(expectedResult);

      const result = await controller.getOtpStatus(phoneNumber);

      expect(service.getOtpStatus).toHaveBeenCalledWith(phoneNumber);
      expect(result).toEqual(expectedResult);
    });

    it('should throw BadRequestException if phone number is not provided', async () => {
      await expect(controller.getOtpStatus('')).rejects.toThrow('Phone number is required');
      expect(service.getOtpStatus).not.toHaveBeenCalled();
    });
  });
});
