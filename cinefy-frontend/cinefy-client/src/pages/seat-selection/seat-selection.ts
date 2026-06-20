import { Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { map } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';
import { EmptyStateComponent, LoadingSpinnerComponent } from 'cinefy-ui/components';
import { BookingSummaryComponent, SeatMapComponent } from '../../components';
import { BookingService } from '../../services';
import { ArrowLeftIcon, TriangleAlertIcon } from '../../shared/icons';
import type {
  Seat,
  SeatCategory,
  SeatKind,
  SeatLayout,
  SeatLayoutResponse,
  TicketPrice,
} from '../../shared/types';

function seatKind(id: string, layout: SeatLayout): SeatKind {
  if (layout.categories.AISLE?.includes(id)) return 'AISLE';
  if (layout.reserved.includes(id) || layout.onSiteOnly.includes(id)) return 'TAKEN';
  if (layout.categories.VIP?.includes(id)) return 'VIP';
  return 'NORMAL';
}

function buildHall(response: SeatLayoutResponse): Seat[][] {
  const { numberOfRows, seatsPerRow, layout } = response;
  return Array.from({ length: numberOfRows }, (_, rowIdx) => {
    const row = String.fromCharCode(65 + rowIdx);
    return Array.from({ length: seatsPerRow }, (_, c) => {
      const number = c + 1;
      const id = `${row}${number}`;
      return { id, row, number, kind: seatKind(id, layout) };
    });
  });
}

function priceByCategory(pricing: TicketPrice[]): Record<SeatCategory, number> {
  return pricing.reduce(
    (acc, { seatCategory, price }) => ({ ...acc, [seatCategory]: price }),
    {} as Record<SeatCategory, number>,
  );
}

@Component({
  selector: 'seat-selection-page',
  imports: [
    RouterLink,
    DatePipe,
    LucideDynamicIcon,
    SeatMapComponent,
    BookingSummaryComponent,
    EmptyStateComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.scss',
})
export class SeatSelectionPage {
  protected readonly icons = {
    ArrowLeftIcon,
    TriangleAlertIcon,
  };

  private readonly route = inject(ActivatedRoute);
  private readonly bookingService = inject(BookingService);

  protected readonly movieId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('movieId')))),
  );

  protected readonly showtimeId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('showtimeId'))),
  );

  protected readonly seatSelectionResource = rxResource({
    params: () => this.showtimeId() ?? undefined,
    stream: ({ params: showtimeId }) => this.bookingService.getSeatSelection(showtimeId),
  });

  protected readonly seatSelection = computed(() => this.seatSelectionResource.value());

  protected readonly hall = computed<Seat[][]>(() => {
    const layout = this.seatSelection()?.hallLayout;
    return layout ? buildHall(layout) : [];
  });

  protected readonly prices = computed<Record<SeatCategory, number>>(() => {
    const layout = this.seatSelection()?.hallLayout;
    return layout ? priceByCategory(layout.ticketPricing) : ({} as Record<SeatCategory, number>);
  });

  protected readonly selectedSeats = signal<Seat[]>([]);
}
