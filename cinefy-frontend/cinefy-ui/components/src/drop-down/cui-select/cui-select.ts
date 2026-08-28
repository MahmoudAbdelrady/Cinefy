import { Component, computed, input, type InputSignal } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { startWith, switchMap } from "rxjs";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { Select } from "primeng/select";
import { MultiSelect } from "primeng/multiselect";
import { FieldErrorComponent } from "../../field-error/field-error";

@Component({
  selector: "cui-select",
  imports: [ReactiveFormsModule, Select, MultiSelect, FieldErrorComponent],
  templateUrl: "./cui-select.html",
  styleUrl: "./cui-select.scss",
})
export class CuiSelect<T> {
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
  readonly container: InputSignal<string | HTMLElement | null> = input<string | HTMLElement | null>(null);

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
}
