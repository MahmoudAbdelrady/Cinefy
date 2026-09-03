import { Component, input, type InputSignal } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { DatePicker as PrimeDatePicker } from "primeng/datepicker";
import { LucideDynamicIcon } from "@lucide/angular";
import { CalendarIcon } from "../../icons";
import { FieldErrorComponent } from "../../field-error/field-error";

@Component({
  selector: "date-picker",
  imports: [ReactiveFormsModule, PrimeDatePicker, LucideDynamicIcon, FieldErrorComponent],
  templateUrl: "./date-picker.html",
  styleUrl: "./date-picker.scss",
})
export class DatePicker {
  protected readonly icons = {
    CalendarIcon,
  };

  readonly control: InputSignal<FormControl<Date | null>> = input.required<FormControl<Date | null>>();
  readonly placeholder = input<string>("Select a date");
  readonly hint: InputSignal<string | null> = input<string | null>(null);
  readonly min = input<Date | undefined>(undefined);
  readonly max = input<Date | undefined>(undefined);
  readonly errorMessages = input<Record<string, string>>({});
  readonly container: InputSignal<string | HTMLElement | null> = input<string | HTMLElement | null>("body");
}
