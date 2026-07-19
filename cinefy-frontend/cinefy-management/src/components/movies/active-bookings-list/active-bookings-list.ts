import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { LucideDynamicIcon } from '@lucide/angular';
import { differenceInSeconds, format } from 'date-fns';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import {
  EmptyStateComponent,
  LoadingSpinnerComponent,
  MediaImageComponent,
  ModalComponent,
} from 'cinefy-ui/components';
import { BookSeatsComponent } from '../book-seats/book-seats';
import { BookingService } from '../../../services';
import type { BookingSummary } from '../../../shared/types';
import {
  CalendarIcon,
  ClapperboardIcon,
  ClockIcon,
  TicketIcon,
  WarningIcon,
} from '../../../shared/icons';

@Component({
  selector: 'active-bookings-list',
  imports: [
    CurrencyPipe,
    DatePipe,
    LucideDynamicIcon,
    NgpDialogTrigger,
    ModalComponent,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    MediaImageComponent,
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
    WarningIcon,
  };

  private readonly bookingService = inject(BookingService);
  private readonly destroyRef = inject(DestroyRef);

  readonly close = input.required<() => void>();

  protected readonly bookings = signal<BookingSummary[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);

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
      .getActiveBookings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (bookings) => {
          this.bookings.set(bookings);
          this.hasError.set(false);
          this.isLoading.set(false);
        },
        error: () => {
          this.hasError.set(true);
          this.isLoading.set(false);
        },
      });
  }

  protected isExpiringSoon(booking: BookingSummary): boolean {
    const secondsLeft = differenceInSeconds(booking.expiresAt, Date.now());
    return secondsLeft > 0 && secondsLeft <= 120;
  }

  protected bookingSummary(booking: BookingSummary): string {
    const when = format(new Date(booking.startDateTime), "MMM d, yyyy 'at' h:mm a");
    return `${booking.movie.title} · ${booking.hallName} · ${when}`;
  }
}
