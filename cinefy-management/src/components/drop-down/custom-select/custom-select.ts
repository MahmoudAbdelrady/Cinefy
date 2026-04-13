import { Component, computed, input, output, signal, ViewEncapsulation } from '@angular/core';
import { LucideAngularModule, ChevronDown, X } from 'lucide-angular';
import {
  NgpCombobox,
  NgpComboboxButton,
  NgpComboboxDropdown,
  NgpComboboxInput,
  NgpComboboxOption,
  NgpComboboxPortal,
} from 'ng-primitives/combobox';

@Component({
  selector: 'custom-select',
  imports: [
    LucideAngularModule,
    NgpCombobox,
    NgpComboboxButton,
    NgpComboboxDropdown,
    NgpComboboxInput,
    NgpComboboxOption,
    NgpComboboxPortal,
  ],
  templateUrl: './custom-select.html',
  styleUrl: './custom-select.scss',
  encapsulation: ViewEncapsulation.None,
})
export class CustomSelectComponent<T> {
  readonly items = input.required<T[]>();
  readonly displayFn = input.required<(item: T) => string>();
  readonly valueFn = input.required<(item: T) => unknown>();
  readonly value = input<T | null>(null);
  readonly placeholder = input('Select an option');
  readonly disabled = input(false);
  readonly clearable = input(false);
  readonly searchable = input(false);
  readonly isError = input(false);
  readonly compareWith = input<(a: T, b: T) => boolean>(Object.is);
  readonly container = input<string | HTMLElement | null>(null);

  readonly selectionChange = output<T>();
  readonly cleared = output<void>();
  readonly touched = output<void>();

  protected readonly ChevronDownIcon = ChevronDown;
  protected readonly XIcon = X;

  protected readonly selectedItem = signal<T | null>(null);
  protected readonly searchTerm = signal('');
  private readonly wasCleared = signal(false);

  protected readonly displayValue = computed(() => {
    if (this.wasCleared()) return null;
    const item = this.value() ?? this.selectedItem();
    return item ? this.displayFn()(item) : null;
  });

  protected readonly currentValue = computed<T | null>(() => {
    if (this.wasCleared()) return null;
    return this.value() ?? this.selectedItem();
  });

  protected readonly filteredItems = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.items();
    const displayFn = this.displayFn();
    return this.items().filter((item) => displayFn(item).toLowerCase().includes(term));
  });

  protected onOpenChange(open: boolean) {
    if (!open) {
      this.searchTerm.set('');
      this.touched.emit();
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

  protected clear(event: MouseEvent) {
    event.stopPropagation();
    this.wasCleared.set(true);
    this.selectedItem.set(null);
    this.cleared.emit();
  }
}
