import { Component, computed, input, model } from '@angular/core';
import {
  NgpPagination,
  NgpPaginationFirst,
  NgpPaginationLast,
  NgpPaginationNext,
  NgpPaginationPrevious,
} from 'ng-primitives/pagination';
import { NgpTooltip, NgpTooltipTrigger } from 'ng-primitives/tooltip';
import { ChevronLeft, ChevronsLeft, ChevronsRight, LucideAngularModule } from 'lucide-angular';
import { ChevronRightIcon } from '../../shared/icons';

@Component({
  selector: 'pagination-component',
  imports: [
    LucideAngularModule,
    NgpPagination,
    NgpPaginationFirst,
    NgpPaginationPrevious,
    NgpPaginationNext,
    NgpPaginationLast,
    NgpTooltip,
    NgpTooltipTrigger,
  ],
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
})
export class PaginationComponent {
  protected readonly icons = {
    ChevronRightIcon,
    FirstIcon: ChevronsLeft,
    PrevIcon: ChevronLeft,
    LastIcon: ChevronsRight,
  };

  readonly page = model.required<number>();
  readonly pageCount = input.required<number>();
  readonly totalItems = input.required<number>();
  readonly pageSize = input.required<number>();

  protected readonly startItem = computed(() => {
    if (this.totalItems() === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  });

  protected readonly endItem = computed(() =>
    Math.min(this.page() * this.pageSize(), this.totalItems()),
  );

  protected goToPage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);

    if (!isNaN(value) && value >= 1 && value <= this.pageCount()) {
      this.page.set(value);
    }

    input.value = '';
  }
}
