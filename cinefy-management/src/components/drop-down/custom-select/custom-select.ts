import { Component, computed, input, output, signal, ViewEncapsulation } from '@angular/core';
import { LucideAngularModule, ChevronDown, X } from 'lucide-angular';
import {
  NgpSelect,
  NgpSelectDropdown,
  NgpSelectOption,
  NgpSelectPortal,
} from 'ng-primitives/select';

@Component({
  selector: 'custom-select',
  imports: [LucideAngularModule, NgpSelect, NgpSelectDropdown, NgpSelectOption, NgpSelectPortal],
  templateUrl: './custom-select.html',
  styleUrl: './custom-select.scss',
  encapsulation: ViewEncapsulation.None,
})
export class CustomSelectComponent<T> {
  readonly items = input.required<T[]>();
  readonly displayFn = input.required<(item: T) => string>();
  readonly trackBy = input.required<(item: T) => unknown>();
  readonly value = input<T | null>(null);
  readonly placeholder = input('Select an option');
  readonly disabled = input(false);
  readonly clearable = input(false);
  readonly compareWith = input<(a: T, b: T) => boolean>(Object.is);

  readonly valueChange = output<T>();
  readonly cleared = output<void>();

  protected readonly ChevronDownIcon = ChevronDown;
  protected readonly XIcon = X;

  protected readonly selectedItem = signal<T | null>(null);
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

  protected onValueChange(value: T) {
    this.wasCleared.set(false);
    this.selectedItem.set(value);
    this.valueChange.emit(value);
  }

  protected clear(event: MouseEvent) {
    event.stopPropagation();
    this.wasCleared.set(true);
    this.selectedItem.set(null);
    this.cleared.emit();
  }
}
