import { IsNotEmpty, IsString } from 'class-validator';
import { IsChileanPhoneNumber } from '../../common/validators/chilean-phone.validator';

export class GenerateOtpDto {
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString({ message: 'Phone number must be a string' })
  @IsChileanPhoneNumber()
  phoneNumber!: string;
}
