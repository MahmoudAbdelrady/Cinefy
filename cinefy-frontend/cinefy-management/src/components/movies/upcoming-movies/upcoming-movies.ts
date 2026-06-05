import { afterNextRender, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { CalendarIcon, MegaphoneIcon, SearchIcon } from '../../../shared/icons';
import type { MovieSearchResult } from '../../../shared/types';
import { canManage as canManagePosition } from '../../../shared/access';
import { NgpButton } from 'ng-primitives/button';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { NgpSwitch, NgpSwitchThumb } from 'ng-primitives/switch';
import { LoadingSpinnerComponent, EmptyStateComponent, InputField } from 'cinefy-ui/components';
import { ToastService } from 'cinefy-ui/services';
import { ManageShowtimeModalComponent } from '../manage-showtime-modal/manage-showtime-modal';
import { MoviesService, StaffService } from '../../../services';

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
  private readonly staffService = inject(StaffService);
  private readonly toastService = inject(ToastService);

  private readonly currentUser = toSignal(this.staffService.getCurrentStaffMember());
  protected readonly canManage = computed(() => {
    const user = this.currentUser();
    return user ? canManagePosition(user.position) : false;
  });

  protected readonly loading = signal(true);
  protected readonly movies = signal<MovieSearchResult[]>([]);

  // Placeholder announce state — local-only until the backend announcement flow is wired.
  // In the real flow these come from UpcomingMovie.isAnnounced / hasCommittedShowtimes.
  private readonly announcedIds = signal<Set<number>>(new Set());
  private readonly committedIds = new Set<number>();

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
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.toastService.error(err.error?.message ?? 'Failed to load upcoming movies');
        },
      });
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
    return this.committedIds.has(movieId);
  }

  protected toggleAnnounced(movieId: number, announced: boolean): void {
    this.announcedIds.update((ids) => {
      const next = new Set(ids);
      announced ? next.add(movieId) : next.delete(movieId);
      return next;
    });
  }
}
