import { Component, computed, input, type InputSignal } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { FormControl, FormsModule } from "@angular/forms";
import { startWith, switchMap } from "rxjs";
import { format, parse } from "date-fns";
import { DatePicker as PrimeDatePicker } from "primeng/datepicker";
import { LucideDynamicIcon } from "@lucide/angular";
import { ClockIcon } from "../../icons";
import { FieldErrorComponent } from "../../field-error/field-error";

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
  selector: "time-picker",
  imports: [FormsModule, PrimeDatePicker, LucideDynamicIcon, FieldErrorComponent],
  templateUrl: "./time-picker.html",
  styleUrl: "./time-picker.scss",
})
export class TimePicker {
  protected readonly icons = {
    ClockIcon,
  };

  readonly control: InputSignal<FormControl<string | null>> = input.required<FormControl<string | null>>();
  readonly placeholder = input<string>("Select a time");
  readonly hint: InputSignal<string | null> = input<string | null>(null);
  readonly errorMessages = input<Record<string, string>>({});
  readonly container: InputSignal<string | HTMLElement | null> = input<string | HTMLElement | null>("body");

  private readonly controlValue = toSignal(
    toObservable(this.control).pipe(switchMap((c) => c.valueChanges.pipe(startWith(c.value)))),
  );

  protected readonly displayValue = computed(() => toDisplayTime(this.controlValue() ?? null));

  protected onDisplayChange(displayValue: string | null) {
    const c = this.control();
    c.setValue(toValueTime(displayValue));
    c.markAsDirty();
  }
}
