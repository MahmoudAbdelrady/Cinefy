import { afterNextRender, Component, DestroyRef, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  EmptyStateComponent,
  LoadingSpinnerComponent,
  MediaImageComponent,
  PaginationComponent,
} from 'cinefy-ui/components';
import { PastBookingDetailsModalComponent } from '../past-booking-details-modal/past-booking-details-modal';
import { BookingService } from '../../../services';
import { ClapperboardIcon, ClockIcon, TicketIcon, TriangleAlertIcon } from '../../../shared/icons';
import type { PastBooking } from '../../../shared/types';

const PAGE_SIZE = 5;

@Component({
  selector: 'profile-history',
  imports: [
    CurrencyPipe,
    DatePipe,
    LucideDynamicIcon,
    MediaImageComponent,
    PastBookingDetailsModalComponent,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    PaginationComponent,
  ],
  templateUrl: './profile-history.html',
  styleUrl: './profile-history.scss',
})
export class ProfileHistoryComponent {
  protected readonly icons = {
    ClockIcon,
    ClapperboardIcon,
    TicketIcon,
    TriangleAlertIcon,
  };

  private readonly bookingService = inject(BookingService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pageSize = PAGE_SIZE;

  protected readonly bookingToView = signal<PastBooking | null>(null);

  protected readonly bookings = signal<PastBooking[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly pageCount = signal(1);
  protected readonly page = signal(1);
  protected readonly loading = signal(true);
  protected readonly loadFailed = signal(false);

  constructor() {
    afterNextRender(() => this.loadPage(1));
  }

  private loadPage(page: number): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.bookingService
      .getPastBookings({ page: page - 1, size: PAGE_SIZE })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.bookings.set(response.content);
          this.totalItems.set(response.page.totalElements);
          this.pageCount.set(Math.max(1, response.page.totalPages));
          this.page.set(response.page.number + 1);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.loadFailed.set(true);
        },
      });
  }

  protected onPageChange(page: number): void {
    if (page === this.page()) return;
    this.loadPage(page);
  }
}
