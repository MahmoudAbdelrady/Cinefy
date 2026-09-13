import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { differenceInCalendarDays, format, isPast } from 'date-fns';
import {
  ACTIVE_HALL_STATUSES,
  EditableShowtime,
  HallSummary,
  MovieDetail,
  MovieSearchResult,
  ShowtimeDraft,
} from '../../../shared/types';
import {
  CinefyDialog,
  CinefyDialogFooter,
  CinefyDatePicker,
  CinefyTimePicker,
  CinefySelect,
  CinefyFieldError,
  CinefyLoadingSpinner,
  CinefyMediaImage,
  CinefySwitch,
} from 'cinefy-ui/components';
import { CinefyToastService } from 'cinefy-ui/services';
import { DurationPipe } from 'cinefy-ui/pipes';
import {
  HallsService,
  MoviesService,
  ShowtimeEventsService,
  ShowtimesService,
} from '../../../services';
import { Textarea } from 'primeng/textarea';
import { MoviePickerComponent } from '../movie-picker/movie-picker';
import { DATE_FORMAT } from '../../../shared/constants';

function notInPastValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as Date | null;
  if (!value) return null;
  return differenceInCalendarDays(value, new Date()) < 0 ? { pastDate: true } : null;
}

function timeNotInPastValidator(control: AbstractControl): ValidationErrors | null {
  const time = control.value as string | null;
  const date = control.parent?.get('date')?.value as Date | null;
  if (!time || !date) return null;

  const [hours, minutes] = time.split(':').map(Number);
  const candidate = new Date(date);
  candidate.setHours(hours, minutes, 0, 0);
  return isPast(candidate) ? { pastTime: true } : null;
}

function combineDateAndTime(date: Date, time: string): string {
  return `${format(date, DATE_FORMAT)}T${time}:00`;
}

@Component({
  selector: 'manage-showtime-modal',
  imports: [
    ReactiveFormsModule,
    CinefyDatePicker,
    CinefyTimePicker,
    CinefySelect,
    Textarea,
    CinefyDialog,
    CinefyDialogFooter,
    MoviePickerComponent,
    CinefyMediaImage,
    DatePipe,
    CinefySwitch,
    CinefyFieldError,
    CinefyLoadingSpinner,
    DurationPipe,
  ],
  templateUrl: './manage-showtime-modal.html',
  styleUrl: './manage-showtime-modal.scss',
})
export class ManageShowtimeModalComponent {
  private readonly hallsService = inject(HallsService);
  private readonly moviesService = inject(MoviesService);
  private readonly showtimesService = inject(ShowtimesService);
  private readonly showtimeEvents = inject(ShowtimeEventsService);
  private readonly toastService = inject(CinefyToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly dialog = viewChild.required(CinefyDialog);

  readonly selectedMovie = input<MovieSearchResult | null>(null);
  readonly showSelectedMovie = input(true);
  readonly editingShowtime = input<EditableShowtime | null>(null);

  readonly closed = output<void>();

  protected readonly submitting = signal(false);
  private readonly halls = signal<HallSummary[]>([]);
  protected pickedMovie = signal<MovieSearchResult | null>(null);
  protected readonly activeMovieDetail = signal<MovieDetail | null>(null);
  private readonly initialFormSnapshot = signal<string | null>(null);

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
      validators: [Validators.maxLength(255), Validators.pattern(/.*\S.*/s)],
    }),
  });

  protected readonly activeMovie = computed<MovieSearchResult | null>(
    () => this.selectedMovie() ?? this.pickedMovie(),
  );
  protected readonly isEditMode = computed(() => this.editingShowtime() !== null);

  private readonly currentFormValue = toSignal(this.showtimeForm.valueChanges, {
    initialValue: this.showtimeForm.getRawValue(),
  });

  protected readonly hasChanges = computed(() => {
    const snapshot = this.initialFormSnapshot();
    if (snapshot === null) return true;
    this.currentFormValue();
    return JSON.stringify(this.showtimeForm.getRawValue()) !== snapshot;
  });

  protected readonly submitDisabled = computed(
    () => this.submitting() || (this.isEditMode() && !this.hasChanges()),
  );

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

  protected readonly hallEntries = computed(() =>
    this.halls().map((hall) => ({ value: hall.id, label: hall.name })),
  );

  constructor() {
    this.showtimeForm.controls.date.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.showtimeForm.controls.time.updateValueAndValidity();
      });

    effect(() => {
      const editing = this.editingShowtime();
      if (!editing) return;
      this.showtimeForm.patchValue({
        date: editing.date,
        time: editing.time,
        hallId: editing.hall.id,
        is3D: editing.is3D,
        specialNotes: editing.specialNotes,
      });
      this.showtimeForm.markAllAsTouched();
      this.initialFormSnapshot.set(JSON.stringify(this.showtimeForm.getRawValue()));
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
    });

    effect(() => {
      if (!this.showSelectedMovie()) return;
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
        });
    });

    afterNextRender(() => {
      this.hallsService
        .getHalls(undefined, ACTIVE_HALL_STATUSES)
        .subscribe((halls) => this.halls.set(halls));
    });
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
        this.dialog().close();
      },
      error: () => this.submitting.set(false),
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
      dateTime: combineDateAndTime(value.date!, value.time!),
      hallId: value.hallId!,
      is3D: value.is3D,
      specialNotes: value.specialNotes?.trim() || null,
    };
  }
}
