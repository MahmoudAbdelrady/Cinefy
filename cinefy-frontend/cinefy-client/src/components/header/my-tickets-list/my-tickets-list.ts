import { Component, computed, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { LucideDynamicIcon } from '@lucide/angular';
import { EmptyStateComponent, ModalComponent } from 'cinefy-ui/components';
import { CalendarIcon, GlassesIcon, TicketIcon, ArrowRightIcon } from '../../../shared/icons';

interface Booking {
  id: string;
  movieTitle: string;
  moviePosterUrl: string;
  bookingDate: string;
  bookingTime: string;
  is3D: boolean;
  totalTickets: number;
  totalPrice: number;
}

@Component({
  selector: 'my-tickets-list',
  imports: [LucideDynamicIcon, ModalComponent, EmptyStateComponent, CurrencyPipe],
  templateUrl: './my-tickets-list.html',
  styleUrl: './my-tickets-list.scss',
})
export class MyTicketsListComponent {
  protected readonly icons = {
    CalendarIcon,
    GlassesIcon,
    TicketIcon,
    ArrowRightIcon,
  };

  readonly close = input.required<() => void>();

  protected readonly myBookings: Booking[] = [
    {
      id: 'bk-3391',
      movieTitle: 'Deadpool & Wolverine',
      moviePosterUrl: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
      bookingDate: 'Today',
      bookingTime: '2:30 PM',
      is3D: true,
      totalTickets: 2,
      totalPrice: 30.0,
    },
    {
      id: 'bk-3370',
      movieTitle: 'Inside Out 2',
      moviePosterUrl: 'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
      bookingDate: 'Today',
      bookingTime: '3:30 PM',
      is3D: false,
      totalTickets: 4,
      totalPrice: 40.0,
    },
  ];

  protected readonly description = computed(() => {
    const count = this.myBookings.length;
    return count
      ? `${count} booking${count > 1 ? 's' : ''} to complete`
      : 'No bookings in progress';
  });
}
