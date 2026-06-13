import { Component, computed, input, linkedSignal, type InputSignal } from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { startWith, switchMap } from "rxjs";
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
} from "ng-primitives/date-picker";
import { NgpNativeDateAdapter, provideDateAdapter } from "ng-primitives/date-time";
import { NgpButton } from "ng-primitives/button";
import { NgpPopover, NgpPopoverTrigger } from "ng-primitives/popover";
import { LucideDynamicIcon } from "@lucide/angular";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "../../icons";
import { FieldErrorComponent } from "../../field-error/field-error";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

@Component({
  selector: "date-picker",
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
    LucideDynamicIcon,
    FieldErrorComponent,
  ],
  providers: [provideDateAdapter(NgpNativeDateAdapter)],
  templateUrl: "./date-picker.html",
  styleUrl: "./date-picker.scss",
})
export class DatePicker {
  protected readonly icons = {
    CalendarIcon,
    ChevronRightIcon,
    ChevronLeftIcon,
  };

  protected readonly weekdays = WEEKDAY_LABELS;
  protected readonly today = new Date();

  readonly control: InputSignal<FormControl<Date | null>> = input.required<FormControl<Date | null>>();
  readonly placeholder = input<string>("Select a date");
  readonly hint: InputSignal<string | null> = input<string | null>(null);
  readonly min = input<Date | undefined>(undefined);
  readonly max = input<Date | undefined>(undefined);
  readonly errorMessages = input<Record<string, string>>({});
  readonly container: InputSignal<string | HTMLElement | null> = input<string | HTMLElement | null>(null);

  private readonly controlValue = toSignal(
    toObservable(this.control).pipe(switchMap((c) => c.valueChanges.pipe(startWith(c.value)))),
  );

  protected readonly value = computed(() => this.controlValue() ?? undefined);

  protected readonly formatted = computed(() => {
    const date = this.value();
    if (!date) return "";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  });

  protected readonly focusedDate = linkedSignal(() => this.value() ?? this.today);

  protected readonly monthLabel = computed(() =>
    this.focusedDate().toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
    }),
  );

  protected get required(): boolean {
    const c = this.control();
    return c.hasValidator(Validators.required) && c.enabled;
  }

  protected onFocusedDateChange(date: Date) {
    this.focusedDate.set(date);
  }

  protected onDateChange(date: Date | undefined) {
    const c = this.control();
    c.setValue(date ?? null);
    c.markAsDirty();
    c.markAsTouched();
  }

  protected onOpenChange(open: boolean) {
    if (!open) {
      this.control().markAsTouched();
    }
  }
}
