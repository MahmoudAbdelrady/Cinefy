import { Component, computed, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  EmptyStateComponent,
  MediaImageComponent,
  PaginationComponent,
} from 'cinefy-ui/components';
import { ClapperboardIcon, ClockIcon, TicketIcon } from '../../../shared/icons';
import type { BookingConfirmation } from '../../../shared/types';

const PAGE_SIZE = 5;

const MOCK_PAST_BOOKINGS: BookingConfirmation[] = [
  {
    id: 'bk-2310',
    paymentState: 'CONFIRMED',
    bookingReference: 'PYG64BWVM2',
    movie: {
      id: 693134,
      title: 'Dune: Part Two',
      posterUrl: 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
    },
    startDateTime: '2026-07-28T19:30:00',
    hallName: 'Hall 3',
    hallType: 'IMAX',
    is3D: false,
    seats: [
      { position: 'L1', category: 'VIP', price: 220 },
      { position: 'L2', category: 'VIP', price: 220 },
      { position: 'L3', category: 'VIP', price: 220 },
      { position: 'L4', category: 'VIP', price: 220 },
      { position: 'L5', category: 'VIP', price: 220 },
      { position: 'L6', category: 'VIP', price: 220 },
      { position: 'L7', category: 'VIP', price: 220 },
      { position: 'M1', category: 'NORMAL', price: 150 },
      { position: 'M2', category: 'NORMAL', price: 150 },
      { position: 'M3', category: 'NORMAL', price: 150 },
      { position: 'M4', category: 'NORMAL', price: 150 },
      { position: 'M5', category: 'NORMAL', price: 150 },
      { position: 'M6', category: 'NORMAL', price: 150 },
      { position: 'M7', category: 'NORMAL', price: 150 },
    ],
    totalPrice: 2590,
  },
  {
    id: 'bk-2287',
    paymentState: 'REFUNDED',
    bookingReference: 'K3MQ8ZTR41',
    movie: {
      id: 872585,
      title: 'Oppenheimer',
      posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    },
    startDateTime: '2026-07-14T21:00:00',
    hallName: 'Hall 1',
    hallType: 'Standard',
    is3D: false,
    seats: [
      { position: 'D5', category: 'NORMAL', price: 150 },
      { position: 'D6', category: 'NORMAL', price: 150 },
    ],
    totalPrice: 300,
  },
  {
    id: 'bk-2251',
    paymentState: 'CONFIRMED',
    bookingReference: 'QW7NF2LDX9',
    movie: {
      id: 1022789,
      title: 'Inside Out 2',
      posterUrl: 'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
    },
    startDateTime: '2026-06-30T16:15:00',
    hallName: 'Hall 2',
    hallType: '3D',
    is3D: true,
    seats: [
      { position: 'F8', category: 'NORMAL', price: 150 },
      { position: 'F9', category: 'NORMAL', price: 150 },
      { position: 'F10', category: 'NORMAL', price: 150 },
    ],
    totalPrice: 450,
  },
  {
    id: 'bk-2203',
    paymentState: 'CONFIRMED',
    bookingReference: 'RT5VB8KJC6',
    movie: {
      id: 653346,
      title: 'Kingdom of the Planet of the Apes',
      posterUrl: 'https://image.tmdb.org/t/p/w500/gKkl37BQuKTanygYQG1pyYgLVgf.jpg',
    },
    startDateTime: '2026-06-11T20:45:00',
    hallName: 'Hall 4',
    hallType: 'IMAX',
    is3D: false,
    seats: [
      { position: 'H2', category: 'VIP', price: 220 },
      { position: 'H3', category: 'VIP', price: 220 },
    ],
    totalPrice: 440,
  },
  {
    id: 'bk-2176',
    paymentState: 'CONFIRMED',
    bookingReference: 'ZX9CD4NMH2',
    movie: {
      id: 940721,
      title: 'Godzilla Minus One',
      posterUrl: 'https://image.tmdb.org/t/p/w500/hkxxMIGaiCTmrEArK7J56JTKUlB.jpg',
    },
    startDateTime: '2026-05-29T18:00:00',
    hallName: 'Hall 1',
    hallType: 'Standard',
    is3D: false,
    seats: [{ position: 'C4', category: 'NORMAL', price: 150 }],
    totalPrice: 150,
  },
  {
    id: 'bk-2140',
    paymentState: 'REFUNDED',
    bookingReference: 'LM2PK7WQV5',
    movie: {
      id: 787699,
      title: 'Wonka',
      posterUrl: 'https://image.tmdb.org/t/p/w500/qhb1qOilapbapxWQn9jtRCMwXJF.jpg',
    },
    startDateTime: '2026-05-17T14:30:00',
    hallName: 'Hall 2',
    hallType: 'Standard',
    is3D: false,
    seats: [
      { position: 'B7', category: 'NORMAL', price: 150 },
      { position: 'B8', category: 'NORMAL', price: 150 },
    ],
    totalPrice: 300,
  },
  {
    id: 'bk-2098',
    paymentState: 'CONFIRMED',
    bookingReference: 'HN6TY3RBF8',
    movie: {
      id: 447365,
      title: 'Guardians of the Galaxy Vol. 3',
      posterUrl: 'https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg',
    },
    startDateTime: '2026-05-02T19:15:00',
    hallName: 'Hall 3',
    hallType: '3D',
    is3D: true,
    seats: [
      { position: 'G1', category: 'NORMAL', price: 150 },
      { position: 'G2', category: 'NORMAL', price: 150 },
      { position: 'G3', category: 'NORMAL', price: 150 },
      { position: 'G4', category: 'NORMAL', price: 150 },
    ],
    totalPrice: 600,
  },
];

@Component({
  selector: 'profile-history',
  imports: [
    CurrencyPipe,
    DatePipe,
    LucideDynamicIcon,
    MediaImageComponent,
    EmptyStateComponent,
    PaginationComponent,
  ],
  templateUrl: './profile-history.html',
  styleUrl: './profile-history.scss',
})
export class ProfileHistoryComponent {
  protected readonly icons = {
    ClockIcon,
    ClapperboardIcon,
    TicketIcon,
  };

  protected readonly pageSize = PAGE_SIZE;

  protected readonly bookings = signal<BookingConfirmation[]>(MOCK_PAST_BOOKINGS);
  protected readonly page = signal(1);

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.bookings().length / PAGE_SIZE)),
  );

  protected readonly pageRows = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.bookings().slice(start, start + PAGE_SIZE);
  });

  protected isRefunded(booking: BookingConfirmation): boolean {
    return booking.paymentState === 'REFUNDED';
  }
}
