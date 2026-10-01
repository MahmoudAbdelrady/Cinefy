import { afterNextRender, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  CalendarIcon,
  MegaphoneIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  StarIcon,
  WarningIcon,
} from '../../../shared/icons';
import type { UpcomingMovie } from '../../../shared/types';
import { differenceInCalendarDays } from 'date-fns';
import {
  CinefyLoadingSpinner,
  CinefyEmptyState,
  CinefyInput,
  CinefyMediaImage,
  CinefySwitch,
} from 'cinefy-ui/components';
import { ManageShowtimeModalComponent } from '../manage-showtime-modal/manage-showtime-modal';
import { MoviesService, ShowtimeEventsService } from '../../../services';

const COMING_SOON_WINDOW_DAYS = 10;

@Component({
  selector: 'upcoming-movies',
  imports: [
    LucideDynamicIcon,
    CinefySwitch,
    CinefyLoadingSpinner,
    CinefyEmptyState,
    CinefyInput,
    ManageShowtimeModalComponent,
    CinefyMediaImage,
  ],
  templateUrl: './upcoming-movies.html',
  styleUrl: './upcoming-movies.scss',
})
export class UpcomingMoviesComponent {
  protected readonly icons = {
    CalendarIcon,
    SearchIcon,
    MegaphoneIcon,
    StarIcon,
    SlidersHorizontalIcon,
    WarningIcon,
  };

  private readonly moviesService = inject(MoviesService);
  private readonly showtimeEvents = inject(ShowtimeEventsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  protected readonly movies = signal<UpcomingMovie[]>([]);
  protected readonly movieToSchedule = signal<UpcomingMovie | null>(null);

  private readonly announcePendingIds = signal<Set<number>>(new Set());
  private readonly highlightPendingIds = signal<Set<number>>(new Set());

  protected readonly searchControl = new FormControl<string>('', { nonNullable: true });
  private readonly searchTerm = toSignal(this.searchControl.valueChanges, { initialValue: '' });

  protected readonly showAnnouncedOnly = signal(false);

  protected readonly filteredMovies = computed(() => {
    const searchedTitle = this.searchTerm().trim().toLowerCase();
    const announcedOnly = this.showAnnouncedOnly();
    return this.movies().filter((movie) => {
      const matchesAnnounced = !announcedOnly || movie.announced;

      const matchesName = !searchedTitle || movie.title.toLowerCase().includes(searchedTitle);

      return matchesAnnounced && matchesName;
    });
  });

  protected readonly hasFilters = computed(
    () => this.searchTerm().trim() !== '' || this.showAnnouncedOnly(),
  );

  constructor() {
    afterNextRender(() => {
      this.moviesService
        .getUpcomingMovies()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (list) => {
            this.movies.set(list);
            this.loading.set(false);
          },
          error: () => {
            this.failed.set(true);
            this.loading.set(false);
          },
        });
    });

    this.showtimeEvents.published$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.markCommitted(event.movieId));

    this.showtimeEvents.committedChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        this.setCommitted(event.movieId, event.hasCommittedShowtimes);
        if (!event.hasCommittedShowtimes) this.demoteHighlightIfUnhighlightable(event.movieId);
      });

    this.showtimeEvents.deleted$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((movieId) => {
      this.setCommitted(movieId, false);
      this.demoteHighlightIfUnhighlightable(movieId);
    });

    this.showtimeEvents.highlightChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.setHighlighted(event.movieId, event.isHighlighted));
  }

  protected isComingSoon(releaseDate: string | undefined): boolean {
    if (!releaseDate) return false;
    const release = new Date(releaseDate);
    if (Number.isNaN(release.getTime())) return false;
    const diffDays = differenceInCalendarDays(release, new Date());
    return diffDays >= 0 && diffDays <= COMING_SOON_WINDOW_DAYS;
  }

  protected isAnnouncePending(movieId: number): boolean {
    return this.announcePendingIds().has(movieId);
  }

  protected isHighlightPending(movieId: number): boolean {
    return this.highlightPendingIds().has(movieId);
  }

  protected canHighlight(movie: UpcomingMovie): boolean {
    return movie.announced || movie.hasCommittedShowtimes;
  }

  protected toggleAnnounced(movieId: number, announced: boolean): void {
    if (this.isAnnouncePending(movieId)) return;

    this.setPending(movieId, true);
    this.setAnnounced(movieId, announced);
    this.moviesService
      .setAnnouncement(movieId, announced)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.setPending(movieId, false);
          this.demoteHighlightIfUnhighlightable(movieId);
        },
        error: () => {
          // Re-assert the prior value so the switch reverts to the confirmed state.
          this.setAnnounced(movieId, !announced);
          this.setPending(movieId, false);
        },
      });
  }

  protected toggleHighlighted(movieId: number, highlighted: boolean): void {
    if (this.isHighlightPending(movieId)) return;

    this.setHighlightPending(movieId, true);
    this.setHighlighted(movieId, highlighted);
    this.moviesService
      .setHighlight(movieId, highlighted)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.setHighlightPending(movieId, false);
          this.showtimeEvents.notifyHighlightChanged(movieId, highlighted);
        },
        error: () => {
          // Re-assert the prior value so the switch reverts to the confirmed state.
          this.setHighlighted(movieId, !highlighted);
          this.setHighlightPending(movieId, false);
        },
      });
  }

  private setAnnounced(movieId: number, announced: boolean): void {
    this.patchMovie(movieId, { announced });
  }

  private setPending(movieId: number, pending: boolean): void {
    this.announcePendingIds.update((ids) => {
      const next = new Set(ids);
      pending ? next.add(movieId) : next.delete(movieId);
      return next;
    });
  }

  private setCommitted(movieId: number, committed: boolean): void {
    this.patchMovie(movieId, { hasCommittedShowtimes: committed });
  }

  private markCommitted(movieId: number): void {
    this.patchMovie(movieId, { hasCommittedShowtimes: true, announced: false });
  }

  private demoteHighlightIfUnhighlightable(movieId: number): void {
    const movie = this.movies().find((m) => m.id === movieId);
    if (!movie || this.canHighlight(movie) || !movie.highlighted) return;
    this.setHighlighted(movieId, false);
    this.showtimeEvents.notifyHighlightChanged(movieId, false);
  }

  private setHighlighted(movieId: number, highlighted: boolean): void {
    this.patchMovie(movieId, { highlighted });
  }

  private setHighlightPending(movieId: number, pending: boolean): void {
    this.highlightPendingIds.update((ids) => {
      const next = new Set(ids);
      pending ? next.add(movieId) : next.delete(movieId);
      return next;
    });
  }

  private patchMovie(movieId: number, patch: Partial<UpcomingMovie>): void {
    this.movies.update((list) =>
      list.map((movie) => (movie.id === movieId ? { ...movie, ...patch } : movie)),
    );
  }
}
