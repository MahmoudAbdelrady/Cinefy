import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ModalComponent } from '../../modal/modal';
import {
  EditableShowtime,
  MovieDetail,
  MovieShowtimeDatesResponse,
  MovieShowtimeListItem,
  SHOWTIME_STATUS_LABELS,
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
  StickyNote,
} from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { ShowtimesService, ToastService } from '../../../services';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';

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
    LoadingSpinnerComponent,
  ],
  templateUrl: './movie-showtimes-modal.html',
  styleUrl: './movie-showtimes-modal.scss',
})
export class MovieShowtimesModal {
  protected readonly statusLabels = SHOWTIME_STATUS_LABELS;
  protected readonly LocationIcon = MapPin;
  protected readonly EditIcon = SquarePen;
  protected readonly DeleteIcon = Trash2;
  protected readonly PlusIcon = Plus;
  protected readonly EyeIcon = Eye;
  protected readonly AlertIcon = TriangleAlert;
  protected readonly NotesIcon = StickyNote;

  readonly close = input.required<() => void>();
  readonly selectedMovie = input.required<MovieDetail>();
  readonly addShowtimeRequested = output<void>();
  readonly editShowtimeRequested = output<EditableShowtime>();

  private readonly showtimesService = inject(ShowtimesService);
  private readonly toastService = inject(ToastService);

  protected readonly movieShowtimes = signal<MovieShowtimeDatesResponse | null>(null);
  protected readonly movieShowtimeDetails = signal<MovieShowtimeListItem[]>([]);
  protected readonly loadingDates = signal(true);
  protected readonly loadingDay = signal(false);
  protected readonly dayDrafts = signal(0);
  protected readonly expandedNotes = signal<Set<string>>(new Set());
  protected readonly selectedTab = signal<string | undefined>(undefined);

  protected readonly otherDrafts = computed(
    () => (this.movieShowtimes()?.numberOfDrafts ?? 0) - this.dayDrafts(),
  );
  protected readonly hasDayDrafts = computed(() => this.dayDrafts() > 0);
  protected readonly hasOtherDrafts = computed(() => this.otherDrafts() > 0);

  constructor() {
    effect((onCleanup) => {
      const movieId = this.selectedMovie().id;
      this.loadingDates.set(true);
      this.movieShowtimes.set(null);
      this.movieShowtimeDetails.set([]);
      this.dayDrafts.set(0);
      this.selectedTab.set(undefined);

      const sub = this.showtimesService.getMovieShowtimeDates(movieId).subscribe({
        next: (data) => {
          this.movieShowtimes.set(data);
          this.loadingDates.set(false);
          if (data.dates.length > 0) {
            this.selectedTab.set(data.dates[0]);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.loadingDates.set(false);
          this.toastService.error(err.error?.message ?? 'Failed to load showtime dates');
        },
      });
      onCleanup(() => sub.unsubscribe());
    });

    effect((onCleanup) => {
      const targetDate = this.selectedTab();
      if (!targetDate) return;
      const movieId = this.selectedMovie().id;
      this.loadingDay.set(true);
      const sub = this.showtimesService.getMovieShowtimesForDate(movieId, targetDate).subscribe({
        next: (data) => {
          if (this.selectedTab() !== targetDate) return;
          this.movieShowtimeDetails.set(data.showtimes);
          this.dayDrafts.set(data.numberOfDrafts);
          this.loadingDay.set(false);
        },
        error: (err: HttpErrorResponse) => {
          if (this.selectedTab() !== targetDate) return;
          this.loadingDay.set(false);
          this.toastService.error(err.error?.message ?? 'Failed to load showtimes');
        },
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected onAddShowtime() {
    this.addShowtimeRequested.emit();
  }

  protected onEditShowtime(showtime: MovieShowtimeListItem) {
    const tab = this.selectedTab();
    if (!tab) return;
    this.editShowtimeRequested.emit({
      id: showtime.id,
      date: new Date(tab),
      time: showtime.time,
      hall: showtime.hall,
      specialNotes: showtime.specialNotes,
    });
  }

  protected onDeleteShowtime(_id: string, close: () => void) {
    close();
  }

  protected toggleNote(id: string) {
    this.expandedNotes.update((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }
}
