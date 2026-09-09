import { afterNextRender, Component, computed, output, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { Popover } from 'primeng/popover';
import { CinefyDatePicker } from 'cinefy-ui/components';
import { addDays, addYears, format, isAfter, parseISO } from 'date-fns';
import { CalendarIcon } from '../../../shared/icons';
import type { DateRange } from '../../../shared/types';

interface PresetOption {
  value: number;
  label: string;
}

const DEFAULT_PRESET_DAYS = 7;

const ARROW_LEFT_VARIABLE = '--p-popover-arrow-left';

const ARROW_LEFT_OFFSET = 50;

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
  imports: [ReactiveFormsModule, LucideDynamicIcon, Popover, CinefyDatePicker],
  templateUrl: './date-range-selector.html',
  styleUrl: './date-range-selector.scss',
})
export class DateRangeSelectorComponent {
  protected readonly icons = {
    CalendarIcon,
  };

  private readonly customRangePopover = viewChild.required(Popover);

  protected readonly presetOptions = PRESET_OPTIONS;
  protected readonly today = new Date();

  readonly rangeChange = output<DateRange>();

  protected readonly preset = signal<ActiveSelection | null>(null);

  private emittedRange: DateRange | null = null;

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
    if (this.preset() === days) return;
    this.preset.set(days);
    this.emitRange(rangeForPreset(days));
  }

  protected toggleCustomRange(event: Event): void {
    this.customRangePopover().toggle(event);
  }

  // PrimeNG anchors the popover arrow left of the trigger; nudge it back under the button.
  protected onCustomRangeShow(): void {
    const panel = this.customRangePopover().container;
    if (!panel) return;

    const current = parseFloat(getComputedStyle(panel).getPropertyValue(ARROW_LEFT_VARIABLE));
    panel.style.setProperty(
      ARROW_LEFT_VARIABLE,
      `${(Number.isNaN(current) ? 0 : current) + ARROW_LEFT_OFFSET}px`,
    );
  }

  protected closeCustomRange(): void {
    this.customRangePopover().hide();
  }

  protected applyCustom(): void {
    const { from, to } = this.customForm.getRawValue();
    if (!from || !to) return;
    this.preset.set('custom');
    this.emitRange({ from: toIsoDate(from), to: toIsoDate(to) });
    this.closeCustomRange();
  }

  private emitRange(range: DateRange): void {
    const current = this.emittedRange;
    if (current && current.from === range.from && current.to === range.to) return;
    this.emittedRange = range;
    this.rangeChange.emit(range);
  }
}
