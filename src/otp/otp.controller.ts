import { Controller, Post, Body, Get, Query, BadRequestException } from '@nestjs/common';
import { OtpService } from './otp.service';
import { GenerateOtpDto } from './dto/generate-otp.dto';
import { ValidateOtpDto } from './dto/validate-otp.dto';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('generate')
  async generateOtp(@Body() generateOtpDto: GenerateOtpDto) {
    return await this.otpService.generateOtp(generateOtpDto.phoneNumber);
  }

  @Post('validate')
  async validateOtp(@Body() validateOtpDto: ValidateOtpDto) {
    return await this.otpService.validateOtp(
      validateOtpDto.phoneNumber,
      validateOtpDto.otp,
    );
  }

  @Get('status')
  async getOtpStatus(@Query('phoneNumber') phoneNumber: string) {
    if (!phoneNumber) {
      throw new BadRequestException('Phone number is required');
    }
    return await this.otpService.getOtpStatus(phoneNumber);
  }
}
