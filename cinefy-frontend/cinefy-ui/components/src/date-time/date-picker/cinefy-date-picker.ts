import { Component, computed, input, signal, type InputSignal } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { DatePicker as PrimeDatePicker } from "primeng/datepicker";
import { LucideDynamicIcon } from "@lucide/angular";
import { CalendarIcon } from "../../icons";
import { CinefyFieldError } from "../../field-error/cinefy-field-error";
import type { AppendTo as PrimeAppendTo } from "primeng/types/shared";
import { isInvalidAndTouched } from "../../field-error/control-state";

@Component({
  selector: "cui-date-picker",
  imports: [ReactiveFormsModule, PrimeDatePicker, LucideDynamicIcon, CinefyFieldError],
  templateUrl: "./cinefy-date-picker.html",
  styleUrl: "./cinefy-date-picker.scss",
})
export class CinefyDatePicker {
  protected readonly icons = {
    CalendarIcon,
  };

  readonly control: InputSignal<FormControl<Date | null>> = input.required<FormControl<Date | null>>();
  readonly placeholder = input<string>("Select a date");
  readonly hint: InputSignal<string | null> = input<string | null>(null);
  readonly min = input<Date | undefined>(undefined);
  readonly max = input<Date | undefined>(undefined);
  readonly errorMessages = input<Record<string, string>>({});
  readonly container: InputSignal<PrimeAppendTo> = input<PrimeAppendTo>("body");

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
}
