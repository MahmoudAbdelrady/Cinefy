import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'time12h' })
export class Time12hPipe implements PipeTransform {
  transform(value: string | null | undefined, fallback = '—'): string {
    if (!value) return fallback;

    const [hStr, mStr] = value.split(':');
    const h = Number(hStr);
    const m = Number(mStr);
    if (isNaN(h) || isNaN(m)) return fallback;

    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  }
}
