import { Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  NgpDatePicker,
  NgpDatePickerCell,
  NgpDatePickerCellRender,
  NgpDatePickerDateButton,
  NgpDatePickerGrid,
  NgpDatePickerLabel,
  NgpDatePickerNextMonth,
  NgpDatePickerPreviousMonth,
  NgpDatePickerRowRender,
} from 'ng-primitives/date-picker';
import { NgpNativeDateAdapter, provideDateAdapter } from 'ng-primitives/date-time';
import { NgpButton } from 'ng-primitives/button';
import { NgpPopover, NgpPopoverTrigger } from 'ng-primitives/popover';
import { LucideAngularModule, ChevronLeft, ChevronRight, Calendar } from 'lucide-angular';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

@Component({
  selector: 'date-picker',
  imports: [
    NgpDatePicker,
    NgpDatePickerCell,
    NgpDatePickerCellRender,
    NgpDatePickerDateButton,
    NgpDatePickerGrid,
    NgpDatePickerLabel,
    NgpDatePickerNextMonth,
    NgpDatePickerPreviousMonth,
    NgpDatePickerRowRender,
    NgpButton,
    NgpPopover,
    NgpPopoverTrigger,
    LucideAngularModule,
  ],
  providers: [
    provideDateAdapter(NgpNativeDateAdapter),
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePicker),
      multi: true,
    },
  ],
  templateUrl: './date-picker.html',
  styleUrl: './date-picker.scss',
})
export class DatePicker implements ControlValueAccessor {
  readonly placeholder = input<string>('Select a date');
  readonly min = input<Date | undefined>(undefined);
  readonly max = input<Date | undefined>(undefined);
  readonly disabled = input<boolean>(false);
  readonly container = input<string | HTMLElement | null>(null);
  readonly size = input<'sm' | 'md'>('md');

  protected readonly value = signal<Date | undefined>(undefined);
  protected readonly isDisabled = signal(false);

  protected readonly ChevronLeftIcon = ChevronLeft;
  protected readonly ChevronRightIcon = ChevronRight;
  protected readonly CalendarIcon = Calendar;
  protected readonly weekdays = WEEKDAY_LABELS;

  protected readonly formatted = computed(() => {
    const date = this.value();
    if (!date) return '';
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  });

  private onChange: (value: Date | undefined) => void = () => {};
  private onTouched: () => void = () => {};

  protected onDateChange(date: Date | undefined) {
    this.value.set(date);
    this.onChange(date);
    this.onTouched();
  }

  writeValue(value: Date | string | null | undefined): void {
    if (value == null || value === '') {
      this.value.set(undefined);
      return;
    }
    this.value.set(value instanceof Date ? value : new Date(value));
  }

  registerOnChange(fn: (value: Date | undefined) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
