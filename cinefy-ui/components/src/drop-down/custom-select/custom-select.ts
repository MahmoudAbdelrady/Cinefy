import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  type InputSignal,
  output,
  signal,
  ViewEncapsulation,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl } from "@angular/forms";
import { LucideAngularModule } from "lucide-angular";
import { ChevronDownIcon, XIcon } from "../../icons";
import {
  NgpCombobox,
  NgpComboboxButton,
  NgpComboboxDropdown,
  NgpComboboxInput,
  NgpComboboxOption,
  NgpComboboxPortal,
} from "ng-primitives/combobox";
import { FieldErrorComponent } from "../../field-error/field-error";

@Component({
  selector: "custom-select",
  imports: [
    LucideAngularModule,
    NgpCombobox,
    NgpComboboxButton,
    NgpComboboxDropdown,
    NgpComboboxInput,
    NgpComboboxOption,
    NgpComboboxPortal,
    FieldErrorComponent,
  ],
  templateUrl: "./custom-select.html",
  styleUrl: "./custom-select.scss",
  encapsulation: ViewEncapsulation.None,
})
export class CustomSelectComponent<T> {
  protected readonly icons = {
    ChevronDownIcon,
    XIcon,
  };

  private readonly destroyRef = inject(DestroyRef);

  readonly items = input.required<T[]>();
  readonly displayFn = input.required<(item: T) => string>();
  readonly triggerDisplayFn: InputSignal<((item: T) => string) | null> = input<((item: T) => string) | null>(null);
  readonly valueFn = input<(item: T) => unknown>((item) => item);
  readonly value: InputSignal<T | null> = input<T | null>(null);
  readonly label: InputSignal<string | null> = input<string | null>(null);
  readonly hint: InputSignal<string | null> = input<string | null>(null);
  readonly required = input(false);
  readonly placeholder = input("Select an option");
  readonly disabled = input(false);
  readonly clearable = input(false);
  readonly searchable = input(false);
  readonly isError = input(false);
  readonly control: InputSignal<FormControl | null> = input<FormControl | null>(null);
  readonly errorMessages = input<Record<string, string>>({});
  readonly compareWith = input<(a: T, b: T) => boolean>(Object.is);
  readonly container: InputSignal<string | HTMLElement | null> = input<string | HTMLElement | null>(null);
  readonly dropdownWidth = input<"matchTrigger" | "matchContent">("matchTrigger");

  readonly selectionChange = output<T>();
  readonly cleared = output<void>();

  protected readonly selectedItem = signal<T | null>(null);
  protected readonly searchTerm = signal("");
  private readonly wasCleared = signal(false);

  private readonly controlValue = signal<unknown>(null);

  private readonly itemFromControl = computed<T | null>(() => {
    if (!this.control()) return null;
    const formValue = this.controlValue();
    if (formValue == null || formValue === "") return null;
    const valueFn = this.valueFn();
    return this.items().find((item) => Object.is(valueFn(item), formValue)) ?? null;
  });

  protected readonly displayValue = computed(() => {
    if (this.wasCleared()) return null;
    const item = this.value() ?? this.selectedItem() ?? this.itemFromControl();
    if (!item) return null;
    const trigger = this.triggerDisplayFn();
    return (trigger ?? this.displayFn())(item);
  });

  protected readonly currentValue = computed<T | null>(() => {
    if (this.wasCleared()) return null;
    return this.value() ?? this.selectedItem() ?? this.itemFromControl();
  });

  protected readonly filteredItems = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.items();
    const displayFn = this.displayFn();
    return this.items().filter((item) => displayFn(item).toLowerCase().includes(term));
  });

  constructor() {
    effect((onCleanup) => {
      const ctrl = this.control();
      if (!ctrl) {
        this.controlValue.set(null);
        return;
      }
      this.controlValue.set(ctrl.value);
      const sub = ctrl.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((v) => this.controlValue.set(v));
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected onOpenChange(open: boolean) {
    if (open) {
      this.searchTerm.set("");
    } else {
      this.control()?.markAsTouched();
    }
  }

  protected onValueChange(value: T) {
    this.wasCleared.set(false);
    this.selectedItem.set(value);
    this.selectionChange.emit(value);
  }

  protected onSearchInput(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  protected onOptionsAreaMousedown(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      event.preventDefault();
    }
  }

  protected clear(event: MouseEvent) {
    event.stopPropagation();
    this.wasCleared.set(true);
    this.selectedItem.set(null);
    this.control()?.markAsTouched();
    this.cleared.emit();
  }
}
