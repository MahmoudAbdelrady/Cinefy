import { afterNextRender, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { merge, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { EditableShowtime, MovieWithShowtimes } from '../../../shared/types';
import { canManage as canManagePosition } from '../../../shared/access';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  CalendarClockIcon,
  ClockIcon,
  DeleteIcon,
  PlusIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  StarIcon,
  WarningIcon,
} from '../../../shared/icons';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import {
  ModalComponent,
  LoadingSpinnerComponent,
  EmptyStateComponent,
  InputField,
  InputFieldV2,
  MediaImageComponent,
  CinefySwitch,
} from 'cinefy-ui/components';
import { ToastService } from 'cinefy-ui/services';
import { DurationPipe } from 'cinefy-ui/pipes';
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
    NgpDialogTrigger,
    ModalComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    InputField,
    InputFieldV2,
    CinefySwitch,
    ManageShowtimeModalComponent,
    MovieShowtimesModal,
    MediaImageComponent,
    LucideDynamicIcon,
    DurationPipe,
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
    SlidersHorizontalIcon,
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

  private readonly refetch$ = new Subject<void>();

  protected readonly searchControl = new FormControl<string>('', { nonNullable: true });
  private readonly searchTerm = toSignal(this.searchControl.valueChanges, { initialValue: '' });

  protected readonly showHighlightedOnly = signal(false);

  protected readonly filteredMovies = computed(() => {
    const searchedTitle = this.searchTerm().trim().toLowerCase();
    const highlightedOnly = this.showHighlightedOnly();
    return this.moviesWithShowtimes().filter((item) => {
      const matchesHighlight = !highlightedOnly || item.movieDetails.highlighted;

      const matchesName =
        !searchedTitle || item.movieDetails.title.toLowerCase().includes(searchedTitle);

      return matchesHighlight && matchesName;
    });
  });

  protected readonly hasFilters = computed(
    () => this.searchTerm().trim() !== '' || this.showHighlightedOnly(),
  );

  constructor() {
    this.refetch$
      .pipe(
        switchMap(() => this.showtimesService.getMoviesWithShowtimes()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (list) => {
          this.moviesWithShowtimes.set(list);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });

    afterNextRender(() => this.refetch$.next());

    merge(this.showtimeEvents.created$, this.showtimeEvents.singleDeleted$)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refetch$.next());

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

    this.showtimeEvents.highlightChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.setHighlighted(event.movieId, event.isHighlighted));
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
        error: () => {
          // Re-assert the prior value so the switch reverts to the confirmed state.
          this.setHighlighted(movieId, !highlighted);
          this.markHighlightToggling(movieId, false);
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
        error: () => this.markDeleting(id, false),
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
      list.map((item) =>
        item.movieDetails.id === movieId
          ? { ...item, movieDetails: { ...item.movieDetails, highlighted } }
          : item,
      ),
    );
  }
}
