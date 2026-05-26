import { afterNextRender, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { CalendarIcon } from '../../../shared/icons';
import type { MovieSearchResult } from '../../../shared/types';
import { canManage as canManagePosition } from '../../../shared/access';
import { NgpButton } from 'ng-primitives/button';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';
import { ManageShowtimeModalComponent } from '../manage-showtime-modal/manage-showtime-modal';
import { MoviesService, StaffService, ToastService } from '../../../services';

@Component({
  selector: 'upcoming-movies',
  imports: [
    LucideAngularModule,
    NgpButton,
    NgpDialogTrigger,
    LoadingSpinnerComponent,
    ManageShowtimeModalComponent,
  ],
  templateUrl: './upcoming-movies.html',
  styleUrl: './upcoming-movies.scss',
})
export class UpcomingMoviesComponent {
  protected readonly icons = {
    CalendarIcon,
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
}
