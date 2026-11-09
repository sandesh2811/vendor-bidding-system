import { registerDecorator, type ValidationOptions } from 'class-validator';
import { BUSINESS_TIME_ZONE } from '../constants';

/* en-CA formats as YYYY-MM-DD, so it compares directly with ISO date strings */
const todayFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TIME_ZONE,
});

export const businessToday = (): string => todayFormat.format(new Date());

/* for YYYY-MM-DD strings (pair with @IsISO8601({ strict: true })): rejects dates before today in BUSINESS_TIME_ZONE */
export function IsNotPastDate(options?: ValidationOptions): PropertyDecorator {
  return (target, propertyName) =>
    registerDecorator({
      name: 'isNotPastDate',
      target: target.constructor,
      propertyName: String(propertyName),
      options: { message: '$property must not be in the past', ...options },
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && value >= businessToday(),
      },
    });
}

/* for YYYY-MM-DD strings (pair with @IsISO8601({ strict: true })): rejects dates after today in BUSINESS_TIME_ZONE */
export function IsNotFutureDate(
  options?: ValidationOptions,
): PropertyDecorator {
  return (target, propertyName) =>
    registerDecorator({
      name: 'isNotFutureDate',
      target: target.constructor,
      propertyName: String(propertyName),
      options: { message: '$property must not be in the future', ...options },
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && value <= businessToday(),
      },
    });
}
