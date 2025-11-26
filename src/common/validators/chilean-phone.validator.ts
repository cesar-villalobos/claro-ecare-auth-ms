import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isChileanPhoneNumber', async: false })
export class IsChileanPhoneNumberConstraint implements ValidatorConstraintInterface {
  validate(phoneNumber: string): boolean {
    if (!phoneNumber) {
      return false;
    }
    
    // Chilean mobile numbers format:
    // - With country code: +56 9 XXXX XXXX (can have spaces or not)
    // - Without country code: 9 XXXX XXXX (can have spaces or not)
    // - Should start with 9 after country code
    // - Total of 8 digits after the 9
    
    // Remove all non-digit characters except the leading +
    const cleanedNumber = phoneNumber.replace(/[\s\-()]/g, '');
    
    // Pattern 1: +569XXXXXXXX (11 digits with + and country code)
    const withCountryCode = /^\+569\d{8}$/;
    
    // Pattern 2: 569XXXXXXXX (11 digits without +)
    const withoutPlus = /^569\d{8}$/;
    
    // Pattern 3: 9XXXXXXXX (9 digits, local format)
    const localFormat = /^9\d{8}$/;
    
    return (
      withCountryCode.test(cleanedNumber) ||
      withoutPlus.test(cleanedNumber) ||
      localFormat.test(cleanedNumber)
    );
  }

  defaultMessage(): string {
    return 'Phone number must be a valid Chilean mobile number (e.g., +56912345678, 56912345678, or 912345678)';
  }
}

export function IsChileanPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsChileanPhoneNumberConstraint,
    });
  };
}
