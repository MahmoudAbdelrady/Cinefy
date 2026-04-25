import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  EditableShowtime,
  HallSummary,
  MovieDetail,
  MovieSearchResult,
  ShowtimeDraft,
} from '../../../shared/types';
import { DatePicker } from '../../date-time/date-picker/date-picker';
import { TimePicker } from '../../date-time/time-picker/time-picker';
import { PaginatedSelectComponent } from '../../drop-down/paginated-select/paginated-select';
import { HallsService, MoviesService, ToastService } from '../../../services';
import { NgpTextarea } from 'ng-primitives/textarea';
import { NgpButton } from 'ng-primitives/button';
import { Film, LucideAngularModule } from 'lucide-angular';
import { ModalComponent } from '../../modal/modal';
import { MoviePickerComponent } from '../movie-picker/movie-picker';

@Component({
  selector: 'manage-showtime-modal',
  imports: [
    FormsModule,
    DatePicker,
    TimePicker,
    PaginatedSelectComponent,
    NgpTextarea,
    NgpButton,
    LucideAngularModule,
    ModalComponent,
    MoviePickerComponent,
    DatePipe,
  ],
  templateUrl: './manage-showtime-modal.html',
  styleUrl: './manage-showtime-modal.scss',
})
export class ManageShowtimeModalComponent {
  protected readonly MovieIcon = Film;

  readonly close = input.required<() => void>();
  readonly selectedMovie = input<MovieSearchResult | null>(null);
  readonly showSelectedMovie = input(true);
  readonly editingShowtime = input<EditableShowtime | null>(null);
  readonly showtimeCreated = output<ShowtimeDraft>();
  readonly showtimeUpdated = output<ShowtimeDraft & { id: string }>();

  protected hallsService = inject(HallsService);
  private readonly moviesService = inject(MoviesService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly fetchHalls = (page: number, size: number, search?: string) =>
    this.hallsService.getHalls(search, { page, size });

  protected readonly hallDisplayFn = (hall: HallSummary) => hall.name;
  protected readonly hallValueFn = (hall: HallSummary) => hall.id;

  protected readonly initialHall = computed<HallSummary | null>(() => {
    const editing = this.editingShowtime();
    return editing ? (editing.hall as HallSummary) : null;
  });

  protected showtimeDate = signal<Date | undefined>(undefined);
  protected showtimeTime = signal<string | null>(null);
  protected showtimeSpecialNotes = signal('');
  protected selectedHall = signal<HallSummary | null>(null);
  protected pickedMovie = signal<MovieSearchResult | null>(null);
  protected readonly activeMovieDetail = signal<MovieDetail | null>(null);

  protected readonly activeMovie = computed<MovieSearchResult | null>(
    () => this.selectedMovie() ?? this.pickedMovie(),
  );
  // TODO: once save is async (loading signal + API call), the spinner will cover
  // the label transition during close, so this computed can stay simple.
  protected readonly isEditMode = computed(() => this.editingShowtime() !== null);

  protected readonly modalTitle = computed(() => {
    if (this.isEditMode()) return 'Edit Showtime';
    return this.activeMovie() ? 'Schedule Showtime' : 'Schedule a Movie';
  });

  protected readonly modalDescription = computed(() => {
    if (this.isEditMode()) {
      const m = this.activeMovie();
      return m ? `Update the showtime for ${m.title}.` : 'Update this showtime.';
    }
    const m = this.activeMovie();
    return m ? `Configure a showtime for ${m.title}.` : 'Pick a movie to schedule a showtime for.';
  });

  protected readonly submitLabel = computed(() =>
    this.isEditMode() ? 'Save Changes' : 'Create Showtime',
  );

  constructor() {
    effect(() => {
      const editing = this.editingShowtime();
      if (!editing) return;
      this.showtimeDate.set(editing.date);
      this.showtimeTime.set(editing.time);
      this.showtimeSpecialNotes.set(editing.specialNotes);
      this.selectedHall.set(editing.hall as HallSummary);
    });

    effect(() => {
      const base = this.activeMovie();
      this.activeMovieDetail.set(null);
      if (!base) return;
      const targetId = base.id;
      this.moviesService
        .getMovieDetails(targetId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (detail) => {
            if (this.activeMovie()?.id !== targetId) return;
            this.activeMovieDetail.set(detail);
          },
          error: (err: HttpErrorResponse) => {
            this.toastService.error(err.error?.message ?? 'Failed to load movie details');
          },
        });
    });
  }

  protected readonly canSubmit = computed(
    () => !!this.showtimeDate() && !!this.showtimeTime() && !!this.selectedHall(),
  );

  protected onHallChange(hall: HallSummary | null) {
    this.selectedHall.set(hall);
  }

  protected onSubmit() {
    const draft = this.submit();
    if (!draft) return;
    const editing = this.editingShowtime();
    if (editing) {
      this.showtimeUpdated.emit({ ...draft, id: editing.id });
    } else {
      this.showtimeCreated.emit(draft);
    }
    this.close()();
  }

  private submit(): ShowtimeDraft | null {
    const movie = this.activeMovie();
    if (!movie || !this.canSubmit()) return null;
    return {
      movieId: movie.id,
      date: this.showtimeDate()!,
      time: this.showtimeTime()!,
      hallId: this.selectedHall()!.id,
      specialNotes: this.showtimeSpecialNotes(),
    };
  }
}
