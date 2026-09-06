import { Component, computed, input, signal, type InputSignal } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { startWith, switchMap, type Observable } from "rxjs";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { Select } from "primeng/select";
import { MultiSelect } from "primeng/multiselect";
import { FieldErrorComponent } from "../../field-error/field-error";
import { LoadingSpinnerComponent } from "../../loading-spinner/loading-spinner";
import type { PaginatedResponse } from "cinefy-ui/types";

const LOAD_MORE_OPTION = {
  label: "Load More",
  value: "__cui-load-more__",
};

@Component({
  selector: "cui-paginated-select",
  imports: [ReactiveFormsModule, Select, MultiSelect, FieldErrorComponent, LoadingSpinnerComponent],
  templateUrl: "./cinefy-paginated-select.html",
  styleUrl: "./cinefy-paginated-select.scss",
})
export class CinefyPaginatedSelect<T> {
  readonly control: InputSignal<FormControl> = input.required<FormControl>();
  readonly fetchFn = input.required<(page: number, size: number) => Observable<PaginatedResponse<T>>>();
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
  readonly container: InputSignal<string | HTMLElement | null> = input<string | HTMLElement | null>("body");
  readonly pageSize = input(20);

  protected readonly items = signal<T[]>([]);
  protected readonly loading = signal(false);

  private readonly page = signal(0);
  private readonly totalPages = signal(0);

  protected readonly hasMore = computed(() => this.page() < this.totalPages());

  protected readonly options = computed<T[]>(() => {
    if (!this.hasMore()) return this.items();

    const loadMore = {
      [this.labelField()]: LOAD_MORE_OPTION.label,
      [this.valueField()]: LOAD_MORE_OPTION.value,
      disabled: true,
    } as T;

    return [...this.items(), loadMore];
  });

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

  protected onPanelShow() {
    if (this.items().length === 0 && !this.loading()) this.loadNextPage();
  }

  protected onLoadMore() {
    this.loadNextPage();
  }

  protected onMultiClear() {
    this.control().setValue([]);
  }

  protected onSelectAll() {
    const valueField = this.valueField();
    this.control().setValue(this.items().map((item) => (item as Record<string, unknown>)[valueField]));
  }

  protected readonly isLoadMore = (option: T): boolean =>
    (option as Record<string, unknown>)[this.valueField()] === LOAD_MORE_OPTION.value;

  protected labelOf(option: T): string {
    return String((option as Record<string, unknown>)[this.labelField()] ?? "");
  }

  private loadNextPage() {
    if (this.loading()) return;

    const nextPage = this.page();
    this.loading.set(true);

    this.fetchFn()(nextPage, this.pageSize()).subscribe({
      next: (response) => {
        this.items.update((items) => [...items, ...response.content]);
        this.page.set(response.page.number + 1);
        this.totalPages.set(response.page.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
