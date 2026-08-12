import { Component, computed, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { LucideDynamicIcon } from '@lucide/angular';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import {
  EmptyStateComponent,
  MediaImageComponent,
  ModalComponent,
  PaginationComponent,
} from 'cinefy-ui/components';
import { ClapperboardIcon, ClockIcon, TicketIcon } from '../../../shared/icons';
import type { BookingConfirmation } from '../../../shared/types';

const PAGE_SIZE = 5;

const PLACEHOLDER_QR_CODE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 29" shape-rendering="crispEdges">
      <rect width="29" height="29" fill="#fff"/>
      <g fill="#000">
        <path d="M1 1h7v7H1zM2 2v5h5V2z"/><path d="M3 3h3v3H3z"/>
        <path d="M21 1h7v7h-7zM22 2v5h5V2z"/><path d="M23 3h3v3h-3z"/>
        <path d="M1 21h7v7H1zM2 22v5h5v-5z"/><path d="M3 23h3v3H3z"/>
        <path d="M10 1h1v1h-1zM12 1h1v2h-1zM14 1h2v1h-2zM17 1h1v3h-1z"/>
        <path d="M10 3h2v1h-2zM13 4h2v1h-2zM16 5h2v1h-2zM10 6h3v1h-3z"/>
        <path d="M14 6h1v2h-1zM16 7h2v1h-2zM11 8h1v2h-1zM13 8h2v1h-2z"/>
        <path d="M1 10h2v1H1zM4 10h1v2H4zM6 10h2v1H6zM9 10h1v3H9z"/>
        <path d="M11 10h3v1h-3zM15 10h1v2h-1zM17 10h2v1h-2zM20 10h1v3h-1z"/>
        <path d="M22 10h2v1h-2zM25 10h1v2h-1zM27 10h1v1h-1zM1 12h1v2H1z"/>
        <path d="M3 12h2v1H3zM6 12h1v2H6zM8 12h2v1H8zM11 13h2v1h-2z"/>
        <path d="M14 12h1v2h-1zM16 13h2v1h-2zM19 12h1v2h-1zM21 13h3v1h-3z"/>
        <path d="M25 13h1v2h-1zM27 12h1v2h-1zM1 15h3v1H1zM5 15h1v2H5z"/>
        <path d="M7 15h2v1H7zM10 15h1v2h-1zM12 16h2v1h-2zM15 15h2v1h-2z"/>
        <path d="M18 15h1v2h-1zM20 16h2v1h-2zM23 15h2v1h-2zM26 15h2v1h-2z"/>
        <path d="M2 17h2v1H2zM6 18h1v1H6zM9 17h2v1H9zM13 17h1v2h-1z"/>
        <path d="M16 17h1v2h-1zM19 18h2v1h-2zM22 17h1v2h-1zM25 17h2v1h-2z"/>
        <path d="M10 21h1v2h-1zM12 21h3v1h-3zM16 21h2v1h-2zM19 21h1v3h-1z"/>
        <path d="M21 21h2v1h-2zM24 21h1v2h-1zM26 21h2v1h-2zM11 23h2v1h-2z"/>
        <path d="M14 23h1v2h-1zM17 23h2v1h-2zM21 23h1v2h-1zM23 24h2v1h-2z"/>
        <path d="M26 23h2v1h-2zM10 25h2v1h-2zM13 25h1v2h-1zM15 25h2v1h-2z"/>
        <path d="M18 25h1v2h-1zM20 25h2v1h-2zM23 26h2v1h-2zM26 25h2v1h-2z"/>
        <path d="M11 27h3v1h-3zM15 27h1v1h-1zM17 27h2v1h-2zM21 27h2v1h-2z"/>
      </g>
    </svg>`,
  );

const MOCK_PAST_BOOKINGS: BookingConfirmation[] = [
  {
    id: 'bk-2310',
    paymentState: 'CONFIRMED',
    bookingReference: 'PYG64BWVM2',
    qrCode: PLACEHOLDER_QR_CODE,
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
    qrCode: PLACEHOLDER_QR_CODE,
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
    qrCode: PLACEHOLDER_QR_CODE,
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
    qrCode: PLACEHOLDER_QR_CODE,
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
    qrCode: PLACEHOLDER_QR_CODE,
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
    NgpDialogTrigger,
    MediaImageComponent,
    ModalComponent,
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
