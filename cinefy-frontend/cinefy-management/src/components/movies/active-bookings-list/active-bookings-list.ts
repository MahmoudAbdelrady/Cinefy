import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  inject,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { LucideDynamicIcon } from '@lucide/angular';
import { differenceInSeconds, format } from 'date-fns';
import {
  CinefyDialog,
  CinefyEmptyState,
  CinefyErrorState,
  CinefyLoadingSpinner,
  CinefyMediaImage,
} from 'cinefy-ui/components';
import { BookSeatsComponent } from '../book-seats/book-seats';
import { skipServerErrorToast } from 'cinefy-ui/http';
import { BookingService } from '../../../services';
import type { BookingSummary } from '../../../shared/types';
import { CalendarIcon, ClapperboardIcon, ClockIcon, TicketIcon } from '../../../shared/icons';

@Component({
  selector: 'active-bookings-list',
  imports: [
    CurrencyPipe,
    DatePipe,
    LucideDynamicIcon,
    CinefyDialog,
    CinefyEmptyState,
    CinefyErrorState,
    CinefyLoadingSpinner,
    CinefyMediaImage,
    BookSeatsComponent,
  ],
  templateUrl: './active-bookings-list.html',
  styleUrl: './active-bookings-list.scss',
})
export class ActiveBookingsListComponent {
  protected readonly icons = {
    CalendarIcon,
    ClapperboardIcon,
    ClockIcon,
    TicketIcon,
  };

  private readonly bookingService = inject(BookingService);
  private readonly destroyRef = inject(DestroyRef);
  readonly closed = output<void>();

  protected readonly bookings = signal<BookingSummary[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);
  protected readonly bookingToComplete = signal<BookingSummary | null>(null);

  protected readonly description = computed(() => {
    const count = this.bookings().length;
    return count
      ? `${count} booking${count > 1 ? 's' : ''} awaiting payment`
      : 'No bookings in progress';
  });

  constructor() {
    afterNextRender(() => this.loadActiveBookings());
  }

  protected loadActiveBookings(): void {
    this.isLoading.set(true);
    this.bookingService
      .getActiveBookings(skipServerErrorToast())
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (bookings) => {
          this.bookings.set(bookings);
          this.hasError.set(false);
        },
        error: () => this.hasError.set(true),
      });
  }

  protected onBookSeatsClosed(): void {
    this.bookingToComplete.set(null);
    this.loadActiveBookings();
  }

  protected isExpiringSoon(booking: BookingSummary): boolean {
    const secondsLeft = differenceInSeconds(booking.expiresAt, Date.now());
    return secondsLeft > 0 && secondsLeft <= 120;
  }

  protected bookingSummary(booking: BookingSummary): string {
    const when = format(new Date(booking.startDateTime), "MMM d, yyyy 'at' h:mm a");
    const hallType = `${booking.hallType}${booking.is3D ? ' (3D)' : ''}`;
    return `${booking.movie.title} · ${booking.hallName} · ${hallType} · ${when}`;
  }
}
