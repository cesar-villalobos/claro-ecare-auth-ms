import { Module } from '@nestjs/common';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';
import { RedisService } from '../config/redis.service';

@Module({
  controllers: [OtpController],
  providers: [OtpService, RedisService],
  exports: [OtpService],
})
export class OtpModule {}
