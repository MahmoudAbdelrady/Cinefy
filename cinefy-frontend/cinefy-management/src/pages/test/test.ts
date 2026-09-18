import { Component, signal } from '@angular/core';
import { CinefyDialog } from 'cinefy-ui/components';
import { BookingTicketComponent } from '../../components';
import type { BookingConfirmation } from '../../shared/types';

const MOCK_TICKET: BookingConfirmation = {
  id: 'mock-booking-1',
  paymentState: 'CONFIRMED',
  bookingReference: 'WBLT5Y3L7S',
  movie: {
    id: 1,
    title: 'The Odyssey',
  },
  startDateTime: '2026-09-11T12:00:00',
  hallName: 'Imax Hall',
  hallType: 'Imax',
  is3D: false,
  seats: [
    { position: 'D4', category: 'NORMAL', price: 225 },
    { position: 'E2', category: 'VIP', price: 280 },
    { position: 'E3', category: 'VIP', price: 280 },
    { position: 'E4', category: 'VIP', price: 280 },
    { position: 'E5', category: 'VIP', price: 280 },
  ],
  totalPrice: 1345,
};

@Component({
  selector: 'test-page',
  imports: [CinefyDialog, BookingTicketComponent],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class TestPage {
  protected readonly mockTicket = MOCK_TICKET;

  protected readonly singleDialogVisible = signal(false);

  protected readonly outerDialogVisible = signal(false);

  protected readonly innerDialogVisible = signal(false);
}
