import { Component, computed, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ACTIVE_HALL_STATUSES,
  EditableShowtime,
  HallSummary,
  MovieDetail,
  MovieSearchResult,
  ShowtimeDraft,
} from '../../../shared/types';
import {
  ModalComponent,
  DatePicker,
  TimePicker,
  PaginatedSelectComponent,
  FieldErrorComponent,
  LoadingSpinnerComponent,
} from 'cinefy-ui/components';
import { ToastService } from 'cinefy-ui/services';
import {
  HallsService,
  MoviesService,
  ShowtimeEventsService,
  ShowtimesService,
} from '../../../services';
import { NgpTextarea } from 'ng-primitives/textarea';
import { NgpButton } from 'ng-primitives/button';
import { LucideAngularModule } from 'lucide-angular';
import { FilmIcon } from '../../../shared/icons';
import { MoviePickerComponent } from '../movie-picker/movie-picker';
import { NgpSwitch, NgpSwitchThumb } from 'ng-primitives/switch';

function notInPastValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as Date | null;
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const candidate = new Date(value);
  candidate.setHours(0, 0, 0, 0);
  return candidate.getTime() < today.getTime() ? { pastDate: true } : null;
}

function timeNotInPastValidator(control: AbstractControl): ValidationErrors | null {
  const time = control.value as string | null;
  const date = control.parent?.get('date')?.value as Date | null;
  if (!time || !date) return null;

  const [hours, minutes] = time.split(':').map(Number);
  const candidate = new Date(date);
  candidate.setHours(hours, minutes, 0, 0);
  return candidate.getTime() < Date.now() ? { pastTime: true } : null;
}

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
  protected readonly icons = {
    FilmIcon,
  };

  private readonly hallsService = inject(HallsService);
  private readonly moviesService = inject(MoviesService);
  private readonly showtimesService = inject(ShowtimesService);
  private readonly showtimeEvents = inject(ShowtimeEventsService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly close = input.required<() => void>();
  readonly selectedMovie = input<MovieSearchResult | null>(null);
  readonly showSelectedMovie = input(true);
  readonly editingShowtime = input<EditableShowtime | null>(null);

  protected readonly submitting = signal(false);
  protected readonly selectedHall = signal<HallSummary | null>(null);
  protected pickedMovie = signal<MovieSearchResult | null>(null);
  protected readonly activeMovieDetail = signal<MovieDetail | null>(null);

  protected readonly showtimeForm = new FormGroup({
    date: new FormControl<Date | null>(null, {
      validators: [Validators.required, notInPastValidator],
    }),
    time: new FormControl<string | null>(null, {
      validators: [Validators.required, timeNotInPastValidator],
    }),
    hallId: new FormControl<string | null>(null, {
      validators: [Validators.required],
    }),
    is3D: new FormControl(false, { nonNullable: true }),
    specialNotes: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(255)],
    }),
  });

  protected readonly activeMovie = computed<MovieSearchResult | null>(
    () => this.selectedMovie() ?? this.pickedMovie(),
  );
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

  protected readonly fetchHalls = (page: number, size: number, search?: string) =>
    this.hallsService.getHalls(search, { page, size }, undefined, ACTIVE_HALL_STATUSES);

  protected readonly hallDisplayFn = (hall: HallSummary) => hall.name;
  protected readonly hallValueFn = (hall: HallSummary) => hall.id;

  constructor() {
    this.showtimeForm.controls.date.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.showtimeForm.controls.time.updateValueAndValidity();
      });

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
      this.activeMovie();
      if (this.editingShowtime()) return;
      this.showtimeForm.reset({
        date: null,
        time: null,
        hallId: null,
        is3D: false,
        specialNotes: '',
      });
      this.selectedHall.set(null);
    });

    effect(() => {
      const pickedMovie = this.pickedMovie();
      if (!pickedMovie) return;
      this.activeMovieDetail.set(null);
      this.moviesService
        .getMovieDetails(pickedMovie.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (detail) => {
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
          this.showtimeEvents.notifyUpdated(showtime);
          this.toastService.success('Showtime updated');
        } else {
          this.showtimeEvents.notifyCreated(showtime);
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
