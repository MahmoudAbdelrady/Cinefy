import { afterNextRender, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import { EditableShowtime, MovieWithShowtimes, Showtime } from '../../../shared/types';
import { canManage as canManagePosition } from '../../../shared/access';
import { LucideAngularModule } from 'lucide-angular';
import {
  CalendarClockIcon,
  ClockIcon,
  DeleteIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  WarningIcon,
} from '../../../shared/icons';
import { NgpButton } from 'ng-primitives/button';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import {
  ModalComponent,
  LoadingSpinnerComponent,
  EmptyStateComponent,
  InputField,
  MediaImageComponent,
  Switch,
} from 'cinefy-ui/components';
import { ToastService } from 'cinefy-ui/services';
import { ManageShowtimeModalComponent } from '../manage-showtime-modal/manage-showtime-modal';
import { MovieShowtimesModal } from '../movie-showtimes-modal/movie-showtimes-modal';
import {
  MoviesService,
  ShowtimeEventsService,
  ShowtimesService,
  StaffService,
} from '../../../services';

@Component({
  selector: 'current-showtimes',
  imports: [
    NgpButton,
    NgpDialogTrigger,
    ModalComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    InputField,
    Switch,
    ManageShowtimeModalComponent,
    MovieShowtimesModal,
    MediaImageComponent,
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
    SearchIcon,
    ClockIcon,
    StarIcon,
  };

  private readonly showtimesService = inject(ShowtimesService);
  private readonly moviesService = inject(MoviesService);
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
  protected readonly togglingHighlightIds = signal<Set<number>>(new Set());
  protected readonly moviesWithShowtimes = signal<MovieWithShowtimes[]>([]);

  protected readonly searchControl = new FormControl<string>('', { nonNullable: true });
  private readonly searchTerm = toSignal(this.searchControl.valueChanges, { initialValue: '' });

  protected readonly showHighlightedOnly = signal(false);

  protected readonly filteredMovies = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const highlightedOnly = this.showHighlightedOnly();
    return this.moviesWithShowtimes().filter((item) => {
      if (highlightedOnly && !item.highlighted) return false;
      if (term && !item.movieDetails.title.toLowerCase().includes(term)) return false;
      return true;
    });
  });

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

    this.showtimeEvents.created$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((showtime) => this.applyCreatedShowtime(showtime));

    this.showtimeEvents.deleted$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((movieId) => {
      this.moviesWithShowtimes.update((list) =>
        list.filter((item) => item.movieDetails.id !== movieId),
      );
    });

    this.showtimeEvents.published$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      this.moviesWithShowtimes.update((list) =>
        list.map((item) =>
          item.movieDetails.id === event.movieId
            ? { ...item, totalDraftShowtimes: item.totalDraftShowtimes - event.count }
            : item,
        ),
      );
    });

    this.showtimeEvents.singleDeleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.applySingleDeletion(event.movieId, event.wasDraft));

    this.showtimeEvents.highlightChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.setHighlighted(event.movieId, event.isHighlighted));
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
        highlighted: showtime.movie.highlighted,
      };
      return [...list, newRow];
    });
  }

  private applySingleDeletion(movieId: number, wasDraft: boolean): void {
    this.moviesWithShowtimes.update((list) =>
      list.flatMap((item) => {
        if (item.movieDetails.id !== movieId) return [item];
        const totalShowtimes = item.totalShowtimes - 1;
        if (totalShowtimes <= 0) return [];
        return [
          {
            ...item,
            totalShowtimes,
            totalDraftShowtimes: item.totalDraftShowtimes - (wasDraft ? 1 : 0),
          },
        ];
      }),
    );
  }

  protected isHighlighting(movieId: number): boolean {
    return this.togglingHighlightIds().has(movieId);
  }

  protected canHighlight(item: MovieWithShowtimes): boolean {
    return item.totalShowtimes !== item.totalDraftShowtimes;
  }

  protected toggleHighlighted(movieId: number, highlighted: boolean): void {
    if (this.isHighlighting(movieId)) return;

    this.markHighlightToggling(movieId, true);
    this.moviesService
      .setHighlight(movieId, highlighted)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.setHighlighted(movieId, highlighted);
          this.markHighlightToggling(movieId, false);
          this.showtimeEvents.notifyHighlightChanged(movieId, highlighted);
        },
        error: (err: HttpErrorResponse) => {
          // Re-assert the prior value so the switch reverts to the confirmed state.
          this.setHighlighted(movieId, !highlighted);
          this.markHighlightToggling(movieId, false);
          this.toastService.error(
            err.error?.message ?? 'Failed to update highlight state for this movie',
          );
        },
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

  private markHighlightToggling(movieId: number, isToggling: boolean): void {
    this.togglingHighlightIds.update((current) => {
      const next = new Set(current);
      if (isToggling) {
        next.add(movieId);
      } else {
        next.delete(movieId);
      }
      return next;
    });
  }

  private setHighlighted(movieId: number, highlighted: boolean): void {
    this.moviesWithShowtimes.update((list) =>
      list.map((item) => (item.movieDetails.id === movieId ? { ...item, highlighted } : item)),
    );
  }
}
