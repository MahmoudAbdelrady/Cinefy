import { Component, computed, input, signal, type InputSignal } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { FormControl, FormsModule } from "@angular/forms";
import { startWith, switchMap } from "rxjs";
import { format, parse } from "date-fns";
import { DatePicker as PrimeDatePicker } from "primeng/datepicker";
import { LucideDynamicIcon } from "@lucide/angular";
import { ClockIcon } from "../../icons";
import { CinefyFieldError } from "../../field-error/cinefy-field-error";
import type { AppendTo as PrimeAppendTo } from "primeng/types/shared";
import { isInvalidAndTouched } from "../../field-error/control-state";

const DISPLAY_FORMAT = "hh:mm a";
const VALUE_FORMAT = "HH:mm";

function toDisplayTime(time: string | null): string | null {
  if (!time) return null;
  const parsed = parse(time, VALUE_FORMAT, new Date());
  return isNaN(parsed.getTime()) ? null : format(parsed, DISPLAY_FORMAT);
}

function toValueTime(displayValue: string | null): string | null {
  if (!displayValue) return null;
  const parsed = parse(displayValue, DISPLAY_FORMAT, new Date());
  return isNaN(parsed.getTime()) ? null : format(parsed, VALUE_FORMAT);
}

@Component({
  selector: "cui-time-picker",
  imports: [FormsModule, PrimeDatePicker, LucideDynamicIcon, CinefyFieldError],
  templateUrl: "./cinefy-time-picker.html",
  styleUrl: "./cinefy-time-picker.scss",
})
export class CinefyTimePicker {
  protected readonly icons = {
    ClockIcon,
  };

  readonly control: InputSignal<FormControl<string | null>> = input.required<FormControl<string | null>>();
  readonly placeholder = input<string>("Select a time");
  readonly hint: InputSignal<string | null> = input<string | null>(null);
  readonly errorMessages = input<Record<string, string>>({});
  readonly container: InputSignal<PrimeAppendTo> = input<PrimeAppendTo>("body");

  private readonly controlValue = toSignal(
    toObservable(this.control).pipe(switchMap((c) => c.valueChanges.pipe(startWith(c.value)))),
  );

  protected readonly displayValue = computed(() => toDisplayTime(this.controlValue() ?? null));

  protected readonly suppressError = signal(false);

  protected readonly hasErrorMessages = computed(() => Object.keys(this.errorMessages()).length > 0);

  private readonly isInvalid = isInvalidAndTouched(this.control);

  protected readonly showsError = computed(() => !this.suppressError() && this.isInvalid());

  protected onOverlayShow(): void {
    this.suppressError.set(this.control().untouched);
  }

  protected onOverlayClose(): void {
    this.suppressError.set(false);
  }

  protected onDisplayChange(displayValue: string | null) {
    const c = this.control();
    c.setValue(toValueTime(displayValue));
    c.markAsDirty();
  }
}
