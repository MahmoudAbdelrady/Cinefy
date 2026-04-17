import { Component, computed, input, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ModalComponent } from '../../modal/modal';
import { Movie, MovieShowtimeDetail, MovieShowtimes } from '../../../shared/types';
import { NgpTabButton, NgpTabList, NgpTabPanel, NgpTabset } from 'ng-primitives/tabs';
import { MapPin, LucideAngularModule, SquarePen, Trash2, Plus, Eye } from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';

@Component({
  selector: 'movie-showtimes-modal',
  imports: [
    ModalComponent,
    NgpTabset,
    NgpTabList,
    NgpTabButton,
    NgpTabPanel,
    DatePipe,
    DecimalPipe,
    LucideAngularModule,
    NgpButton,
  ],
  templateUrl: './movie-showtimes-modal.html',
  styleUrl: './movie-showtimes-modal.scss',
})
export class MovieShowtimesModal {
  protected readonly LocationIcon = MapPin;
  protected readonly EditIcon = SquarePen;
  protected readonly DeleteIcon = Trash2;
  protected readonly PlusIcon = Plus;
  protected readonly EyeIcon = Eye;

  readonly close = input.required<() => void>();
  readonly selectedMovie = input.required<Movie>();

  protected readonly movieShowtimes: MovieShowtimes = {
    dates: ['2026-04-15', '2026-04-16', '2026-04-17', '2026-04-18'],
    totalDraftShowtimes: 5,
  };

  protected readonly movieShowtimeDetails: MovieShowtimeDetail[] = [
    {
      id: '1',
      hallName: 'Hall A',
      status: 'Published',
      time: '14:00',
      specialNotes: '',
      occupiedSeats: 72,
      totalSeats: 120,
    },
    {
      id: '2',
      hallName: 'IMAX Hall',
      status: 'Published',
      time: '17:30',
      specialNotes: 'Premium seating',
      occupiedSeats: 148,
      totalSeats: 180,
    },
    {
      id: '3',
      hallName: 'Hall B',
      status: 'Draft',
      time: '20:00',
      specialNotes: '',
      occupiedSeats: 0,
      totalSeats: 100,
    },
    {
      id: '4',
      hallName: 'Hall C',
      status: 'Published',
      time: '22:30',
      specialNotes: 'Late-night show',
      occupiedSeats: 34,
      totalSeats: 90,
    },
    {
      id: '5',
      hallName: 'Hall A',
      status: 'Draft',
      time: '23:45',
      specialNotes: '',
      occupiedSeats: 0,
      totalSeats: 120,
    },
  ];

  protected selectedTab = signal<string>(this.movieShowtimes.dates[0]);

  protected readonly dayDrafts = computed(
    () => this.movieShowtimeDetails.filter((showtime) => showtime.status === 'Draft').length,
  );
  protected readonly otherDrafts = computed(
    () => this.movieShowtimes.totalDraftShowtimes - this.dayDrafts(),
  );
  protected readonly hasDayDrafts = computed(() => this.dayDrafts() > 0);
  protected readonly hasOtherDrafts = computed(() => this.otherDrafts() > 0);
}
