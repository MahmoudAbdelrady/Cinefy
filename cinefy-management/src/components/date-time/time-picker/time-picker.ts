import { Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgpButton } from 'ng-primitives/button';
import {
  NgpNumberField,
  NgpNumberFieldDecrement,
  NgpNumberFieldIncrement,
  NgpNumberFieldInput,
} from 'ng-primitives/number-field';
import { NgpPopover, NgpPopoverTrigger } from 'ng-primitives/popover';
import { ChevronDown, ChevronUp, Clock, LucideAngularModule } from 'lucide-angular';

type Period = 'AM' | 'PM';

const pad = (n: number) => n.toString().padStart(2, '0');

@Component({
  selector: 'time-picker',
  imports: [
    NgpButton,
    NgpPopover,
    NgpPopoverTrigger,
    NgpNumberField,
    NgpNumberFieldInput,
    NgpNumberFieldIncrement,
    NgpNumberFieldDecrement,
    LucideAngularModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimePicker),
      multi: true,
    },
  ],
  templateUrl: './time-picker.html',
  styleUrl: './time-picker.scss',
})
export class TimePicker implements ControlValueAccessor {
  readonly placeholder = input<string>('Select a time');
  readonly disabled = input<boolean>(false);
  readonly minuteStep = input<number>(1);
  readonly container = input<string | HTMLElement | null>(null);
  readonly size = input<'sm' | 'md'>('md');

  protected readonly hour24 = signal<number | null>(null);
  protected readonly minute = signal<number | null>(null);
  protected readonly isDisabled = signal(false);

  protected readonly ClockIcon = Clock;
  protected readonly ChevronUpIcon = ChevronUp;
  protected readonly ChevronDownIcon = ChevronDown;

  protected readonly hour12 = computed(() => {
    const h = this.hour24();
    if (h === null) return 12;
    const mod = h % 12;
    return mod === 0 ? 12 : mod;
  });

  protected readonly period = computed<Period>(() => ((this.hour24() ?? 0) < 12 ? 'AM' : 'PM'));

  protected readonly displayLabel = computed(() => {
    const h = this.hour24();
    const m = this.minute();
    if (h === null || m === null) return '';
    const h12 = this.hour12();
    return `${h12}:${pad(m)} ${this.period()}`;
  });

  private readonly formatted = computed(() => {
    const h = this.hour24();
    const m = this.minute();
    if (h === null || m === null) return null;
    return `${pad(h)}:${pad(m)}`;
  });

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  protected onHour12Change(value: number | null) {
    if (value === null) {
      this.hour24.set(null);
      this.emit();
      return;
    }
    const clamped = Math.max(1, Math.min(12, value));
    const period = this.period();
    const h24 = this.to24(clamped, period);
    this.hour24.set(h24);
    this.emit();
  }

  protected onMinuteChange(value: number | null) {
    if (value === null) {
      this.minute.set(null);
      this.emit();
      return;
    }
    this.minute.set(Math.max(0, Math.min(59, value)));
    this.emit();
  }

  protected setPeriod(next: Period) {
    if (next === this.period()) return;
    const h = this.hour24();
    if (h === null) {
      this.hour24.set(next === 'AM' ? 0 : 12);
    } else {
      this.hour24.set(next === 'AM' ? h - 12 : h + 12);
    }
    this.emit();
  }

  writeValue(value: string | null | undefined): void {
    if (!value) {
      this.hour24.set(null);
      this.minute.set(null);
      return;
    }
    const [hStr, mStr] = value.split(':');
    const h = Number(hStr);
    const m = Number(mStr);
    if (Number.isFinite(h) && Number.isFinite(m)) {
      this.hour24.set(Math.max(0, Math.min(23, h)));
      this.minute.set(Math.max(0, Math.min(59, m)));
    }
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  private emit() {
    this.onChange(this.formatted());
    this.onTouched();
  }

  private to24(h12: number, period: Period): number {
    if (period === 'AM') return h12 === 12 ? 0 : h12;
    return h12 === 12 ? 12 : h12 + 12;
  }
}
