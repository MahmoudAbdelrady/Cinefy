import { afterNextRender, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { CalendarIcon, MegaphoneIcon, SearchIcon, StarIcon } from '../../../shared/icons';
import type { UpcomingMovie } from '../../../shared/types';
import { differenceInCalendarDays } from 'date-fns';
import { NgpButton } from 'ng-primitives/button';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import {
  LoadingSpinnerComponent,
  EmptyStateComponent,
  InputField,
  MediaImageComponent,
  Switch,
} from 'cinefy-ui/components';
import { ToastService } from 'cinefy-ui/services';
import { ManageShowtimeModalComponent } from '../manage-showtime-modal/manage-showtime-modal';
import { MoviesService, ShowtimeEventsService } from '../../../services';

@Component({
  selector: 'upcoming-movies',
  imports: [
    LucideDynamicIcon,
    NgpButton,
    NgpDialogTrigger,
    Switch,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    InputField,
    ManageShowtimeModalComponent,
    MediaImageComponent,
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
  };

  private readonly moviesService = inject(MoviesService);
  private readonly toastService = inject(ToastService);
  private readonly showtimeEvents = inject(ShowtimeEventsService);
  private readonly destroyRef = inject(DestroyRef);

  private static readonly COMING_SOON_WINDOW_DAYS = 10;

  protected readonly loading = signal(true);
  protected readonly movies = signal<UpcomingMovie[]>([]);

  private readonly announcePendingIds = signal<Set<number>>(new Set());
  private readonly highlightPendingIds = signal<Set<number>>(new Set());

  protected readonly searchControl = new FormControl<string>('', { nonNullable: true });
  private readonly searchTerm = toSignal(this.searchControl.valueChanges, { initialValue: '' });

  protected readonly showAnnouncedOnly = signal(false);

  protected readonly filteredMovies = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const announcedOnly = this.showAnnouncedOnly();
    return this.movies().filter((movie) => {
      if (announcedOnly && !movie.announced) return false;
      if (term && !movie.title.toLowerCase().includes(term)) return false;
      return true;
    });
  });

  constructor() {
    afterNextRender(() => {
      this.moviesService.getUpcomingMovies().subscribe({
        next: (list) => {
          this.movies.set(list);
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.toastService.error(err.error?.message ?? 'Failed to load upcoming movies');
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
    return diffDays >= 0 && diffDays <= UpcomingMoviesComponent.COMING_SOON_WINDOW_DAYS;
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
    this.moviesService
      .setAnnouncement(movieId, announced)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.setAnnounced(movieId, announced);
          this.setPending(movieId, false);
          this.demoteHighlightIfUnhighlightable(movieId);
        },
        error: (err: HttpErrorResponse) => {
          // Re-assert the prior value so the switch reverts to the confirmed state.
          this.setAnnounced(movieId, !announced);
          this.setPending(movieId, false);
          this.toastService.error(err.error?.message ?? 'Failed to update announcement');
        },
      });
  }

  protected toggleHighlighted(movieId: number, highlighted: boolean): void {
    if (this.isHighlightPending(movieId)) return;

    this.setHighlightPending(movieId, true);
    this.moviesService
      .setHighlight(movieId, highlighted)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.setHighlighted(movieId, highlighted);
          this.setHighlightPending(movieId, false);
          this.showtimeEvents.notifyHighlightChanged(movieId, highlighted);
        },
        error: (err: HttpErrorResponse) => {
          // Re-assert the prior value so the switch reverts to the confirmed state.
          this.setHighlighted(movieId, !highlighted);
          this.setHighlightPending(movieId, false);
          this.toastService.error(err.error?.message ?? 'Failed to update highlight');
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
