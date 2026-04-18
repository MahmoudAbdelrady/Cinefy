import { Component, computed, input, output, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ModalComponent } from '../../modal/modal';
import {
  EditableShowtime,
  Movie,
  MovieShowtimeDetail,
  MovieShowtimes,
} from '../../../shared/types';
import { NgpTabButton, NgpTabList, NgpTabPanel, NgpTabset } from 'ng-primitives/tabs';
import {
  MapPin,
  LucideAngularModule,
  SquarePen,
  Trash2,
  Plus,
  Eye,
  TriangleAlert,
} from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';
import { NgpDialogTrigger } from 'ng-primitives/dialog';

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
    NgpDialogTrigger,
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
  protected readonly AlertIcon = TriangleAlert;

  readonly close = input.required<() => void>();
  readonly selectedMovie = input.required<Movie>();
  readonly addShowtimeRequested = output<void>();
  readonly editShowtimeRequested = output<EditableShowtime>();

  protected onAddShowtime() {
    this.addShowtimeRequested.emit();
  }

  protected onEditShowtime(showtime: MovieShowtimeDetail) {
    this.editShowtimeRequested.emit({
      id: showtime.id,
      date: new Date(this.selectedTab()),
      time: showtime.time,
      hall: showtime.hall,
      specialNotes: showtime.specialNotes,
    });
  }

  protected onDeleteShowtime(_id: string, close: () => void) {
    close();
  }

  protected readonly movieShowtimes: MovieShowtimes = {
    dates: ['2026-04-15', '2026-04-16', '2026-04-17', '2026-04-18'],
    totalDraftShowtimes: 5,
  };

  protected readonly movieShowtimeDetails: MovieShowtimeDetail[] = [
    {
      id: '1',
      hall: { id: 'h1', name: 'Hall A' },
      status: 'Published',
      time: '14:00',
      specialNotes: '',
      occupiedSeats: 72,
      totalSeats: 120,
    },
    {
      id: '2',
      hall: { id: 'h2', name: 'IMAX Hall' },
      status: 'Published',
      time: '17:30',
      specialNotes: 'Premium seating',
      occupiedSeats: 148,
      totalSeats: 180,
    },
    {
      id: '3',
      hall: { id: 'h3', name: 'Hall B' },
      status: 'Draft',
      time: '20:00',
      specialNotes: '',
      occupiedSeats: 0,
      totalSeats: 100,
    },
    {
      id: '4',
      hall: { id: 'h4', name: 'Hall C' },
      status: 'Published',
      time: '22:30',
      specialNotes: 'Late-night show',
      occupiedSeats: 34,
      totalSeats: 90,
    },
    {
      id: '5',
      hall: { id: 'h1', name: 'Hall A' },
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
