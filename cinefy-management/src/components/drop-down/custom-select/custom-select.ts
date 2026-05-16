import { Component, computed, input, output, signal, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { LucideAngularModule, ChevronDown, X } from 'lucide-angular';
import {
  NgpCombobox,
  NgpComboboxButton,
  NgpComboboxDropdown,
  NgpComboboxInput,
  NgpComboboxOption,
  NgpComboboxPortal,
} from 'ng-primitives/combobox';
import { FieldErrorComponent } from '../../field-error/field-error';

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
    FieldErrorComponent,
  ],
  templateUrl: './custom-select.html',
  styleUrl: './custom-select.scss',
  encapsulation: ViewEncapsulation.None,
})
export class CustomSelectComponent<T> {
  readonly items = input.required<T[]>();
  readonly displayFn = input.required<(item: T) => string>();
  readonly triggerDisplayFn = input<((item: T) => string) | null>(null);
  readonly valueFn = input<(item: T) => unknown>((item) => item);
  readonly value = input<T | null>(null);
  readonly label = input<string | null>(null);
  readonly required = input(false);
  readonly placeholder = input('Select an option');
  readonly disabled = input(false);
  readonly clearable = input(false);
  readonly searchable = input(false);
  readonly isError = input(false);
  readonly control = input<FormControl | null>(null);
  readonly errorMessages = input<Record<string, string>>({});
  readonly compareWith = input<(a: T, b: T) => boolean>(Object.is);
  readonly container = input<string | HTMLElement | null>(null);
  readonly size = input<'sm' | 'md'>('md');
  readonly dropdownWidth = input<'matchTrigger' | 'matchContent'>('matchTrigger');

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
    if (!item) return null;
    const trigger = this.triggerDisplayFn();
    return (trigger ?? this.displayFn())(item);
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
    if (open) {
      this.searchTerm.set('');
    } else {
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

  protected onOptionsAreaMousedown(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      event.preventDefault();
    }
  }

  protected clear(event: MouseEvent) {
    event.stopPropagation();
    this.wasCleared.set(true);
    this.selectedItem.set(null);
    this.cleared.emit();
  }
}
