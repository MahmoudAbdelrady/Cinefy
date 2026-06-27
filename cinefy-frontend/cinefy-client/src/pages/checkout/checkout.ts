import { Component, computed, signal } from '@angular/core';
import { afterNextRender } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { LucideDynamicIcon } from '@lucide/angular';
import { InputField, MediaImageComponent, ModalComponent } from 'cinefy-ui/components';
import {
  ArrowLeftIcon,
  ClockIcon,
  CreditCardIcon,
  LockIcon,
  TriangleAlertIcon,
  XIcon,
} from '../../shared/icons';

const FEE_CENTS = 150;
const HOLD_SECONDS = 10 * 60;

interface CheckoutSummary {
  movieId: number;
  movieTitle: string;
  posterUrl: string;
  hall: string;
  format: string;
  date: string;
  time: string;
  runtime: string;
  seats: string[];
  seatPriceCents: number;
}

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

@Component({
  selector: 'checkout-page',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    NgpDialogTrigger,
    LucideDynamicIcon,
    InputField,
    MediaImageComponent,
    ModalComponent,
    CurrencyPipe,
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class CheckoutPage {
  protected readonly icons = {
    ArrowLeftIcon,
    ClockIcon,
    CreditCardIcon,
    LockIcon,
    TriangleAlertIcon,
    XIcon,
  };

  protected readonly summary: CheckoutSummary = {
    movieId: 1,
    movieTitle: 'Dune: Part Two',
    posterUrl: 'https://image.tmdb.org/t/p/w342/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    hall: 'Hall 3',
    format: 'IMAX',
    date: 'Sat, Jun 28, 2026',
    time: '7:30 PM',
    runtime: '2h 46m',
    seats: ['F7', 'F8', 'F9'],
    seatPriceCents: 1800,
  };

  protected readonly paymentForm = new FormGroup({
    cardholder: new FormControl('', { nonNullable: true }),
    cardNumber: new FormControl('', { nonNullable: true }),
    expiry: new FormControl('', { nonNullable: true }),
    cvc: new FormControl('', { nonNullable: true }),
  });

  protected readonly processing = signal(false);
  protected readonly cancelled = signal(false);
  protected readonly secondsLeft = signal(HOLD_SECONDS);

  protected readonly expiring = computed(() => this.secondsLeft() <= 60);
  protected readonly countdown = computed(() => formatCountdown(this.secondsLeft()));

  protected readonly seatsSubtotalCents = computed(
    () => this.summary.seats.length * this.summary.seatPriceCents,
  );
  protected readonly feesCents = computed(() => this.summary.seats.length * FEE_CENTS);
  protected readonly totalCents = computed(() => this.seatsSubtotalCents() + this.feesCents());

  protected readonly seatsLabel = computed(() => this.summary.seats.join(' · '));

  constructor() {
    afterNextRender(() => {
      const id = setInterval(() => {
        if (this.cancelled() || this.secondsLeft() <= 0) {
          clearInterval(id);
          return;
        }
        this.secondsLeft.update((s) => Math.max(0, s - 1));
      }, 1000);
    });
  }

  protected confirmCancel(): void {
    this.cancelled.set(true);
  }
}
