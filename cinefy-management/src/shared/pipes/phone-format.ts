import { Pipe, PipeTransform } from '@angular/core';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

@Pipe({ name: 'phoneFormat' })
export class PhoneFormatPipe implements PipeTransform {
  transform(value: string | null | undefined, fallback = '—'): string {
    if (!value) return fallback;
    const parsed = parsePhoneNumberFromString(`+${value}`);
    return parsed?.formatInternational() ?? `+${value}`;
  }
}
