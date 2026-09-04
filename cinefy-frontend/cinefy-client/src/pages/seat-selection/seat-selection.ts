import { Component, computed, DestroyRef, inject, linkedSignal, viewChild } from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { map } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  CinefyDialog,
  CinefyDialogFooter,
  EmptyStateComponent,
  HoldTimerComponent,
  LoadingSpinnerComponent,
  SeatMapComponent,
} from 'cinefy-ui/components';
import { BookingCancelledComponent, BookingSummaryComponent } from '../../components';
import { BookingService } from '../../services';
import { skipErrorToast } from '../../app/core/interceptors';
import { ArrowLeftIcon, TicketXIcon, TriangleAlertIcon, XIcon } from '../../shared/icons';
import type { Seat, SeatCategory } from 'cinefy-ui/types';
import type {
  ApiError,
  SelectableSeatCategory,
  SeatLayout,
  SeatLayoutResponse,
  TicketPrice,
} from '../../shared/types';

function seatCategory(id: string, layout: SeatLayout): SeatCategory {
  if (layout.categories.AISLE?.includes(id)) return 'AISLE';
  if (layout.categories.VIP?.includes(id)) return 'VIP';
  return 'NORMAL';
}

function buildHall(response: SeatLayoutResponse, bookedSeats: Set<string>): Seat[][] {
  const { numberOfRows, seatsPerRow, layout } = response;
  return Array.from({ length: numberOfRows }, (_, rowIdx) => {
    const row = String.fromCharCode(65 + rowIdx);
    return Array.from({ length: seatsPerRow }, (_, c) => {
      const number = c + 1;
      const id = `${row}${number}`;
      return {
        id,
        row,
        number,
        category: seatCategory(id, layout),
        onSiteOnly: layout.onSiteOnly.includes(id),
        taken: layout.booked.includes(id) && !bookedSeats.has(id),
      };
    });
  });
}

function priceByCategory(pricing: TicketPrice[]): Record<SelectableSeatCategory, number> {
  return Object.fromEntries(
    pricing.map(({ seatCategory, price }) => [seatCategory, price]),
  ) as Record<SelectableSeatCategory, number>;
}

@Component({
  selector: 'seat-selection-page',
  imports: [
    RouterLink,
    DatePipe,
    LucideDynamicIcon,
    SeatMapComponent,
    BookingSummaryComponent,
    HoldTimerComponent,
    BookingCancelledComponent,
    CinefyDialog,
    CinefyDialogFooter,
    EmptyStateComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.scss',
})
export class SeatSelectionPage {
  protected readonly icons = {
    ArrowLeftIcon,
    TicketXIcon,
    TriangleAlertIcon,
    XIcon,
  };

  private readonly route = inject(ActivatedRoute);
  private readonly bookingService = inject(BookingService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly cancelDialog = viewChild('cancelDialog', { read: CinefyDialog });

  protected readonly movieId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('movieId')))),
  );

  protected readonly showtimeId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('showtimeId'))),
  );

  protected readonly seatSelectionResource = rxResource({
    params: () => this.showtimeId() ?? undefined,
    stream: ({ params: showtimeId }) =>
      this.bookingService.getSeatSelection(showtimeId, skipErrorToast()),
  });

  protected readonly seatSelection = computed(() => this.seatSelectionResource.value());

  protected readonly errorMessage = computed(() => {
    const error = this.seatSelectionResource.error();
    const message = error instanceof HttpErrorResponse ? (error.error as ApiError)?.message : null;
    return message ?? 'Something went wrong. Please try again later.';
  });

  protected readonly activeBooking = computed(() => this.seatSelection()?.activeBooking);

  protected readonly bookedSeats = computed<string[]>(() => this.activeBooking()?.seats ?? []);

  protected readonly hall = computed<Seat[][]>(() => {
    const layout = this.seatSelection()?.hallLayout;
    return layout ? buildHall(layout, new Set(this.bookedSeats())) : [];
  });

  protected readonly prices = computed<Record<SelectableSeatCategory, number>>(() => {
    const layout = this.seatSelection()?.hallLayout;
    return layout
      ? priceByCategory(layout.ticketPricing)
      : ({} as Record<SelectableSeatCategory, number>);
  });

  protected readonly selectedSeats = linkedSignal<Seat[]>(() => {
    const booked = new Set(this.bookedSeats());
    if (!booked.size) return [];
    return this.hall()
      .flat()
      .filter((seat) => booked.has(seat.id));
  });

  private readonly perShowtime = <T>(initial: T) =>
    linkedSignal({ source: this.showtimeId, computation: () => initial });

  protected readonly cancelling = this.perShowtime(false);
  protected readonly cancelled = this.perShowtime(false);
  protected readonly bookingExpired = this.perShowtime(false);
  protected readonly cancelVisible = this.perShowtime(false);
  protected readonly expiredVisible = this.perShowtime(false);

  protected onExpired(): void {
    this.bookingExpired.set(true);
    this.expiredVisible.set(true);
  }

  protected reloadSeats(): void {
    this.expiredVisible.set(false);
    this.bookingExpired.set(false);
    this.seatSelectionResource.reload();
  }

  protected closeCancelDialog(): void {
    this.cancelDialog()?.close();
  }

  protected confirmCancel(): void {
    const activeBooking = this.activeBooking();
    if (!activeBooking || this.cancelling()) return;

    this.cancelling.set(true);
    this.bookingService
      .cancelBooking(activeBooking.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closeCancelDialog();
          this.cancelled.set(true);
        },
        error: () => {
          this.cancelling.set(false);
        },
      });
  }
}
