import { Component, computed, input, type InputSignal } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { startWith, switchMap } from "rxjs";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { Select } from "primeng/select";
import { CinefyFieldError } from "../../field-error/cinefy-field-error";
import type { AppendTo as PrimeAppendTo } from "primeng/types/shared";

@Component({
  selector: "cui-select",
  imports: [ReactiveFormsModule, Select, CinefyFieldError],
  templateUrl: "./cinefy-select.html",
  styleUrl: "./cinefy-select.scss",
})
export class CinefySelect<T> {
  readonly control: InputSignal<FormControl> = input.required<FormControl>();
  readonly items = input.required<T[]>();
  readonly multi = input(false);
  readonly labelField = input.required<string>();
  readonly valueField = input.required<string>();
  readonly selectedItemLabel = input<string | undefined>(undefined);
  readonly label: InputSignal<string | null> = input<string | null>(null);
  readonly hint: InputSignal<string | null> = input<string | null>(null);
  readonly placeholder = input("Select an option");
  readonly clearable = input(false);
  readonly searchable = input(false);
  readonly required = input<boolean | undefined>(undefined);
  readonly errorMessages = input<Record<string, string>>({});
  readonly container: InputSignal<PrimeAppendTo> = input<PrimeAppendTo>("body");

  private readonly controlStatus = toSignal(
    toObservable(this.control).pipe(switchMap((c) => c.statusChanges.pipe(startWith(c.status)))),
  );

  protected readonly isRequired = computed(() => {
    const required = this.required();
    if (required !== undefined) return required;
    this.controlStatus();
    const c = this.control();
    return c.hasValidator(Validators.required) && c.enabled;
  });

  protected onMultiClear() {
    this.control().setValue([]);
  }

  protected onSelectAll() {
    const valueField = this.valueField();
    this.control().setValue(this.items().map((item) => (item as Record<string, unknown>)[valueField]));
  }
}
