import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { differenceInSeconds } from 'date-fns';
import {
  CinefyDialog,
  EmptyStateComponent,
  LoadingSpinnerComponent,
  MediaImageComponent,
} from 'cinefy-ui/components';
import { BookingService } from '../../../services';
import type { BookingSummary } from '../../../shared/types';
import {
  CalendarIcon,
  ClapperboardIcon,
  ClockIcon,
  TicketIcon,
  ArrowRightIcon,
  TriangleAlertIcon,
} from '../../../shared/icons';

@Component({
  selector: 'my-tickets-list',
  imports: [
    RouterLink,
    LucideDynamicIcon,
    CinefyDialog,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    MediaImageComponent,
    CurrencyPipe,
    DatePipe,
  ],
  templateUrl: './my-tickets-list.html',
  styleUrl: './my-tickets-list.scss',
})
export class MyTicketsListComponent {
  protected readonly icons = {
    CalendarIcon,
    ClapperboardIcon,
    ClockIcon,
    TicketIcon,
    ArrowRightIcon,
    TriangleAlertIcon,
  };

  private readonly bookingService = inject(BookingService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly dialog = viewChild.required(CinefyDialog);

  readonly closed = output<void>();

  protected readonly bookings = signal<BookingSummary[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);

  protected readonly description = computed(() => {
    const count = this.bookings().length;
    return count
      ? `${count} booking${count > 1 ? 's' : ''} to complete`
      : 'No bookings in progress';
  });

  constructor() {
    afterNextRender(() => this.loadActiveBookings());
  }

  private loadActiveBookings(): void {
    this.bookingService
      .getActiveBookings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (bookings) => {
          this.bookings.set(bookings);
          this.isLoading.set(false);
        },
        error: () => {
          this.hasError.set(true);
          this.isLoading.set(false);
        },
      });
  }

  protected closeDialog(): void {
    this.dialog().close();
  }

  protected isExpiringSoon(booking: BookingSummary): boolean {
    const secondsLeft = differenceInSeconds(booking.expiresAt, Date.now());
    return secondsLeft > 0 && secondsLeft <= 120;
  }
}
