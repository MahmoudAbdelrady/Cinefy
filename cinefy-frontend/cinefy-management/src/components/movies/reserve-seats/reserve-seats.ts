import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgpDialogManager, NgpDialogTrigger } from 'ng-primitives/dialog';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  CustomSelectComponent,
  EmptyStateComponent,
  HoldTimerComponent,
  InputField,
  LoadingSpinnerComponent,
  ModalComponent,
  SeatMapComponent,
} from 'cinefy-ui/components';
import { SEAT_CATEGORY_LABEL, type Seat, type SeatCategory } from 'cinefy-ui/types';
import { BookingService } from '../../../services';
import { comparePositions } from '../../halls/seat-layout';
import {
  CheckIcon,
  ClockIcon,
  InfoIcon,
  TicketIcon,
  WarningIcon,
  XIcon,
} from '../../../shared/icons';
import type {
  ActiveBooking,
  BookedSeat,
  BookingRequest,
  PaymentType,
  ShowtimeHallLayout,
  ShowtimeSeatLayout,
  StaffPaymentRequest,
} from '../../../shared/types';

interface PaymentTypeEntry {
  value: PaymentType;
  label: string;
}

const PAYMENT_TYPE_ENTRIES: PaymentTypeEntry[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
];

function seatCategory(id: string, layout: ShowtimeSeatLayout): SeatCategory {
  if (layout.categories.AISLE?.includes(id)) return 'AISLE';
  if (layout.categories.VIP?.includes(id)) return 'VIP';
  return 'NORMAL';
}

function buildHall(hallLayout: ShowtimeHallLayout, bookedSeats: Set<string>): Seat[][] {
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
        taken: layout.reserved.includes(id) && !bookedSeats.has(id),
      };
    });
  });
}

@Component({
  selector: 'reserve-seats',
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    NgpDialogTrigger,
    LucideDynamicIcon,
    SeatMapComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    CustomSelectComponent,
    InputField,
    ModalComponent,
    HoldTimerComponent,
  ],
  templateUrl: './reserve-seats.html',
  styleUrl: './reserve-seats.scss',
})
export class ReserveSeatsComponent {
  protected readonly icons = {
    CheckIcon,
    ClockIcon,
    InfoIcon,
    TicketIcon,
    WarningIcon,
    XIcon,
  };

  private readonly bookingService = inject(BookingService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogManager = inject(NgpDialogManager);

  protected readonly expiredDialog = viewChild.required<TemplateRef<unknown>>('expiredDialog');

  protected readonly seatCategoryLabel = SEAT_CATEGORY_LABEL;
  protected readonly paymentTypeEntries = PAYMENT_TYPE_ENTRIES;

  readonly showtimeId = input.required<string>();
  readonly container = input<string | HTMLElement | null>(null);

  protected readonly booking = signal(false);
  protected readonly cancelling = signal(false);

  protected readonly paymentForm = new FormGroup({
    paymentType: new FormControl<PaymentType | null>(null, {
      validators: [Validators.required],
    }),
    paidAmount: new FormControl<number | null>(null),
    paymentReference: new FormControl('', { nonNullable: true }),
  });

  private readonly seatSelectionResource = rxResource({
    params: () => this.showtimeId(),
    stream: ({ params: showtimeId }) => this.bookingService.getSeatSelection(showtimeId),
  });

  protected readonly failed = computed(() => !!this.seatSelectionResource.error());
  protected readonly seatSelection = computed(() => this.seatSelectionResource.value());

  protected readonly initialLoading = computed(
    () => this.seatSelectionResource.isLoading() && !this.seatSelection(),
  );
  protected readonly reloading = computed(
    () => this.seatSelectionResource.isLoading() && !!this.seatSelection(),
  );

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

  protected readonly hall = computed<Seat[][]>(() => {
    const layout = this.seatSelection()?.hallLayout;
    return layout ? buildHall(layout, new Set(this.bookedSeatIds())) : [];
  });

  protected readonly pricedSeats = computed<BookedSeat[]>(() =>
    [...this.selectedSeats()].sort((a, b) => comparePositions(a.position, b.position)),
  );

  protected readonly total = computed(() =>
    this.pricedSeats().reduce((sum, { price }) => sum + price, 0),
  );

  private readonly paidAmount = toSignal(this.paymentForm.controls.paidAmount.valueChanges);

  protected readonly change = computed(() => {
    const paid = this.paidAmount();
    if (paid === null || paid === undefined) return null;
    const due = this.total();
    return paid >= due ? paid - due : null;
  });

  protected readonly paymentTypeLabel = (entry: PaymentTypeEntry) => entry.label;
  protected readonly paymentTypeValue = (entry: PaymentTypeEntry) => entry.value;

  constructor() {
    effect(() => {
      const layout = this.seatSelection()?.hallLayout;
      const seats = this.activeBooking()?.seats;
      if (!layout || !seats || untracked(this.bookedSeats).length) return;

      this.bookedSeats.set(
        seats.map((position) => {
          const category = seatCategory(position, layout.layout);
          return { position, category, price: this.prices()[category] ?? 0 };
        }),
      );
    });
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
      seats: this.selectedSeats().map((seat) => seat.position),
    };
    const idempotencyKey = crypto.randomUUID();

    this.booking.set(true);
    this.bookingService
      .createBooking(request, idempotencyKey)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detail) => {
          this.booking.set(false);
          this.bookedSeats.set(detail.seats);
          this.activeBooking.set({
            id: detail.id,
            seats: request.seats,
            expiresAt: detail.expiresAt,
          });
          this.seatSelectionResource.reload();
          this.stage.set('payment');
        },
        error: () => this.booking.set(false),
      });
  }

  protected onPaymentTypeChange(entry: PaymentTypeEntry): void {
    const { paymentType, paidAmount, paymentReference } = this.paymentForm.controls;
    const isCash = entry.value === 'CASH';

    paymentType.setValue(entry.value);

    paidAmount.reset(null);
    paymentReference.reset('');

    paidAmount.setValidators(isCash ? [Validators.required, Validators.min(this.total())] : []);
    paymentReference.setValidators(isCash ? [] : [Validators.required]);

    paidAmount.updateValueAndValidity();
    paymentReference.updateValueAndValidity();
  }

  protected completePayment(): void {
    const booking = this.activeBooking();
    const { paymentType, paidAmount, paymentReference } = this.paymentForm.getRawValue();
    if (!booking || !paymentType) return;

    const request: StaffPaymentRequest = {
      paymentType,
      ...(paymentType === 'CASH'
        ? { paidAmount: paidAmount ?? 0 }
        : { paymentReference: paymentReference.trim() }),
    };

    // TODO: Call backend

    this.stage.set('done');
  }

  protected cancelPayment(close: () => void): void {
    const booking = this.activeBooking();
    if (!booking || this.cancelling()) return;

    this.cancelling.set(true);
    this.bookingService
      .cancelBooking(booking.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.cancelling.set(false);
          this.resetBooking();
          close();
        },
        error: () => this.cancelling.set(false),
      });
  }

  protected onTimerExpired(): void {
    const dialogRef = this.dialogManager.open(this.expiredDialog() as never);
    dialogRef.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.resetBooking());
  }

  protected resetBooking(): void {
    this.bookedSeats.set([]);
    this.activeBooking.set(null);
    this.paymentForm.reset({ paymentType: null, paidAmount: null, paymentReference: '' });
    this.stage.set('seats');
    this.seatSelectionResource.reload();
  }
}
