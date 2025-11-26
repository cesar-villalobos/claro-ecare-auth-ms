import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../config/redis.service';

@Injectable()
export class OtpService {
  private readonly OTP_PREFIX = 'otp:';
  private readonly COOLDOWN_PREFIX = 'cooldown:';
  private readonly otpExpirationSeconds: number;
  private readonly requestCooldownSeconds: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.otpExpirationSeconds = this.configService.get<number>(
      'OTP_EXPIRATION_SECONDS',
      300,
    ); // 5 minutes default
    this.requestCooldownSeconds = this.configService.get<number>(
      'OTP_REQUEST_COOLDOWN_SECONDS',
      60,
    ); // 1 minute default
  }

  /**
   * Normalizes a Chilean phone number to a consistent format
   * Removes all non-digit characters and ensures it starts with country code
   */
  private normalizePhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters except leading +
    let cleaned = phoneNumber.replace(/[\s\-()]/g, '');
    
    // Remove + if present
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    
    // If it starts with 56 (Chile country code), keep it
    // If it starts with 9 (local mobile format), add 56
    if (cleaned.startsWith('9')) {
      cleaned = '56' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Generates a 6-digit OTP code
   */
  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generates and stores a new OTP for the given phone number
   * Enforces cooldown period between requests
   */
  async generateOtp(phoneNumber: string): Promise<{
    message: string;
    expiresIn: number;
    cooldownRemaining?: number;
  }> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    const cooldownKey = `${this.COOLDOWN_PREFIX}${normalizedPhone}`;
    const otpKey = `${this.OTP_PREFIX}${normalizedPhone}`;

    // Check if there's an active cooldown
    const cooldownExists = await this.redisService.exists(cooldownKey);
    if (cooldownExists) {
      const remainingCooldown = await this.redisService.ttl(cooldownKey);
      throw new BadRequestException(
        `Please wait ${remainingCooldown} seconds before requesting a new OTP`,
      );
    }

    // Check if there's an existing OTP
    const existingOtp = await this.redisService.get(otpKey);
    let otp: string;
    let isNewOtp = false;

    if (existingOtp) {
      // Keep the existing OTP if it's still valid
      otp = existingOtp;
    } else {
      // Generate a new OTP
      otp = this.generateOtpCode();
      isNewOtp = true;
    }

    // Store the OTP with expiration
    await this.redisService.set(otpKey, otp, this.otpExpirationSeconds);

    // Set cooldown to prevent rapid requests
    await this.redisService.set(
      cooldownKey,
      'locked',
      this.requestCooldownSeconds,
    );

    return {
      message: isNewOtp
        ? `OTP generated successfully for ${phoneNumber}`
        : `OTP resent successfully for ${phoneNumber}`,
      expiresIn: this.otpExpirationSeconds,
    };
  }

  /**
   * Validates an OTP for the given phone number
   */
  async validateOtp(
    phoneNumber: string,
    otp: string,
  ): Promise<{ valid: boolean; message: string }> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    const otpKey = `${this.OTP_PREFIX}${normalizedPhone}`;

    const storedOtp = await this.redisService.get(otpKey);

    if (!storedOtp) {
      throw new UnauthorizedException('OTP has expired or does not exist');
    }

    if (storedOtp !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // OTP is valid, remove it from Redis
    await this.redisService.del(otpKey);

    return {
      valid: true,
      message: 'OTP validated successfully',
    };
  }

  /**
   * Gets the remaining time for an OTP
   */
  async getOtpStatus(phoneNumber: string): Promise<{
    exists: boolean;
    remainingSeconds?: number;
  }> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    const otpKey = `${this.OTP_PREFIX}${normalizedPhone}`;

    const exists = await this.redisService.exists(otpKey);
    if (!exists) {
      return { exists: false };
    }

    const remainingSeconds = await this.redisService.ttl(otpKey);
    return {
      exists: true,
      remainingSeconds: remainingSeconds > 0 ? remainingSeconds : 0,
    };
  }
}
