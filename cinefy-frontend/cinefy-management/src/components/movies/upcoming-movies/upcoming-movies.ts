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
import { FormControl } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { CalendarIcon, MegaphoneIcon, SearchIcon } from '../../../shared/icons';
import type { UpcomingMovie } from '../../../shared/types';
import { NgpButton } from 'ng-primitives/button';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { NgpSwitch, NgpSwitchThumb } from 'ng-primitives/switch';
import { LoadingSpinnerComponent, EmptyStateComponent, InputField } from 'cinefy-ui/components';
import { ToastService } from 'cinefy-ui/services';
import { ManageShowtimeModalComponent } from '../manage-showtime-modal/manage-showtime-modal';
import { MoviesService, ShowtimeEventsService } from '../../../services';

@Component({
  selector: 'upcoming-movies',
  imports: [
    LucideAngularModule,
    NgpButton,
    NgpDialogTrigger,
    NgpSwitch,
    NgpSwitchThumb,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    InputField,
    ManageShowtimeModalComponent,
  ],
  templateUrl: './upcoming-movies.html',
  styleUrl: './upcoming-movies.scss',
})
export class UpcomingMoviesComponent {
  protected readonly icons = {
    CalendarIcon,
    SearchIcon,
    MegaphoneIcon,
  };

  private readonly moviesService = inject(MoviesService);
  private readonly toastService = inject(ToastService);
  private readonly showtimeEvents = inject(ShowtimeEventsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly movies = signal<UpcomingMovie[]>([]);

  private readonly announcedIds = signal<Set<number>>(new Set());
  private readonly committedIds = signal<Set<number>>(new Set());
  private readonly pendingIds = signal<Set<number>>(new Set());

  protected readonly searchControl = new FormControl<string>('', { nonNullable: true });
  private readonly searchTerm = toSignal(this.searchControl.valueChanges, { initialValue: '' });

  protected readonly filteredMovies = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.movies();
    return this.movies().filter((movie) => movie.title.toLowerCase().includes(term));
  });

  constructor() {
    afterNextRender(() => {
      this.moviesService.getUpcomingMovies().subscribe({
        next: (list) => {
          this.movies.set(list);
          this.announcedIds.set(new Set(list.filter((m) => m.isAnnounced).map((m) => m.id)));
          this.committedIds.set(
            new Set(list.filter((m) => m.hasCommittedShowtimes).map((m) => m.id)),
          );
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.toastService.error(err.error?.message ?? 'Failed to load upcoming movies');
        },
      });
    });

    effect(() => {
      const event = this.showtimeEvents.published();
      if (!event) return;
      untracked(() => this.markCommitted(event.movieId));
    });

    effect(() => {
      const event = this.showtimeEvents.committedChanged();
      if (!event) return;
      untracked(() => this.setCommitted(event.movieId, event.hasCommittedShowtimes));
    });
  }

  protected isComingSoon(releaseDate: string | undefined): boolean {
    if (!releaseDate) return false;
    const release = new Date(releaseDate);
    if (Number.isNaN(release.getTime())) return false;
    release.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((release.getTime() - today.getTime()) / 86_400_000);
    return diffDays >= 0 && diffDays <= 10;
  }

  protected isAnnounced(movieId: number): boolean {
    return this.announcedIds().has(movieId);
  }

  protected isCommitted(movieId: number): boolean {
    return this.committedIds().has(movieId);
  }

  protected isPending(movieId: number): boolean {
    return this.pendingIds().has(movieId);
  }

  protected toggleAnnounced(movieId: number, announced: boolean): void {
    if (this.isPending(movieId)) return;

    this.setPending(movieId, true);
    this.moviesService
      .setAnnouncement(movieId, announced)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.setAnnounced(movieId, announced);
          this.setPending(movieId, false);
        },
        error: (err: HttpErrorResponse) => {
          // Re-assert the prior value so the switch reverts to the confirmed state.
          this.setAnnounced(movieId, !announced);
          this.setPending(movieId, false);
          this.toastService.error(err.error?.message ?? 'Failed to update announcement');
        },
      });
  }

  private setAnnounced(movieId: number, announced: boolean): void {
    this.announcedIds.update((ids) => {
      const next = new Set(ids);
      announced ? next.add(movieId) : next.delete(movieId);
      return next;
    });
  }

  private setPending(movieId: number, pending: boolean): void {
    this.pendingIds.update((ids) => {
      const next = new Set(ids);
      pending ? next.add(movieId) : next.delete(movieId);
      return next;
    });
  }

  private setCommitted(movieId: number, committed: boolean): void {
    if (!this.movies().some((movie) => movie.id === movieId)) return;
    this.committedIds.update((ids) => {
      const next = new Set(ids);
      committed ? next.add(movieId) : next.delete(movieId);
      return next;
    });
  }

  private markCommitted(movieId: number): void {
    this.setCommitted(movieId, true);
    this.setAnnounced(movieId, false);
  }
}
