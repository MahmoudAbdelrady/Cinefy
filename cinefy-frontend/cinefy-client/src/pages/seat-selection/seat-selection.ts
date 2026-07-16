import {
  Component,
  computed,
  DestroyRef,
  inject,
  linkedSignal,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { map } from 'rxjs';
import { NgpDialogTrigger, NgpDialogManager } from 'ng-primitives/dialog';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  EmptyStateComponent,
  HoldTimerComponent,
  LoadingSpinnerComponent,
  ModalComponent,
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
    NgpDialogTrigger,
    LucideDynamicIcon,
    SeatMapComponent,
    BookingSummaryComponent,
    HoldTimerComponent,
    BookingCancelledComponent,
    ModalComponent,
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
  private readonly dialogManager = inject(NgpDialogManager);
  private readonly destroyRef = inject(DestroyRef);

  private readonly expiredDialog = viewChild.required<TemplateRef<unknown>>('expiredDialog');

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

  protected readonly cancelling = signal(false);
  protected readonly cancelled = signal(false);
  protected readonly bookingExpired = signal(false);

  protected onExpired(): void {
    this.bookingExpired.set(true);
    this.dialogManager.open(this.expiredDialog() as TemplateRef<never>);
  }

  protected reloadSeats(close: () => void): void {
    close();
    this.bookingExpired.set(false);
    this.seatSelectionResource.reload();
  }

  protected confirmCancel(close: () => void): void {
    const activeBooking = this.activeBooking();
    if (!activeBooking || this.cancelling()) return;

    this.cancelling.set(true);
    this.bookingService
      .cancelBooking(activeBooking.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          close();
          this.cancelled.set(true);
        },
        error: () => {
          this.cancelling.set(false);
        },
      });
  }
}
