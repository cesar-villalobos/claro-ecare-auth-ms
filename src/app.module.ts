import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OtpModule } from './otp/otp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    OtpModule,
  ],
})
export class AppModule {}
