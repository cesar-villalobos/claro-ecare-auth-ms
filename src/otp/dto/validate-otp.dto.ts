import { IsNotEmpty, IsString, Length } from 'class-validator';
import { IsChileanPhoneNumber } from '../../common/validators/chilean-phone.validator';

export class ValidateOtpDto {
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString({ message: 'Phone number must be a string' })
  @IsChileanPhoneNumber()
  phoneNumber!: string;

  @IsNotEmpty({ message: 'OTP is required' })
  @IsString({ message: 'OTP must be a string' })
  @Length(6, 6, { message: 'OTP must be 6 digits' })
  otp!: string;
}
