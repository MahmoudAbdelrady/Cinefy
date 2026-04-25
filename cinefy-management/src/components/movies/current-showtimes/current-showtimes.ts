import { Component, DestroyRef, inject, signal } from '@angular/core';
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
import { ShowtimesService, ToastService } from '../../../services';

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
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly editingShowtime = signal<EditableShowtime | null>(null);
  protected readonly deletingShowtimeId = signal<number | null>(null);
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
  }

  protected onShowtimeCreated(showtime: Showtime): void {
    console.log('Showtime created', showtime);
  }

  protected onShowtimeUpdated(showtime: Showtime): void {
    console.log('Showtime updated', showtime);
    this.editingShowtime.set(null);
  }

  protected deleteShowtime(id: number, close: () => void): void {
    this.deletingShowtimeId.set(id);
    setTimeout(() => {
      this.deletingShowtimeId.set(null);
      close();
    }, 500);
  }
}
