import { afterNextRender, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { map } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';
import { LoadingSpinnerComponent, MediaImageComponent } from 'cinefy-ui/components';
import { BookingService } from '../../services';
import { skipErrorToast } from '../../app/core/interceptors';
import { comparePositions } from '../../shared/seat-position';
import type { ApiError, BookingConfirmation, PaymentState } from '../../shared/types';
import {
  CalendarIcon,
  CheckIcon,
  ClapperboardIcon,
  ClockIcon,
  MapPinIcon,
  RotateCcwIcon,
  SearchXIcon,
  TicketIcon,
  TriangleAlertIcon,
  XIcon,
} from '../../shared/icons';

const HEADINGS: Record<PaymentState, { title: string; note: string }> = {
  CONFIRMED: {
    title: 'Booking confirmed',
    note: 'Your payment was successful and your tickets are ready.',
  },
  PENDING: {
    title: 'Payment processing',
    note: 'Your payment is awaiting confirmation from your bank.',
  },
  FAILED: {
    title: 'Payment failed',
    note: 'Your card was not charged. You can try again at any time.',
  },
  REFUNDED: {
    title: 'Booking refunded',
    note: 'This booking was refunded and the amount is on its way back to your card.',
  },
};

type ViewState =
  | { status: 'loading' }
  | { status: 'loaded'; booking: BookingConfirmation }
  | { status: 'notFound' }
  | { status: 'paymentNotAttempted' }
  | { status: 'error' };

const POLL_INTERVAL_MS = 2500;

const QR_CELLS = 11;

@Component({
  selector: 'booking-confirmation-page',
  imports: [
    RouterLink,
    LucideDynamicIcon,
    LoadingSpinnerComponent,
    MediaImageComponent,
    CurrencyPipe,
    DatePipe,
  ],
  templateUrl: './booking-confirmation.html',
  styleUrl: './booking-confirmation.scss',
})
export class BookingConfirmationPage {
  protected readonly icons = {
    CalendarIcon,
    CheckIcon,
    ClapperboardIcon,
    ClockIcon,
    MapPinIcon,
    RotateCcwIcon,
    SearchXIcon,
    TicketIcon,
    TriangleAlertIcon,
    XIcon,
  };

  private readonly route = inject(ActivatedRoute);
  private readonly bookingService = inject(BookingService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly bookingId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('bookingId'))),
  );

  protected readonly state = signal<ViewState>({ status: 'loading' });

  protected readonly booking = computed(() => {
    const state = this.state();
    return state.status === 'loaded' ? state.booking : null;
  });

  protected readonly paymentState = computed(() => this.booking()?.paymentState ?? null);

  protected readonly heading = computed(() => {
    const state = this.paymentState();
    return state ? HEADINGS[state] : null;
  });

  protected readonly seatPositions = computed(() =>
    (this.booking()?.seats ?? []).map((seat) => seat.position).sort(comparePositions),
  );

  protected readonly qrCells = computed(() => buildQrCells(this.booking()?.ticketToken ?? ''));

  private pollTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    afterNextRender(() => this.load());

    this.destroyRef.onDestroy(() => this.clearPoll());
  }

  private load(): void {
    const bookingId = this.bookingId();
    if (!bookingId) {
      this.state.set({ status: 'notFound' });
      return;
    }

    this.bookingService
      .getBookingConfirmation(bookingId, skipErrorToast())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (booking) => {
          this.state.set({ status: 'loaded', booking });

          if (booking.paymentState === 'PENDING') {
            this.pollTimer = setTimeout(() => this.load(), POLL_INTERVAL_MS);
          }
        },
        error: (error: unknown) => {
          this.state.set({ status: toErrorStatus(error) });
        },
      });
  }

  private clearPoll(): void {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }
}

function toErrorStatus(error: unknown): 'notFound' | 'paymentNotAttempted' | 'error' {
  if (!(error instanceof HttpErrorResponse)) {
    return 'error';
  }
  if (error.status === 404) {
    return 'notFound';
  }
  if ((error.error as ApiError)?.errorCode === 'PAYMENT_NOT_ATTEMPTED') {
    return 'paymentNotAttempted';
  }
  return 'error';
}

function buildQrCells(seed: string): boolean[] {
  const bit = (index: number) => {
    let hash = 0;
    for (let position = 0; position < seed.length; position++) {
      hash = (hash * 31 + seed.charCodeAt(position) + index * 13) & 0xffff;
    }
    return hash % 7 < 3;
  };

  return Array.from({ length: QR_CELLS * QR_CELLS }, (_, index) => {
    const row = Math.floor(index / QR_CELLS);
    const column = index % QR_CELLS;
    const isFinder =
      (row < 3 && column < 3) ||
      (row < 3 && column > QR_CELLS - 4) ||
      (row > QR_CELLS - 4 && column < 3);
    return isFinder || bit(index);
  });
}
