import { Component, computed, input, type InputSignal, output, signal, ViewEncapsulation } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { of, startWith, switchMap } from "rxjs";
import { FormControl } from "@angular/forms";
import { LucideDynamicIcon } from "@lucide/angular";
import { CheckIcon, ChevronDownIcon, XIcon } from "../../icons";
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
    LucideDynamicIcon,
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
    CheckIcon,
  };

  readonly items = input.required<T[]>();
  readonly multi = input(false);
  readonly displayFn = input.required<(item: T) => string>();
  readonly triggerDisplayFn: InputSignal<((item: T) => string) | null> = input<((item: T) => string) | null>(null);
  readonly valueFn = input<(item: T) => unknown>((item) => item);
  readonly value: InputSignal<T | T[] | null> = input<T | T[] | null>(null);
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
  readonly multiSelectionChange = output<T[]>();
  readonly cleared = output<void>();

  protected readonly selectedItems = signal<T[]>([]);
  protected readonly searchTerm = signal("");

  private readonly controlValue = toSignal(
    toObservable(this.control).pipe(
      switchMap((ctrl) => (ctrl ? ctrl.valueChanges.pipe(startWith(ctrl.value)) : of(null))),
    ),
    { initialValue: null },
  );

  private readonly itemsFromControl = computed<T[]>(() => {
    const formValue = this.controlValue();
    if (formValue == null || formValue === "") return [];
    const valueFn = this.valueFn();
    const formValues = Array.isArray(formValue) ? formValue : [formValue];
    return this.items().filter((item) => formValues.some((v) => Object.is(valueFn(item), v)));
  });

  private readonly valueItems = computed<T[]>(() => {
    const value = this.value();
    if (value == null) return [];
    return Array.isArray(value) ? value : [value];
  });

  private readonly currentItems = computed<T[]>(() => {
    if (this.value() != null) return this.valueItems();
    if (this.control()) return this.itemsFromControl();
    return this.selectedItems();
  });

  protected readonly triggerLabel = computed<{ text: string; extra: number } | null>(() => {
    const items = this.currentItems();
    if (!items.length) return null;
    const display = this.triggerDisplayFn() ?? this.displayFn();
    return { text: display(items[0]), extra: this.multi() ? items.length - 1 : 0 };
  });

  protected readonly currentValue = computed<T | T[] | null>(() => {
    const items = this.currentItems();
    if (this.multi()) return items;
    return items[0] ?? null;
  });

  protected readonly filteredItems = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.items();
    const displayFn = this.displayFn();
    return this.items().filter((item) => displayFn(item).toLowerCase().includes(term));
  });

  protected onOpenChange(open: boolean) {
    if (open) {
      this.searchTerm.set("");
    } else {
      this.control()?.markAsTouched();
    }
  }

  protected onTriggerBlur(event: FocusEvent) {
    const next = event.relatedTarget as HTMLElement | null;
    if (next?.closest(".cs-dropdown")) {
      return;
    }
    this.control()?.markAsTouched();
  }

  protected onValueChange(value: T | T[]) {
    let items: T[];
    if (Array.isArray(value)) {
      items = value;
    } else if (value == null) {
      items = [];
    } else {
      items = [value];
    }
    this.selectedItems.set(items);
    if (this.multi()) {
      this.multiSelectionChange.emit(items);
    } else if (items.length) {
      this.selectionChange.emit(items[0]);
    }
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
    this.selectedItems.set([]);
    this.control()?.markAsTouched();
    this.cleared.emit();
  }
}
