import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { Paginator } from 'primeng/paginator';
import { CuiSelect } from 'cinefy-ui/components';

const PAGE_SIZE = 10;
const TOTAL_RECORDS = 87;

@Component({
  selector: 'test-page',
  imports: [Paginator, CuiSelect],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class TestPage {
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly totalRecords = TOTAL_RECORDS;

  protected readonly currentPage = signal(0);

  protected readonly jumpToPageControl = new FormControl<number | null>(null);

  protected readonly pageOptions = computed(() => {
    const pageCount = Math.ceil(this.totalRecords / this.pageSize);
    return Array.from({ length: pageCount }, (_, index) => ({
      label: `${index + 1}`,
      value: index * this.pageSize,
    }));
  });

  constructor() {
    this.jumpToPageControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((first) => {
        this.currentPage.set(first ?? 0);
      });
  }

  protected onPageChange(first: number): void {
    this.currentPage.set(first);
    if (this.jumpToPageControl.value !== null) {
      this.jumpToPageControl.reset(null, { emitEvent: false });
    }
  }
}
