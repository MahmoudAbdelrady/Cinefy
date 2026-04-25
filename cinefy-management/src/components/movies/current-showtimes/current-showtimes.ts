import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { EditableShowtime, MovieWithShowtimes, Showtime } from '../../../shared/types';
import { Plus, Trash2, TriangleAlert, LucideAngularModule } from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { ModalComponent } from '../../modal/modal';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';
import { ManageShowtimeModalComponent } from '../manage-showtime-modal/manage-showtime-modal';
import { MovieShowtimesModal } from '../movie-showtimes-modal/movie-showtimes-modal';
import { ShowtimeEventsService, ShowtimesService, ToastService } from '../../../services';

@Component({
  selector: 'current-showtimes',
  imports: [
    NgpButton,
    NgpDialogTrigger,
    ModalComponent,
    LoadingSpinnerComponent,
    ManageShowtimeModalComponent,
    MovieShowtimesModal,
    LucideAngularModule,
  ],
  templateUrl: './current-showtimes.html',
  styleUrl: './current-showtimes.scss',
})
export class CurrentShowtimesComponent {
  protected readonly PlusIcon = Plus;
  protected readonly DeleteIcon = Trash2;
  protected readonly AlertIcon = TriangleAlert;

  private readonly showtimesService = inject(ShowtimesService);
  private readonly showtimeEvents = inject(ShowtimeEventsService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly editingShowtime = signal<EditableShowtime | null>(null);
  protected readonly deletingShowtimeIds = signal<Set<number>>(new Set());
  protected readonly moviesWithShowtimes = signal<MovieWithShowtimes[]>([]);

  constructor() {
    this.showtimesService
      .getMoviesWithShowtimes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.moviesWithShowtimes.set(list);
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.toastService.error(err.error?.message ?? 'Failed to load showtimes');
        },
      });

    effect(() => {
      const showtime = this.showtimeEvents.created();
      if (!showtime) return;
      this.applyCreatedShowtime(showtime);
    });
  }

  private applyCreatedShowtime(showtime: Showtime): void {
    const movieId = showtime.movie.id;
    const isDraft = showtime.status === 'DRAFT';
    this.moviesWithShowtimes.update((list) => {
      const existing = list.find((item) => item.movieDetails.id === movieId);
      if (existing) {
        return list.map((item) =>
          item.movieDetails.id === movieId
            ? {
                ...item,
                totalShowtimes: item.totalShowtimes + 1,
                totalDraftShowtimes: item.totalDraftShowtimes + (isDraft ? 1 : 0),
              }
            : item,
        );
      }
      const newRow: MovieWithShowtimes = {
        movieDetails: showtime.movie,
        totalShowtimes: 1,
        totalDraftShowtimes: isDraft ? 1 : 0,
      };
      return [newRow, ...list];
    });
  }

  protected deleteShowtime(id: number, close: () => void): void {
    if (this.deletingShowtimeIds().has(id)) return;
    this.markDeleting(id, true);
    this.showtimesService
      .deleteMovieShowtimes(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.moviesWithShowtimes.update((list) =>
            list.filter((item) => item.movieDetails.id !== id),
          );
          this.markDeleting(id, false);
          this.toastService.success('Showtimes deleted');
          this.showtimeEvents.notifyDeleted(id);
          close();
        },
        error: (err: HttpErrorResponse) => {
          this.markDeleting(id, false);
          this.toastService.error(err.error?.message ?? 'Failed to delete showtimes');
        },
      });
  }

  private markDeleting(id: number, isDeleting: boolean): void {
    this.deletingShowtimeIds.update((current) => {
      const next = new Set(current);
      if (isDeleting) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }
}
