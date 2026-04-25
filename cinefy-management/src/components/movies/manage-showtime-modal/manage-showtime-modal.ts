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
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ACTIVE_HALL_STATUSES,
  EditableShowtime,
  HallSummary,
  MovieDetail,
  MovieSearchResult,
  Showtime,
  ShowtimeDraft,
} from '../../../shared/types';
import { DatePicker } from '../../date-time/date-picker/date-picker';
import { TimePicker } from '../../date-time/time-picker/time-picker';
import { PaginatedSelectComponent } from '../../drop-down/paginated-select/paginated-select';
import { HallsService, MoviesService, ShowtimesService, ToastService } from '../../../services';
import { NgpTextarea } from 'ng-primitives/textarea';
import { NgpButton } from 'ng-primitives/button';
import { Film, LucideAngularModule } from 'lucide-angular';
import { ModalComponent } from '../../modal/modal';
import { MoviePickerComponent } from '../movie-picker/movie-picker';
import { NgpSwitch, NgpSwitchThumb } from 'ng-primitives/switch';
import { FieldErrorComponent } from '../../field-error/field-error';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';

@Component({
  selector: 'manage-showtime-modal',
  imports: [
    ReactiveFormsModule,
    DatePicker,
    TimePicker,
    PaginatedSelectComponent,
    NgpTextarea,
    NgpButton,
    LucideAngularModule,
    ModalComponent,
    MoviePickerComponent,
    DatePipe,
    NgpSwitch,
    NgpSwitchThumb,
    FieldErrorComponent,
    LoadingSpinnerComponent,
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
  readonly showtimeCreated = output<Showtime>();
  readonly showtimeUpdated = output<Showtime>();

  protected hallsService = inject(HallsService);
  private readonly moviesService = inject(MoviesService);
  private readonly showtimesService = inject(ShowtimesService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly fetchHalls = (page: number, size: number, search?: string) =>
    this.hallsService.getHalls(search, { page, size }, undefined, ACTIVE_HALL_STATUSES);

  protected readonly hallDisplayFn = (hall: HallSummary) => hall.name;
  protected readonly hallValueFn = (hall: HallSummary) => hall.id;

  protected readonly initialHall = computed<HallSummary | null>(() => {
    const editing = this.editingShowtime();
    return editing ? (editing.hall as HallSummary) : null;
  });

  protected readonly showtimeForm = new FormGroup({
    date: new FormControl<Date | null>(null, {
      validators: [Validators.required],
    }),
    time: new FormControl<string | null>(null, {
      validators: [Validators.required],
    }),
    hallId: new FormControl<string | null>(null, {
      validators: [Validators.required],
    }),
    is3D: new FormControl(false, { nonNullable: true }),
    specialNotes: new FormControl('', { nonNullable: true }),
  });

  protected readonly submitting = signal(false);
  protected readonly selectedHall = signal<HallSummary | null>(null);
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
      this.selectedHall.set(editing.hall as HallSummary);
      this.showtimeForm.patchValue({
        date: editing.date,
        time: editing.time,
        hallId: editing.hall.id,
        specialNotes: editing.specialNotes,
      });
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

  protected onHallChange(hall: HallSummary | null) {
    this.selectedHall.set(hall);
    const hallIdCtrl = this.showtimeForm.controls.hallId;
    hallIdCtrl.setValue(hall?.id ?? null);
    hallIdCtrl.markAsTouched();
  }

  protected onSubmit() {
    if (this.submitting()) return;
    const draft = this.submit();
    if (!draft) return;
    const editing = this.editingShowtime();
    const request$ = editing
      ? this.showtimesService.updateShowtime(editing.id, draft)
      : this.showtimesService.createShowtime(draft);

    this.submitting.set(true);
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (showtime) => {
        this.submitting.set(false);
        if (editing) {
          this.showtimeUpdated.emit(showtime);
          this.toastService.success('Showtime updated');
        } else {
          this.showtimeCreated.emit(showtime);
          this.toastService.success('Showtime created');
        }
        this.close()();
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.toastService.error(
          err.error?.message ??
            (editing ? 'Failed to update showtime' : 'Failed to create showtime'),
        );
      },
    });
  }

  private submit(): ShowtimeDraft | null {
    if (this.showtimeForm.invalid) {
      this.showtimeForm.markAllAsTouched();
      return null;
    }
    const movie = this.activeMovie();
    if (!movie) return null;
    const value = this.showtimeForm.getRawValue();
    return {
      movieId: movie.id,
      dateTime: this.combineDateAndTime(value.date!, value.time!),
      hallId: value.hallId!,
      is3D: value.is3D,
      specialNotes: value.specialNotes,
    };
  }

  private combineDateAndTime(date: Date, time: string): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${time}:00`;
  }
}
