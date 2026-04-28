import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ModalComponent } from '../../modal/modal';
import {
  EditableShowtime,
  MovieDetail,
  MovieShowtimeDatesResponse,
  MovieShowtimeListItem,
  SHOWTIME_STATUS_LABELS,
  Showtime,
} from '../../../shared/types';
import { NgpTabButton, NgpTabList, NgpTabPanel, NgpTabset } from 'ng-primitives/tabs';
import {
  MapPin,
  LucideAngularModule,
  SquarePen,
  Trash2,
  Plus,
  Send,
  TriangleAlert,
  StickyNote,
} from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { ShowtimeEventsService, ShowtimesService, ToastService } from '../../../services';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';

@Component({
  selector: 'movie-showtimes-modal',
  imports: [
    ModalComponent,
    NgpTabset,
    NgpTabList,
    NgpTabButton,
    NgpTabPanel,
    DatePipe,
    DecimalPipe,
    LucideAngularModule,
    NgpButton,
    NgpDialogTrigger,
    LoadingSpinnerComponent,
  ],
  templateUrl: './movie-showtimes-modal.html',
  styleUrl: './movie-showtimes-modal.scss',
})
export class MovieShowtimesModal {
  protected readonly statusLabels = SHOWTIME_STATUS_LABELS;
  protected readonly LocationIcon = MapPin;
  protected readonly EditIcon = SquarePen;
  protected readonly DeleteIcon = Trash2;
  protected readonly PlusIcon = Plus;
  protected readonly PublishIcon = Send;
  protected readonly AlertIcon = TriangleAlert;
  protected readonly NotesIcon = StickyNote;

  readonly close = input.required<() => void>();
  readonly selectedMovie = input.required<MovieDetail>();
  readonly addShowtimeRequested = output<void>();
  readonly editShowtimeRequested = output<EditableShowtime>();

  private readonly showtimesService = inject(ShowtimesService);
  private readonly showtimeEvents = inject(ShowtimeEventsService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly movieShowtimes = signal<MovieShowtimeDatesResponse | null>(null);
  protected readonly movieShowtimeDetails = signal<MovieShowtimeListItem[]>([]);
  protected readonly loadingDates = signal(true);
  protected readonly loadingDay = signal(false);
  protected readonly dayDrafts = signal(0);
  protected readonly expandedNotes = signal<Set<string>>(new Set());
  protected readonly selectedTab = signal<string | undefined>(undefined);
  protected readonly deletingShowtimeIds = signal<Set<string>>(new Set());
  protected readonly publishingShowtimeIds = signal<Set<string>>(new Set());
  protected readonly publishingDay = signal(false);
  protected readonly publishingAll = signal(false);

  protected readonly otherDrafts = computed(
    () => (this.movieShowtimes()?.numberOfDrafts ?? 0) - this.dayDrafts(),
  );
  protected readonly hasDayDrafts = computed(() => this.dayDrafts() > 0);
  protected readonly hasOtherDrafts = computed(() => this.otherDrafts() > 0);

  constructor() {
    effect((onCleanup) => {
      const movieId = this.selectedMovie().id;
      this.loadingDates.set(true);
      this.movieShowtimes.set(null);
      this.movieShowtimeDetails.set([]);
      this.dayDrafts.set(0);
      this.selectedTab.set(undefined);

      const sub = this.showtimesService.getMovieShowtimeDates(movieId).subscribe({
        next: (data) => {
          this.movieShowtimes.set(data);
          this.loadingDates.set(false);
          if (data.dates.length > 0) {
            this.selectedTab.set(data.dates[0]);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.loadingDates.set(false);
          this.toastService.error(err.error?.message ?? 'Failed to load showtime dates');
        },
      });
      onCleanup(() => sub.unsubscribe());
    });

    effect((onCleanup) => {
      const targetDate = this.selectedTab();
      if (!targetDate) return;
      const movieId = this.selectedMovie().id;
      this.loadingDay.set(true);
      const sub = this.showtimesService.getMovieShowtimesForDate(movieId, targetDate).subscribe({
        next: (data) => {
          if (this.selectedTab() !== targetDate) return;
          this.movieShowtimeDetails.set(data.showtimes);
          this.dayDrafts.set(data.numberOfDrafts);
          this.loadingDay.set(false);
        },
        error: (err: HttpErrorResponse) => {
          if (this.selectedTab() !== targetDate) return;
          this.loadingDay.set(false);
          this.toastService.error(err.error?.message ?? 'Failed to load showtimes');
        },
      });
      onCleanup(() => sub.unsubscribe());
    });

    effect(() => {
      const created = this.showtimeEvents.created();
      if (!created) return;
      untracked(() => this.applyCreatedShowtime(created));
    });

    effect(() => {
      const updated = this.showtimeEvents.updated();
      if (!updated) return;
      untracked(() => this.applyUpdatedShowtime(updated));
    });
  }

  protected onAddShowtime() {
    this.addShowtimeRequested.emit();
  }

  protected onEditShowtime(showtime: MovieShowtimeListItem) {
    const tab = this.selectedTab();
    if (!tab) return;
    this.editShowtimeRequested.emit({
      id: showtime.id,
      date: new Date(tab),
      time: showtime.time,
      hall: showtime.hall,
      specialNotes: showtime.specialNotes,
    });
  }

  protected onDeleteShowtime(id: string, close: () => void) {
    if (this.deletingShowtimeIds().has(id)) return;
    this.markDeleting(id, true);

    this.showtimesService
      .deleteShowtime(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.markDeleting(id, false);
          this.applyLocalDeletion(id);
          this.toastService.success('Showtime deleted');
          close();
        },
        error: (err: HttpErrorResponse) => {
          this.markDeleting(id, false);
          this.toastService.error(err.error?.message ?? 'Failed to delete showtime');
        },
      });
  }

  protected onPublishShowtime(id: string): void {
    if (this.publishingShowtimeIds().has(id)) return;
    this.markPublishing(id, true);

    this.showtimesService
      .publishShowtimes({ showtimeId: id })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.markPublishing(id, false);
          this.applyLocalPublish(id);
          this.showtimeEvents.notifyPublished(this.selectedMovie().id, 1);
          this.toastService.success('Showtime published');
        },
        error: (err: HttpErrorResponse) => {
          this.markPublishing(id, false);
          this.toastService.error(err.error?.message ?? 'Failed to publish showtime');
        },
      });
  }

  protected onPublishDayDrafts(): void {
    if (this.publishingDay()) return;
    const date = this.selectedTab();
    if (!date) return;
    const movieId = this.selectedMovie().id;
    const count = this.dayDrafts();

    this.publishingDay.set(true);
    this.showtimesService
      .publishShowtimes({ movieId, date })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.publishingDay.set(false);
          const remaining = (this.movieShowtimes()?.numberOfDrafts ?? 0) - count;
          this.applyLocalBulkPublish(remaining);
          this.showtimeEvents.notifyPublished(movieId, count);
          this.toastService.success('Drafts published');
        },
        error: (err: HttpErrorResponse) => {
          this.publishingDay.set(false);
          this.toastService.error(err.error?.message ?? 'Failed to publish drafts');
        },
      });
  }

  protected onPublishAllDrafts(): void {
    if (this.publishingAll()) return;
    const movieId = this.selectedMovie().id;
    const count = this.movieShowtimes()?.numberOfDrafts ?? 0;

    this.publishingAll.set(true);
    this.showtimesService
      .publishShowtimes({ movieId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.publishingAll.set(false);
          this.applyLocalBulkPublish(0);
          this.showtimeEvents.notifyPublished(movieId, count);
          this.toastService.success('Drafts published');
        },
        error: (err: HttpErrorResponse) => {
          this.publishingAll.set(false);
          this.toastService.error(err.error?.message ?? 'Failed to publish drafts');
        },
      });
  }

  private applyCreatedShowtime(showtime: Showtime): void {
    const { date: createdDate, time: createdTime } = this.splitStartDateTime(
      showtime.startDateTime,
    );
    const isDraft = showtime.status === 'DRAFT';

    this.movieShowtimes.update((m) => {
      if (!m) return m;
      const dates = m.dates.includes(createdDate) ? m.dates : [...m.dates, createdDate].sort();
      return {
        ...m,
        dates,
        numberOfDrafts: m.numberOfDrafts + (isDraft ? 1 : 0),
      };
    });

    if (createdDate !== this.selectedTab()) return;

    if (isDraft) this.dayDrafts.update((n) => n + 1);

    const item = this.toListItem(showtime, createdTime);
    this.movieShowtimeDetails.update((list) =>
      [...list, item].sort((a, b) => a.time.localeCompare(b.time)),
    );
  }

  private applyUpdatedShowtime(showtime: Showtime): void {
    const { date: updatedDate, time: updatedTime } = this.splitStartDateTime(
      showtime.startDateTime,
    );
    const isDraft = showtime.status === 'DRAFT';

    const previous = this.movieShowtimeDetails().find((s) => s.id === showtime.id);
    if (!previous) return;
    const prevWasDraft = previous.status === 'DRAFT';
    const draftDelta = (isDraft ? 1 : 0) - (prevWasDraft ? 1 : 0);

    const updatedItem = this.toListItem(showtime, updatedTime);

    if (updatedDate === this.selectedTab()) {
      this.movieShowtimeDetails.update((list) =>
        list
          .map((s) => (s.id === showtime.id ? updatedItem : s))
          .sort((a, b) => a.time.localeCompare(b.time)),
      );
      if (draftDelta !== 0) {
        this.dayDrafts.update((n) => n + draftDelta);
        this.movieShowtimes.update((m) =>
          m ? { ...m, numberOfDrafts: m.numberOfDrafts + draftDelta } : m,
        );
      }
      return;
    }

    this.movieShowtimeDetails.update((list) => list.filter((s) => s.id !== showtime.id));
    if (prevWasDraft) this.dayDrafts.update((n) => n - 1);
    if (draftDelta !== 0) {
      this.movieShowtimes.update((m) =>
        m ? { ...m, numberOfDrafts: m.numberOfDrafts + draftDelta } : m,
      );
    }

    this.movieShowtimes.update((m) => {
      if (!m || m.dates.includes(updatedDate)) return m;
      return { ...m, dates: [...m.dates, updatedDate].sort() };
    });

    if (this.movieShowtimeDetails().length === 0) {
      this.dropDateAndPickNeighbour(this.selectedTab());
    }
  }

  private applyLocalDeletion(id: string): void {
    const removed = this.movieShowtimeDetails().find((s) => s.id === id);
    if (!removed) return;
    const wasDraft = removed.status === 'DRAFT';

    this.movieShowtimeDetails.update((list) => list.filter((s) => s.id !== id));

    if (wasDraft) {
      this.dayDrafts.update((n) => n - 1);
      this.movieShowtimes.update((m) => (m ? { ...m, numberOfDrafts: m.numberOfDrafts - 1 } : m));
    }

    if (this.movieShowtimeDetails().length === 0) {
      this.dropDateAndPickNeighbour(this.selectedTab());
    }
  }

  private applyLocalPublish(id: string): void {
    this.movieShowtimeDetails.update((list) =>
      list.map((s) => (s.id === id ? { ...s, status: 'PUBLISHED' } : s)),
    );
    this.dayDrafts.update((n) => n - 1);
    this.movieShowtimes.update((m) => (m ? { ...m, numberOfDrafts: m.numberOfDrafts - 1 } : m));
  }

  private applyLocalBulkPublish(remainingDrafts: number): void {
    this.movieShowtimeDetails.update((list) =>
      list.map((s) => (s.status === 'DRAFT' ? { ...s, status: 'PUBLISHED' } : s)),
    );
    this.dayDrafts.set(0);
    this.movieShowtimes.update((m) => (m ? { ...m, numberOfDrafts: remainingDrafts } : m));
  }

  private dropDateAndPickNeighbour(date: string | undefined): void {
    const currentDates = this.movieShowtimes()?.dates ?? [];
    const removedIndex = currentDates.indexOf(date ?? '');
    const remainingDates = currentDates.filter((d) => d !== date);

    this.movieShowtimes.update((m) => (m ? { ...m, dates: remainingDates } : m));

    if (remainingDates.length === 0) {
      this.showtimeEvents.notifyDeleted(this.selectedMovie().id);
      this.close()();
      return;
    }

    const nextIndex = Math.min(removedIndex, remainingDates.length - 1);
    this.selectedTab.set(remainingDates[nextIndex]);
  }

  private toListItem(showtime: Showtime, time: string): MovieShowtimeListItem {
    return {
      id: showtime.id,
      time,
      hall: showtime.hall,
      status: showtime.status,
      specialNotes: showtime.specialNotes,
      is3D: showtime.is3D,
      reservedSeats: showtime.reservedSeats,
      totalSeats: showtime.totalSeats,
    };
  }

  private splitStartDateTime(startDateTime: string): { date: string; time: string } {
    const [date, full] = startDateTime.split('T');
    return { date, time: full.slice(0, 5) };
  }

  private markDeleting(id: string, isDeleting: boolean): void {
    this.deletingShowtimeIds.update((current) => {
      const next = new Set(current);
      if (isDeleting) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  private markPublishing(id: string, isPublishing: boolean): void {
    this.publishingShowtimeIds.update((current) => {
      const next = new Set(current);
      if (isPublishing) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  protected toggleNote(id: string) {
    this.expandedNotes.update((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }
}
