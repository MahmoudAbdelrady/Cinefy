import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import type { AppendTo as PrimeAppendTo } from 'primeng/types/shared';
import {
  CinefySelect,
  CinefyEmptyState,
  CinefyHoldTimer,
  CinefyInput,
  CinefyLoadingSpinner,
  CinefyDialog,
  CinefyDialogFooter,
  CinefySeatMap,
} from 'cinefy-ui/components';
import {
  compareSeatPositions,
  seatRowLabel,
  SEAT_CATEGORY_LABEL,
  type Seat,
  type SeatCategory,
} from 'cinefy-ui/types';
import { CinefyToastService } from 'cinefy-ui/services';
import { skipErrorToast } from '../../../app/core/interceptors';
import { BookingService, ShowtimeEventsService } from '../../../services';
import { BookingTicketComponent } from '../booking-ticket/booking-ticket';
import {
  CheckIcon,
  ClockIcon,
  InfoIcon,
  TicketIcon,
  TicketXIcon,
  WarningIcon,
  XIcon,
} from '../../../shared/icons';
import type {
  ActiveBooking,
  ApiError,
  BookedSeat,
  BookingConfirmation,
  BookingRequest,
  ShowtimeHallLayout,
  ShowtimeSeatLayout,
  ShowtimeSeatSelection,
  StaffPaymentRequest,
} from '../../../shared/types';

const PAYMENT_TYPE_ENTRIES = [
  { value: true, label: 'Cash' },
  { value: false, label: 'Card' },
];

function seatCategory(id: string, layout: ShowtimeSeatLayout): SeatCategory {
  if (layout.categories.AISLE?.includes(id)) return 'AISLE';
  if (layout.categories.VIP?.includes(id)) return 'VIP';
  return 'NORMAL';
}

function buildHall(hallLayout: ShowtimeHallLayout, bookedSeats: Set<string>): Seat[][] {
  const { numberOfRows, seatsPerRow, layout } = hallLayout;
  return Array.from({ length: numberOfRows }, (_, rowIdx) => {
    const row = seatRowLabel(rowIdx);
    return Array.from({ length: seatsPerRow }, (_, colIdx) => {
      const number = colIdx + 1;
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

@Component({
  selector: 'book-seats',
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    LucideDynamicIcon,
    CinefySeatMap,
    CinefyLoadingSpinner,
    CinefyEmptyState,
    CinefySelect,
    CinefyInput,
    CinefyDialog,
    CinefyDialogFooter,
    CinefyHoldTimer,
    BookingTicketComponent,
  ],
  templateUrl: './book-seats.html',
  styleUrl: './book-seats.scss',
})
export class BookSeatsComponent {
  protected readonly icons = {
    CheckIcon,
    ClockIcon,
    InfoIcon,
    TicketIcon,
    TicketXIcon,
    WarningIcon,
    XIcon,
  };

  private readonly bookingService = inject(BookingService);
  private readonly showtimeEvents = inject(ShowtimeEventsService);
  private readonly toastService = inject(CinefyToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly seatCategoryLabel = SEAT_CATEGORY_LABEL;
  protected readonly paymentTypeEntries = PAYMENT_TYPE_ENTRIES;

  readonly showtimeId = input.required<string>();
  readonly container = input<PrimeAppendTo>(null);
  readonly showBookMoreSeats = input(true);

  protected readonly booking = signal(false);
  protected readonly cancelVisible = signal(false);
  protected readonly expiredVisible = signal(false);
  protected readonly canceling = signal(false);
  protected readonly settling = signal(false);
  protected readonly issuedTicket = signal<BookingConfirmation | null>(null);

  protected readonly paymentForm = new FormGroup({
    isCash: new FormControl<boolean | null>(null, {
      validators: [Validators.required],
    }),
    transactionId: new FormControl('', { nonNullable: true }),
  });

  protected readonly seatSelection = signal<ShowtimeSeatSelection | null>(null);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly initialLoading = computed(() => this.loading() && !this.seatSelection());
  protected readonly reloading = computed(() => this.loading() && !!this.seatSelection());

  protected readonly activeBooking = linkedSignal<ActiveBooking | null>(
    () => this.seatSelection()?.activeBooking ?? null,
  );

  protected readonly stage = linkedSignal<'seats' | 'payment' | 'done'>(() =>
    this.activeBooking() ? 'payment' : 'seats',
  );

  private readonly prices = computed<Partial<Record<SeatCategory, number>>>(() => {
    const pricing = this.seatSelection()?.hallLayout.ticketPricing ?? [];
    return pricing.reduce<Partial<Record<SeatCategory, number>>>(
      (acc, { seatCategory, price }) => ({ ...acc, [seatCategory]: price }),
      {},
    );
  });

  protected readonly bookedSeats = signal<BookedSeat[]>([]);

  protected readonly selectedSeats = linkedSignal<BookedSeat[]>(() => this.bookedSeats());

  protected readonly bookedSeatIds = computed(() =>
    this.bookedSeats().map((seat) => seat.position),
  );

  protected readonly selectedSeatIds = computed(() =>
    this.selectedSeats().map((seat) => seat.position),
  );

  protected readonly hall = computed<Seat[][]>(() => {
    const layout = this.seatSelection()?.hallLayout;
    return layout ? buildHall(layout, new Set(this.bookedSeatIds())) : [];
  });

  protected readonly pricedSeats = computed<BookedSeat[]>(() =>
    [...this.selectedSeats()].sort((a, b) => compareSeatPositions(a.position, b.position)),
  );

  protected readonly selectionChanged = computed(() => {
    const selected = this.selectedSeatIds();
    if (!selected.length) return false;

    const booked = new Set(this.bookedSeatIds());
    return selected.length !== booked.size || selected.some((position) => !booked.has(position));
  });

  protected readonly total = computed(() =>
    this.pricedSeats().reduce((sum, { price }) => sum + price, 0),
  );

  constructor() {
    this.paymentForm.controls.isCash.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isCash) => {
        const transactionId = this.paymentForm.controls.transactionId;
        transactionId.reset('');
        transactionId.setValidators(isCash ? [] : [Validators.required]);
        transactionId.updateValueAndValidity();
      });

    effect(() => {
      if (this.settling()) {
        this.paymentForm.disable({ emitEvent: false });
      } else {
        this.paymentForm.enable({ emitEvent: false });
      }
    });

    afterNextRender(() => this.loadSeatSelection());
  }

  private loadSeatSelection(): void {
    this.loading.set(true);
    this.bookingService
      .getSeatSelection(this.showtimeId(), skipErrorToast())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (seatSelection) => {
          this.seatSelection.set(seatSelection);
          this.errorMessage.set(null);
          this.loading.set(false);
          this.seedBookedSeats(seatSelection);
          this.showtimeEvents.notifyShowtimeOccupancyChanged(
            this.showtimeId(),
            seatSelection.hallLayout.layout.booked.length,
            seatSelection.activeBooking?.seats.length ?? 0,
          );
        },
        error: (error: unknown) => {
          const message =
            error instanceof HttpErrorResponse ? (error.error as ApiError)?.message : null;
          this.errorMessage.set(
            message ??
              "Something went wrong while loading this showtime's seats. Please try again.",
          );
          this.loading.set(false);
        },
      });
  }

  private seedBookedSeats(seatSelection: ShowtimeSeatSelection): void {
    const seats = seatSelection.activeBooking?.seats;
    if (!seats || this.bookedSeats().length) return;

    const { layout } = seatSelection.hallLayout;
    this.bookedSeats.set(
      seats.map((position) => {
        const category = seatCategory(position, layout);
        return { position, category, price: this.prices()[category] ?? 0 };
      }),
    );
  }

  protected onSelectionChange(seats: Seat[]): void {
    this.selectedSeats.set(
      seats.map((seat) => ({
        position: seat.id,
        category: seat.category,
        price: this.prices()[seat.category] ?? 0,
      })),
    );
  }

  protected onBook(): void {
    const request: BookingRequest = {
      showtimeId: this.showtimeId(),
      seats: this.selectedSeatIds(),
    };
    const idempotencyKey = crypto.randomUUID();

    this.booking.set(true);
    this.bookingService
      .createBooking(request, idempotencyKey)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detail) => {
          const updated = this.stage() === 'payment';
          this.booking.set(false);
          this.bookedSeats.set(detail.seats);
          this.activeBooking.set({
            id: detail.id,
            seats: request.seats,
            expiresAt: detail.expiresAt,
          });
          this.loadSeatSelection();
          this.stage.set('payment');
          this.toastService.success(
            updated ? 'Booking updated successfully' : 'Seats booked successfully',
          );
        },
        error: () => this.booking.set(false),
      });
  }

  protected completePayment(): void {
    const booking = this.activeBooking();
    const { isCash, transactionId } = this.paymentForm.getRawValue();
    if (!booking || isCash === null || this.settling()) return;

    const request: StaffPaymentRequest = {
      isCash,
      ...(isCash ? {} : { transactionId: transactionId.trim() }),
    };

    this.settling.set(true);
    this.bookingService
      .settlePayment(booking.id, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (confirmation) => {
          this.settling.set(false);
          this.issuedTicket.set(confirmation);
          this.stage.set('done');
          this.showtimeEvents.notifyShowtimeOccupancyChanged(
            this.showtimeId(),
            this.seatSelection()?.hallLayout.layout.booked.length ?? 0,
            0,
          );
        },
        error: () => this.settling.set(false),
      });
  }

  protected cancelPayment(): void {
    const booking = this.activeBooking();
    if (!booking || this.canceling()) return;

    this.canceling.set(true);
    this.bookingService
      .cancelBooking(booking.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.canceling.set(false);
          this.resetBooking();
          this.cancelVisible.set(false);
          this.toastService.success('Booking canceled successfully');
        },
        error: () => this.canceling.set(false),
      });
  }

  protected onTimerExpired(): void {
    this.expiredVisible.set(true);
  }

  protected onExpiredClosed(): void {
    this.expiredVisible.set(false);
    this.resetBooking();
  }

  protected resetBooking(): void {
    this.bookedSeats.set([]);
    this.activeBooking.set(null);
    this.issuedTicket.set(null);
    this.paymentForm.reset({ isCash: null, transactionId: '' });
    this.stage.set('seats');
    this.loadSeatSelection();
  }
}
