import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { EditableShowtime, MovieWithShowtimes, Showtime } from '../../../shared/types';
import { canManage as canManagePosition } from '../../../shared/access';
import { LucideAngularModule } from 'lucide-angular';
import { CalendarClockIcon, DeleteIcon, PlusIcon, WarningIcon } from '../../../shared/icons';
import { NgpButton } from 'ng-primitives/button';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { ModalComponent, LoadingSpinnerComponent, EmptyStateComponent } from 'cinefy-ui/components';
import { ToastService } from 'cinefy-ui/services';
import { ManageShowtimeModalComponent } from '../manage-showtime-modal/manage-showtime-modal';
import { MovieShowtimesModal } from '../movie-showtimes-modal/movie-showtimes-modal';
import { ShowtimeEventsService, ShowtimesService, StaffService } from '../../../services';

@Component({
  selector: 'current-showtimes',
  imports: [
    NgpButton,
    NgpDialogTrigger,
    ModalComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ManageShowtimeModalComponent,
    MovieShowtimesModal,
    LucideAngularModule,
  ],
  templateUrl: './current-showtimes.html',
  styleUrl: './current-showtimes.scss',
})
export class CurrentShowtimesComponent {
  protected readonly icons = {
    DeleteIcon,
    PlusIcon,
    WarningIcon,
    CalendarClockIcon,
  };

  private readonly showtimesService = inject(ShowtimesService);
  private readonly showtimeEvents = inject(ShowtimeEventsService);
  private readonly staffService = inject(StaffService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly currentUser = toSignal(this.staffService.getCurrentStaffMember());
  protected readonly canManage = computed(() => {
    const user = this.currentUser();
    return user ? canManagePosition(user.position) : false;
  });

  protected readonly loading = signal(true);
  protected readonly editingShowtime = signal<EditableShowtime | null>(null);
  protected readonly deletingShowtimeIds = signal<Set<number>>(new Set());
  protected readonly moviesWithShowtimes = signal<MovieWithShowtimes[]>([]);

  constructor() {
    afterNextRender(() => {
      this.showtimesService.getMoviesWithShowtimes().subscribe({
        next: (list) => {
          this.moviesWithShowtimes.set(list);
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.toastService.error(err.error?.message ?? 'Failed to load showtimes');
        },
      });
    });

    effect(() => {
      const showtime = this.showtimeEvents.created();
      if (!showtime) return;
      untracked(() => this.applyCreatedShowtime(showtime));
    });

    effect(() => {
      const movieId = this.showtimeEvents.deleted();
      if (movieId == null) return;
      untracked(() => {
        this.moviesWithShowtimes.update((list) =>
          list.filter((item) => item.movieDetails.id !== movieId),
        );
      });
    });

    effect(() => {
      const event = this.showtimeEvents.published();
      if (!event) return;
      untracked(() => {
        this.moviesWithShowtimes.update((list) =>
          list.map((item) =>
            item.movieDetails.id === event.movieId
              ? { ...item, totalDraftShowtimes: item.totalDraftShowtimes - event.count }
              : item,
          ),
        );
      });
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
