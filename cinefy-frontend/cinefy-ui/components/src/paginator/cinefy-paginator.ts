import { Component, DestroyRef, computed, inject, input, model } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl } from "@angular/forms";
import { Paginator } from "primeng/paginator";
import { CuiSelect } from "../drop-down/cui-select/cui-select";

interface PageOption {
  label: string;
  value: number;
}

@Component({
  selector: "cui-paginator",
  imports: [Paginator, CuiSelect],
  templateUrl: "./cinefy-paginator.html",
  styleUrl: "./cinefy-paginator.scss",
})
export class CinefyPaginator {
  private readonly destroyRef = inject(DestroyRef);

  readonly page = model.required<number>();
  readonly pageCount = input.required<number>();
  readonly totalItems = input.required<number>();
  readonly pageSize = input.required<number>();

  protected readonly first = computed(() => this.page() * this.pageSize());

  protected readonly jumpToPageControl = new FormControl<number | null>(null);

  protected readonly pageOptions = computed<PageOption[]>(() =>
    Array.from({ length: this.pageCount() }, (_, index) => ({
      label: `${index + 1}`,
      value: index,
    })),
  );

  constructor() {
    this.jumpToPageControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((page) => this.page.set(page ?? 0));
  }

  protected onPageChange(first: number): void {
    this.page.set(Math.floor(first / this.pageSize()));
    this.jumpToPageControl.reset(null, { emitEvent: false });
  }
}
