import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  CinefyEmptyState,
  CinefyErrorState,
  CinefyLoadingSpinner,
  CinefyMediaImage,
  CinefyPaginator,
} from 'cinefy-ui/components';
import { PastBookingDetailsModalComponent } from '../past-booking-details-modal/past-booking-details-modal';
import { skipServerErrorToast } from 'cinefy-ui/http';
import { BookingService } from '../../../services';
import { ClapperboardIcon, ClockIcon, EyeIcon, TicketIcon } from '../../../shared/icons';
import type { PastBooking } from '../../../shared/types';

const PAGE_SIZE = 5;

@Component({
  selector: 'profile-history',
  imports: [
    CurrencyPipe,
    DatePipe,
    LucideDynamicIcon,
    CinefyMediaImage,
    PastBookingDetailsModalComponent,
    CinefyEmptyState,
    CinefyErrorState,
    CinefyLoadingSpinner,
    CinefyPaginator,
  ],
  templateUrl: './profile-history.html',
  styleUrl: './profile-history.scss',
})
export class ProfileHistoryComponent {
  protected readonly icons = {
    ClockIcon,
    ClapperboardIcon,
    EyeIcon,
    TicketIcon,
  };

  private readonly bookingService = inject(BookingService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pageSize = PAGE_SIZE;

  protected readonly bookingToView = signal<PastBooking | null>(null);

  protected readonly bookings = signal<PastBooking[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly pageCount = signal(1);
  protected readonly page = signal(0);
  protected readonly loading = signal(true);
  protected readonly loadFailed = signal(false);

  constructor() {
    effect((onCleanup) => {
      const sub = this.loadPage(this.page());
      onCleanup(() => sub.unsubscribe());
    });
  }

  private loadPage(page: number): Subscription {
    this.loading.set(true);
    this.loadFailed.set(false);
    return this.bookingService
      .getPastBookings({ page, size: PAGE_SIZE }, skipServerErrorToast())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.bookings.set(response.content);
          this.totalItems.set(response.page.totalElements);
          this.pageCount.set(Math.max(1, response.page.totalPages));
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.loadFailed.set(true);
        },
      });
  }
}
