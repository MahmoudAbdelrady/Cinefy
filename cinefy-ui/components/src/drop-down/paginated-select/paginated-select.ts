import {
  Component,
  DestroyRef,
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
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Observable, Subject, debounceTime, distinctUntilChanged } from "rxjs";
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
import { LoadingSpinnerComponent } from "../../loading-spinner/loading-spinner";
import { FieldErrorComponent } from "../../field-error/field-error";
import { ToastService } from "cinefy-ui/services";
import type { PaginatedResponse } from "cinefy-ui/types";

@Component({
  selector: "paginated-select",
  imports: [
    NgpCombobox,
    NgpComboboxButton,
    NgpComboboxDropdown,
    NgpComboboxInput,
    NgpComboboxOption,
    NgpComboboxPortal,
    LucideAngularModule,
    LoadingSpinnerComponent,
    FieldErrorComponent,
  ],
  templateUrl: "./paginated-select.html",
  styleUrl: "./paginated-select.scss",
  encapsulation: ViewEncapsulation.None,
})
export class PaginatedSelectComponent<T> {
  protected readonly icons = {
    ChevronDownIcon,
    XIcon,
  };
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);

  readonly label: InputSignal<string | null> = input<string | null>(null);
  readonly hint: InputSignal<string | null> = input<string | null>(null);
  readonly required = input(false);
  readonly placeholder = input("Select an option");
  readonly disabled = input(false);
  readonly clearable = input(false);
  readonly searchable = input(false);
  readonly pageSize = input(20);
  readonly container: InputSignal<string | HTMLElement | null> = input<string | HTMLElement | null>(null);
  readonly initialValue: InputSignal<T | null> = input<T | null>(null);
  readonly control: InputSignal<FormControl | null> = input<FormControl | null>(null);
  readonly errorMessages = input<Record<string, string>>({});
  readonly fetchFn =
    input.required<(page: number, size: number, search?: string) => Observable<PaginatedResponse<T>>>();
  readonly displayFn = input.required<(item: T) => string>();
  readonly valueFn = input.required<(item: T) => string>();

  readonly selectionChange = output<T>();
  readonly cleared = output<void>();

  protected readonly items = signal<T[]>([]);
  protected readonly loading = signal(false);
  protected readonly selectedItem = signal<T | null>(null);
  protected readonly searchTerm = signal("");

  private currentPage = 0;
  private totalPages = 1;
  private readonly search$ = new Subject<string>();

  constructor() {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((term) => {
        this.searchTerm.set(term);
        this.resetAndFetch();
      });

    effect(() => {
      const initial = this.initialValue();
      if (initial !== null) this.selectedItem.set(initial);
    });
  }

  protected onOpenChange(open: boolean) {
    if (open) {
      this.searchTerm.set("");
      this.resetAndFetch();
    } else {
      this.control()?.markAsTouched();
    }
  }

  protected onTriggerBlur(event: FocusEvent) {
    const next = event.relatedTarget as HTMLElement | null;
    if (next?.closest(".ps-dropdown")) {
      return;
    }
    this.control()?.markAsTouched();
  }

  protected onValueChange(value: T) {
    this.selectedItem.set(value);
    this.selectionChange.emit(value);
  }

  protected onSearchInput(event: Event) {
    this.search$.next((event.target as HTMLInputElement).value);
  }

  protected clear(event: MouseEvent) {
    event.stopPropagation();
    this.selectedItem.set(null);
    this.cleared.emit();
  }

  protected onScroll(event: Event) {
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
          this.items.update((prev) => [...prev, ...response.content]);
          this.currentPage = response.page.number;
          this.totalPages = response.page.totalPages;
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.toastService.error(err.error?.message ?? "Failed to load items");
        },
      });
  }
}
