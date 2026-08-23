import { afterNextRender, Component, computed, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { NgpPopover, NgpPopoverTrigger } from 'ng-primitives/popover';
import { DatePicker } from 'cinefy-ui/components';
import { addDays, addYears, format, isAfter, parseISO } from 'date-fns';
import { CalendarIcon } from '../../../shared/icons';
import type { DateRange } from '../../../shared/types';

interface PresetOption {
  value: number;
  label: string;
}

const DEFAULT_PRESET_DAYS = 7;

const PRESET_OPTIONS: PresetOption[] = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
];

type ActiveSelection = number | 'custom';

function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function rangeForPreset(days: number): DateRange {
  const today = new Date();
  return {
    from: toIsoDate(addDays(today, -(days - 1))),
    to: toIsoDate(today),
  };
}

function exceedsOneYear(range: DateRange): boolean {
  return isAfter(parseISO(range.to), addYears(parseISO(range.from), 1));
}

@Component({
  selector: 'date-range-selector',
  imports: [ReactiveFormsModule, LucideDynamicIcon, NgpPopover, NgpPopoverTrigger, DatePicker],
  templateUrl: './date-range-selector.html',
  styleUrl: './date-range-selector.scss',
})
export class DateRangeSelectorComponent {
  protected readonly icons = {
    CalendarIcon,
  };

  protected readonly presetOptions = PRESET_OPTIONS;
  protected readonly today = new Date();

  readonly rangeChange = output<DateRange>();

  protected readonly preset = signal<ActiveSelection | null>(null);

  protected readonly customForm = new FormGroup({
    from: new FormControl<Date | null>(null),
    to: new FormControl<Date | null>(null),
  });

  private readonly formValue = toSignal(this.customForm.valueChanges, {
    initialValue: this.customForm.value,
  });

  protected readonly customError = computed(() => {
    const { from, to } = this.formValue();
    if (!from || !to) return null;
    if (toIsoDate(from) > toIsoDate(to)) {
      return 'The start date must be before the end date.';
    }
    if (exceedsOneYear({ from: toIsoDate(from), to: toIsoDate(to) })) {
      return 'The range must be one year or less.';
    }
    return null;
  });

  protected readonly canApply = computed(() => {
    const { from, to } = this.formValue();
    return !!from && !!to && !this.customError();
  });

  constructor() {
    afterNextRender(() => {
      this.selectPreset(DEFAULT_PRESET_DAYS);
    });
  }

  protected selectPreset(days: number): void {
    this.preset.set(days);
    this.rangeChange.emit(rangeForPreset(days));
  }

  protected applyCustom(): void {
    const { from, to } = this.customForm.getRawValue();
    if (!from || !to) return;
    this.preset.set('custom');
    this.rangeChange.emit({ from: toIsoDate(from), to: toIsoDate(to) });
  }
}
