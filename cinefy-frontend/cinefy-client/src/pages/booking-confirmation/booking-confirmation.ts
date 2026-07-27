import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';
import { LoadingSpinnerComponent } from 'cinefy-ui/components';
import type { SeatCategory } from 'cinefy-ui/types';
import { comparePositions } from '../../shared/seat-position';
import {
  CalendarIcon,
  CheckIcon,
  ClapperboardIcon,
  ClockIcon,
  MapPinIcon,
  RotateCcwIcon,
  TicketIcon,
  XIcon,
} from '../../shared/icons';

type PaymentState = 'success' | 'pending' | 'failed';

const HEADINGS: Record<PaymentState, { title: string; note: string }> = {
  success: {
    title: 'Booking confirmed',
    note: 'Your payment was successful and your tickets are ready.',
  },
  pending: {
    title: 'Payment processing',
    note: 'Your payment is awaiting confirmation from your bank.',
  },
  failed: {
    title: 'Payment failed',
    note: 'Your card was not charged. You can try again at any time.',
  },
};

const QR_CELLS = 11;

@Component({
  selector: 'booking-confirmation-page',
  imports: [RouterLink, LucideDynamicIcon, LoadingSpinnerComponent],
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
    TicketIcon,
    XIcon,
  };

  private readonly route = inject(ActivatedRoute);

  protected readonly bookingId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('bookingId'))),
  );

  protected readonly paymentState = signal<PaymentState>('success');

  protected readonly seats = signal<{ position: string; category: SeatCategory }[]>([
    { position: 'F7', category: 'VIP' },
    { position: 'F8', category: 'NORMAL' },
  ]);

  protected readonly seatPositions = computed(() =>
    this.seats()
      .map((seat) => seat.position)
      .sort(comparePositions),
  );

  protected readonly heading = computed(() => HEADINGS[this.paymentState()]);

  protected readonly qrCells = computed(() => buildQrCells('placeholder'));
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
