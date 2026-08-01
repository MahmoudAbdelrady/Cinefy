import { Component, computed, inject, input, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, DOCUMENT } from '@angular/common';
import { LucideDynamicIcon } from '@lucide/angular';
import { SEAT_CATEGORY_LABEL } from 'cinefy-ui/types';
import { PrinterIcon } from '../../../shared/icons';
import type { BookedSeat, BookingConfirmation } from '../../../shared/types';

type TicketLayout = 'combined' | 'split';

const PRINTING_CLASS = 'printing';

interface TicketStub {
  key: string;
  seats: BookedSeat[];
  positions: string;
  total: number;
}

function toStub(seats: BookedSeat[], total: number): TicketStub {
  return {
    key: seats.map((seat) => seat.position).join('-'),
    seats,
    positions: seats.map((seat) => seat.position).join(', '),
    total,
  };
}

@Component({
  selector: 'booking-ticket',
  imports: [CurrencyPipe, DatePipe, LucideDynamicIcon],
  templateUrl: './booking-ticket.html',
  styleUrl: './booking-ticket.scss',
})
export class BookingTicketComponent {
  protected readonly icons = { PrinterIcon };

  private readonly document = inject(DOCUMENT);

  protected readonly seatCategoryLabel = SEAT_CATEGORY_LABEL;

  readonly ticket = input.required<BookingConfirmation>();

  protected readonly layout = signal<TicketLayout>('combined');

  protected readonly hasMultipleSeats = computed(() => this.ticket().seats.length > 1);

  protected readonly isSplit = computed(() => this.hasMultipleSeats() && this.layout() === 'split');

  protected readonly stubs = computed<TicketStub[]>(() => {
    const { seats, totalPrice } = this.ticket();
    return this.isSplit()
      ? seats.map((seat) => toStub([seat], seat.price))
      : [toStub(seats, totalPrice)];
  });

  protected readonly experience = computed(() => {
    const { hallType, is3D } = this.ticket();
    return is3D ? `${hallType} (3D)` : hallType;
  });

  protected selectLayout(layout: TicketLayout): void {
    this.layout.set(layout);
  }

  protected print(): void {
    const view = this.document.defaultView;
    if (!view) return;

    const body = this.document.body;
    body.classList.add(PRINTING_CLASS);
    view.addEventListener('afterprint', () => body.classList.remove(PRINTING_CLASS), {
      once: true,
    });

    view.print();
  }
}
