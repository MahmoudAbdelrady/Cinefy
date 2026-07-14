import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  EmptyStateComponent,
  LoadingSpinnerComponent,
  SeatMapComponent,
} from 'cinefy-ui/components';
import { SEAT_CATEGORY_LABEL, type Seat, type SeatCategory } from 'cinefy-ui/types';
import { BookingService } from '../../../services';
import { InfoIcon, TicketIcon, WarningIcon } from '../../../shared/icons';
import type { ShowtimeHallLayout, ShowtimeSeatLayout } from '../../../shared/types';

function seatCategory(id: string, layout: ShowtimeSeatLayout): SeatCategory {
  if (layout.categories.AISLE?.includes(id)) return 'AISLE';
  if (layout.categories.VIP?.includes(id)) return 'VIP';
  return 'NORMAL';
}

function buildHall(hallLayout: ShowtimeHallLayout): Seat[][] {
  const { numberOfRows, seatsPerRow, layout } = hallLayout;
  return Array.from({ length: numberOfRows }, (_, rowIdx) => {
    const row = String.fromCharCode(65 + rowIdx);
    return Array.from({ length: seatsPerRow }, (_, colIdx) => {
      const number = colIdx + 1;
      const id = `${row}${number}`;
      return {
        id,
        row,
        number,
        category: seatCategory(id, layout),
        onSiteOnly: layout.onSiteOnly.includes(id),
        taken: layout.reserved.includes(id),
      };
    });
  });
}

@Component({
  selector: 'reserve-seats',
  imports: [
    CurrencyPipe,
    LucideDynamicIcon,
    SeatMapComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  templateUrl: './reserve-seats.html',
  styleUrl: './reserve-seats.scss',
})
export class ReserveSeatsComponent {
  protected readonly icons = {
    InfoIcon,
    TicketIcon,
    WarningIcon,
  };

  private readonly bookingService = inject(BookingService);

  protected readonly seatCategoryLabel = SEAT_CATEGORY_LABEL;

  readonly showtimeId = input.required<string>();

  protected readonly selectedSeats = signal<Seat[]>([]);

  private readonly seatSelectionResource = rxResource({
    params: () => this.showtimeId(),
    stream: ({ params: showtimeId }) => this.bookingService.getSeatSelection(showtimeId),
  });

  protected readonly loading = computed(() => this.seatSelectionResource.isLoading());
  protected readonly failed = computed(() => !!this.seatSelectionResource.error());
  protected readonly seatSelection = computed(() => this.seatSelectionResource.value());

  protected readonly hall = computed<Seat[][]>(() => {
    const layout = this.seatSelection()?.hallLayout;
    return layout ? buildHall(layout) : [];
  });

  private readonly prices = computed<Partial<Record<SeatCategory, number>>>(() => {
    const pricing = this.seatSelection()?.hallLayout.ticketPricing ?? [];
    return pricing.reduce<Partial<Record<SeatCategory, number>>>(
      (acc, { seatCategory, price }) => ({ ...acc, [seatCategory]: price }),
      {},
    );
  });

  protected readonly pricedSeats = computed(() =>
    this.selectedSeats()
      .map((seat) => ({ seat, price: this.prices()[seat.category] ?? 0 }))
      .sort((a, b) => a.seat.row.localeCompare(b.seat.row) || a.seat.number - b.seat.number),
  );

  protected readonly total = computed(() =>
    this.pricedSeats().reduce((sum, { price }) => sum + price, 0),
  );

  protected onSelectionChange(seats: Seat[]): void {
    this.selectedSeats.set(seats);
  }
}
