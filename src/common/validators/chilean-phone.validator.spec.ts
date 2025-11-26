import { validate } from 'class-validator';
import { GenerateOtpDto } from '../../otp/dto/generate-otp.dto';

describe('Chilean Phone Number Validator', () => {
  it('should accept valid Chilean mobile numbers with country code and plus', async () => {
    const dto = new GenerateOtpDto();
    dto.phoneNumber = '+56912345678';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept valid Chilean mobile numbers with country code without plus', async () => {
    const dto = new GenerateOtpDto();
    dto.phoneNumber = '56912345678';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept valid Chilean mobile numbers in local format', async () => {
    const dto = new GenerateOtpDto();
    dto.phoneNumber = '912345678';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept Chilean mobile numbers with spaces', async () => {
    const dto = new GenerateOtpDto();
    dto.phoneNumber = '+56 9 1234 5678';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept Chilean mobile numbers with dashes', async () => {
    const dto = new GenerateOtpDto();
    dto.phoneNumber = '+56-9-1234-5678';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject invalid Chilean mobile numbers (wrong country code)', async () => {
    const dto = new GenerateOtpDto();
    dto.phoneNumber = '+1234567890';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject Chilean mobile numbers not starting with 9', async () => {
    const dto = new GenerateOtpDto();
    dto.phoneNumber = '+56812345678';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject Chilean mobile numbers with wrong length', async () => {
    const dto = new GenerateOtpDto();
    dto.phoneNumber = '+5691234567'; // Too short
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject empty phone number', async () => {
    const dto = new GenerateOtpDto();
    dto.phoneNumber = '';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject non-numeric characters (except valid formatting)', async () => {
    const dto = new GenerateOtpDto();
    dto.phoneNumber = '+56abc1234567';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
