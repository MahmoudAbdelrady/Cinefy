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
  EXPIRED: {
    title: 'Booking expired',
    note: 'This booking was held for too long and the seats have been released. If a payment was taken, it will be refunded to your card.',
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

const VOIDED_STATES = new Set<PaymentState>(['FAILED', 'EXPIRED', 'REFUNDED']);

const POLL_INITIAL_INTERVAL_MS = 2500;

const POLL_MAX_INTERVAL_MS = 30_000;

const POLL_BACKOFF_FACTOR = 1.5;

const POLL_BACKOFF_AFTER_MS = 60_000;

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

  protected readonly isVoided = computed(() => VOIDED_STATES.has(this.paymentState()!));

  protected readonly seatPositions = computed(() =>
    (this.booking()?.seats ?? []).map((seat) => seat.position).sort(comparePositions),
  );

  private pollTimer: ReturnType<typeof setTimeout> | null = null;

  private pollInterval = POLL_INITIAL_INTERVAL_MS;

  private pollStartedAt: number | null = null;

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

          if (booking.paymentState !== 'PENDING') {
            this.pollInterval = POLL_INITIAL_INTERVAL_MS;
            this.pollStartedAt = null;
            return;
          }

          this.pollStartedAt ??= Date.now();

          this.pollTimer = setTimeout(() => this.load(), this.pollInterval);

          if (Date.now() - this.pollStartedAt >= POLL_BACKOFF_AFTER_MS) {
            this.pollInterval = Math.min(
              this.pollInterval * POLL_BACKOFF_FACTOR,
              POLL_MAX_INTERVAL_MS,
            );
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
