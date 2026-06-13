import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  type InputSignal,
  output,
  signal,
  ViewEncapsulation,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import { HttpErrorResponse } from "@angular/common/http";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { Observable, debounceTime, distinctUntilChanged, skip } from "rxjs";
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
import { LoadingSpinnerComponent } from "../../loading-spinner/loading-spinner";
import { FieldErrorComponent } from "../../field-error/field-error";
import { ToastService } from "cinefy-ui/services";
import type { PaginatedResponse } from "cinefy-ui/types";

@Component({
  selector: "async-select",
  imports: [
    NgpCombobox,
    NgpComboboxButton,
    NgpComboboxDropdown,
    NgpComboboxInput,
    NgpComboboxOption,
    NgpComboboxPortal,
    LucideDynamicIcon,
    LoadingSpinnerComponent,
    FieldErrorComponent,
  ],
  templateUrl: "./async-select.html",
  styleUrl: "./async-select.scss",
  encapsulation: ViewEncapsulation.None,
})
export class AsyncSelectComponent<T> {
  protected readonly icons = {
    ChevronDownIcon,
    XIcon,
    CheckIcon,
  };
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);

  private static readonly SEARCH_DEBOUNCE_MS = 300;

  readonly multi = input(false);
  readonly label: InputSignal<string | null> = input<string | null>(null);
  readonly hint: InputSignal<string | null> = input<string | null>(null);
  readonly required = input(false);
  readonly placeholder = input("Select an option");
  readonly disabled = input(false);
  readonly clearable = input(false);
  readonly searchable = input(false);
  readonly pageSize = input(20);
  readonly container: InputSignal<string | HTMLElement | null> = input<string | HTMLElement | null>(null);
  readonly initialValue: InputSignal<T | T[] | null> = input<T | T[] | null>(null);
  readonly control: InputSignal<FormControl | null> = input<FormControl | null>(null);
  readonly errorMessages = input<Record<string, string>>({});
  readonly fetchFn =
    input.required<(page: number, size: number, search?: string) => Observable<PaginatedResponse<T> | T[]>>();
  readonly displayFn = input.required<(item: T) => string>();
  readonly valueFn = input.required<(item: T) => string>();

  readonly selectionChange = output<T>();
  readonly multiSelectionChange = output<T[]>();
  readonly cleared = output<void>();

  protected readonly items = signal<T[]>([]);
  protected readonly loading = signal(false);
  protected readonly selectedItems = signal<T[]>([]);
  protected readonly searchTerm = signal("");

  protected readonly triggerLabel = computed<{ text: string; extra: number } | null>(() => {
    const items = this.selectedItems();
    if (!items.length) return null;
    const displayFn = this.displayFn();
    return { text: displayFn(items[0]), extra: this.multi() ? items.length - 1 : 0 };
  });

  protected readonly comboboxValue = computed<T | T[] | null>(() => {
    const items = this.selectedItems();
    if (this.multi()) return items;
    return items[0] ?? null;
  });

  private currentPage = 0;
  private totalPages = 1;
  private isFlat = false;
  private loadedOnce = false;
  private readonly searchInput = signal("");

  protected readonly visibleItems = computed(() => {
    if (!this.isFlat) return this.items();
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.items();
    const displayFn = this.displayFn();
    return this.items().filter((item) => displayFn(item).toLowerCase().includes(term));
  });

  constructor() {
    toObservable(this.searchInput)
      .pipe(
        skip(1),
        debounceTime(AsyncSelectComponent.SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((term) => {
        this.searchTerm.set(term);
        this.resetAndFetch();
      });

    effect(() => {
      const initial = this.initialValue();
      if (initial == null) return;
      this.selectedItems.set(Array.isArray(initial) ? initial : [initial]);
    });
  }

  protected onOpenChange(open: boolean) {
    if (open) {
      this.searchTerm.set("");
      if (!this.isFlat || !this.loadedOnce) {
        this.resetAndFetch();
      }
    } else {
      this.control()?.markAsTouched();
    }
  }

  protected onTriggerBlur(event: FocusEvent) {
    const next = event.relatedTarget as HTMLElement | null;
    if (next?.closest(".as-dropdown")) {
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
    const value = (event.target as HTMLInputElement).value;
    if (this.isFlat) {
      this.searchTerm.set(value);
    } else {
      this.searchInput.set(value);
    }
  }

  protected clear(event: MouseEvent) {
    event.stopPropagation();
    this.selectedItems.set([]);
    this.cleared.emit();
  }

  protected onScroll(event: Event) {
    if (this.isFlat) return;
    const el = event.target as HTMLElement;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 32;
    if (nearBottom && !this.loading() && this.currentPage + 1 < this.totalPages) {
      this.fetchPage(this.currentPage + 1);
    }
  }

  protected onOptionsAreaMousedown(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      event.preventDefault();
    }
  }

  private resetAndFetch() {
    this.items.set([]);
    this.currentPage = 0;
    this.totalPages = 1;
    this.fetchPage(0);
  }

  private fetchPage(page: number) {
    if (this.loading() || page >= this.totalPages) return;

    this.loading.set(true);
    this.fetchFn()(page, this.pageSize(), this.searchTerm())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (Array.isArray(response)) {
            this.isFlat = true;
            this.items.set(response);
          } else {
            this.items.update((prev) => [...prev, ...response.content]);
            this.currentPage = response.page.number;
            this.totalPages = response.page.totalPages;
          }
          this.loadedOnce = true;
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.toastService.error(err.error?.message ?? "Failed to load items");
        },
      });
  }
}
