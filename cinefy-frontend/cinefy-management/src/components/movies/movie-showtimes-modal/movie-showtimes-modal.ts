import {
  afterRenderEffect,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChildren,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { DatePipe, DecimalPipe } from '@angular/common';
import { format } from 'date-fns';
import {
  EditableShowtime,
  MovieSummary,
  MovieShowtimeDatesResponse,
  MovieShowtimeListItem,
  PublishShowtimesInput,
  SHOWTIME_STATUS_LABELS,
  Showtime,
} from '../../../shared/types';
import { NgpTabButton, NgpTabList, NgpTabPanel, NgpTabset } from 'ng-primitives/tabs';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  CalendarIcon,
  DeleteIcon,
  EditIcon,
  MapPinIcon,
  PlusIcon,
  SendIcon,
  StickyNoteIcon,
  TicketIcon,
  WarningIcon,
} from '../../../shared/icons';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { ShowtimeEventsService, ShowtimesService, StaffService } from '../../../services';
import { ModalComponent, LoadingSpinnerComponent, EmptyStateComponent } from 'cinefy-ui/components';
import { BookSeatsComponent } from '../book-seats/book-seats';
import { ToastService } from 'cinefy-ui/services';
import { Time12hPipe } from 'cinefy-ui/pipes';
import { canManage as canManagePosition } from '../../../shared/access';

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
    LucideDynamicIcon,
    NgpDialogTrigger,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    Time12hPipe,
    BookSeatsComponent,
  ],
  templateUrl: './movie-showtimes-modal.html',
  styleUrl: './movie-showtimes-modal.scss',
})
export class MovieShowtimesModal {
  protected readonly icons = {
    CalendarIcon,
    DeleteIcon,
    EditIcon,
    PlusIcon,
    WarningIcon,
    MapPinIcon,
    SendIcon,
    StickyNoteIcon,
    TicketIcon,
  };

  private readonly showtimesService = inject(ShowtimesService);
  private readonly showtimeEvents = inject(ShowtimeEventsService);
  private readonly staffService = inject(StaffService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly currentUser = toSignal(this.staffService.getCurrentStaffMember());
  protected readonly canManage = computed(() => {
    const user = this.currentUser();
    return user ? canManagePosition(user.position) : false;
  });

  private readonly noteEls = viewChildren<ElementRef<HTMLElement>>('noteText');

  protected readonly statusLabels = SHOWTIME_STATUS_LABELS;

  readonly close = input.required<() => void>();
  readonly selectedMovie = input.required<MovieSummary>();

  readonly addShowtimeRequested = output<void>();
  readonly editShowtimeRequested = output<EditableShowtime>();

  protected readonly movieShowtimes = signal<MovieShowtimeDatesResponse | null>(null);
  protected readonly movieShowtimeDetails = signal<MovieShowtimeListItem[]>([]);
  protected readonly loadingDates = signal(true);
  protected readonly loadingDay = signal(false);
  protected readonly dayDrafts = signal(0);
  protected readonly selectedTab = signal<string | undefined>(undefined);
  protected readonly deletingShowtimeIds = signal<Set<string>>(new Set());
  protected readonly publishingShowtimeIds = signal<Set<string>>(new Set());
  protected readonly publishingDay = signal(false);
  protected readonly publishingAll = signal(false);
  protected readonly expandedNotes = signal<Set<string>>(new Set());
  protected readonly overflowingNotes = signal<Set<string>>(new Set());

  private readonly selectedMovieId = computed(() => this.selectedMovie().id);

  protected readonly otherDrafts = computed(
    () => (this.movieShowtimes()?.numberOfDrafts ?? 0) - this.dayDrafts(),
  );
  protected readonly hasDayDrafts = computed(() => this.dayDrafts() > 0);
  protected readonly hasOtherDrafts = computed(() => this.otherDrafts() > 0);
  protected readonly hasAnyDrafts = computed(() => this.hasDayDrafts() || this.hasOtherDrafts());

  constructor() {
    effect((onCleanup) => {
      this.loadingDates.set(true);
      this.movieShowtimes.set(null);
      this.movieShowtimeDetails.set([]);
      this.dayDrafts.set(0);
      this.selectedTab.set(undefined);

      const sub = this.showtimesService.getMovieShowtimeDates(this.selectedMovieId()).subscribe({
        next: (data) => {
          this.movieShowtimes.set(data);
          this.loadingDates.set(false);
          if (data.dates.length > 0) {
            this.selectedTab.set(data.dates[0]);
          }
        },
        error: () => this.loadingDates.set(false),
      });
      onCleanup(() => sub.unsubscribe());
    });

    effect((onCleanup) => {
      const targetDate = this.selectedTab();
      if (!targetDate) {
        this.loadingDay.set(false);
        return;
      }

      this.loadingDay.set(true);
      const sub = this.showtimesService
        .getMovieShowtimesForDate(this.selectedMovieId(), targetDate)
        .subscribe({
          next: (data) => {
            if (this.selectedTab() !== targetDate) return;
            this.movieShowtimeDetails.set(data.showtimes);
            this.dayDrafts.set(data.numberOfDrafts);
            this.loadingDay.set(false);
          },
          error: () => {
            if (this.selectedTab() !== targetDate) return;
            this.loadingDay.set(false);
          },
        });
      onCleanup(() => sub.unsubscribe());
    });

    this.showtimeEvents.created$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((created) => this.applyCreatedShowtime(created));

    this.showtimeEvents.updated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((updated) => this.applyUpdatedShowtime(updated));

    this.showtimeEvents.bookingChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ showtimeId, count, myOnHoldSeats }) =>
        this.applyBookingChanged(showtimeId, count, myOnHoldSeats),
      );

    afterRenderEffect(() => {
      const els = this.noteEls();
      const next = new Set<string>();
      for (const ref of els) {
        const el = ref.nativeElement;
        const id = el.dataset['noteId'];
        if (id && el.scrollWidth > el.clientWidth) {
          next.add(id);
        }
      }
      const current = untracked(() => this.overflowingNotes());
      if (this.setsEqual(current, next)) return;
      this.overflowingNotes.set(next);
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
      is3D: showtime.is3D,
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
          const { wasDraft, movieClosed } = this.applyLocalDeletion(id);
          this.toastService.success('Showtime deleted');
          close();

          if (movieClosed) return;

          this.showtimeEvents.notifySingleDeleted(this.selectedMovieId(), wasDraft);
          this.showtimeEvents.notifyCommittedChanged(
            this.selectedMovieId(),
            (this.movieShowtimes()?.numberOfCommitted ?? 0) > 0,
          );
        },
        error: () => this.markDeleting(id, false),
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
          this.showtimeEvents.notifyPublished(this.selectedMovieId(), 1);
          this.toastService.success('Showtime published');
        },
        error: () => this.markPublishing(id, false),
      });
  }

  protected onPublishDayDrafts(): void {
    const date = this.selectedTab();
    if (!date) return;
    const movieId = this.selectedMovieId();
    const count = this.dayDrafts();

    this.runBulkPublish({ movieId, date }, this.publishingDay, () => {
      const remaining = (this.movieShowtimes()?.numberOfDrafts ?? 0) - count;
      this.applyLocalBulkPublish(remaining);
      this.showtimeEvents.notifyPublished(movieId, count);
    });
  }

  protected onPublishAllDrafts(): void {
    const movieId = this.selectedMovieId();
    const count = this.movieShowtimes()?.numberOfDrafts ?? 0;

    this.runBulkPublish({ movieId }, this.publishingAll, () => {
      this.applyLocalBulkPublish(0);
      this.showtimeEvents.notifyPublished(movieId, count);
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

  protected getOccupancy(detail: MovieShowtimeListItem): number {
    if (detail.totalSeats === 0) return 0;
    return (detail.bookedSeats / detail.totalSeats) * 100;
  }

  protected getShowtimeSummary(detail: MovieShowtimeListItem): string {
    const startDateTime = new Date(`${this.selectedTab()}T${detail.time}`);
    const when = format(startDateTime, "MMM d, yyyy 'at' h:mm a");
    return `${this.selectedMovie().title} · ${detail.hall.name} · ${when}`;
  }

  private runBulkPublish(
    payload: PublishShowtimesInput,
    inFlight: WritableSignal<boolean>,
    onSuccess: () => void,
  ): void {
    if (inFlight()) return;
    inFlight.set(true);

    this.showtimesService
      .publishShowtimes(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          inFlight.set(false);
          onSuccess();
          this.toastService.success('Drafts published');
        },
        error: () => inFlight.set(false),
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

  private applyBookingChanged(showtimeId: string, count: number, myOnHoldSeats: number): void {
    this.movieShowtimeDetails.update((list) =>
      list.map((s) => (s.id === showtimeId ? { ...s, bookedSeats: count, myOnHoldSeats } : s)),
    );
  }

  private applyLocalDeletion(id: string): { wasDraft: boolean; movieClosed: boolean } {
    const removed = this.movieShowtimeDetails().find((s) => s.id === id);
    if (!removed) return { wasDraft: false, movieClosed: false };
    const wasDraft = removed.status === 'DRAFT';
    const wasCommitted = removed.status === 'PUBLISHED' || removed.status === 'RUNNING';

    this.movieShowtimeDetails.update((list) => list.filter((s) => s.id !== id));

    if (wasDraft) {
      this.dayDrafts.update((n) => n - 1);
      this.movieShowtimes.update((m) => (m ? { ...m, numberOfDrafts: m.numberOfDrafts - 1 } : m));
    } else if (wasCommitted) {
      this.movieShowtimes.update((m) =>
        m ? { ...m, numberOfCommitted: m.numberOfCommitted - 1 } : m,
      );
    }

    const movieClosed =
      this.movieShowtimeDetails().length === 0
        ? this.dropDateAndPickNeighbour(this.selectedTab())
        : false;

    return { wasDraft, movieClosed };
  }

  private applyLocalPublish(id: string): void {
    this.movieShowtimeDetails.update((list) =>
      list.map((s) => (s.id === id ? { ...s, status: 'PUBLISHED' } : s)),
    );
    this.dayDrafts.update((n) => n - 1);
    this.movieShowtimes.update((m) =>
      m
        ? { ...m, numberOfDrafts: m.numberOfDrafts - 1, numberOfCommitted: m.numberOfCommitted + 1 }
        : m,
    );
  }

  private applyLocalBulkPublish(remainingDrafts: number): void {
    this.movieShowtimeDetails.update((list) =>
      list.map((s) => (s.status === 'DRAFT' ? { ...s, status: 'PUBLISHED' } : s)),
    );
    this.dayDrafts.set(0);
    this.movieShowtimes.update((m) =>
      m
        ? {
            ...m,
            numberOfCommitted: m.numberOfCommitted + (m.numberOfDrafts - remainingDrafts),
            numberOfDrafts: remainingDrafts,
          }
        : m,
    );
  }

  private dropDateAndPickNeighbour(date: string | undefined): boolean {
    const currentDates = this.movieShowtimes()?.dates ?? [];
    const removedIndex = currentDates.indexOf(date ?? '');
    const remainingDates = currentDates.filter((d) => d !== date);

    this.movieShowtimes.update((m) => (m ? { ...m, dates: remainingDates } : m));

    if (remainingDates.length === 0) {
      this.showtimeEvents.notifyDeleted(this.selectedMovieId());
      this.close()();
      return true;
    }

    const nextIndex = Math.min(removedIndex, remainingDates.length - 1);
    this.selectedTab.set(remainingDates[nextIndex]);
    return false;
  }

  private toListItem(showtime: Showtime, time: string): MovieShowtimeListItem {
    return {
      id: showtime.id,
      time,
      hall: showtime.hall,
      status: showtime.status,
      specialNotes: showtime.specialNotes,
      is3D: showtime.is3D,
      bookedSeats: showtime.bookedSeats,
      myOnHoldSeats: showtime.myOnHoldSeats,
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

  private setsEqual(a: Set<string>, b: Set<string>): boolean {
    if (a.size !== b.size) return false;
    for (const v of a) if (!b.has(v)) return false;
    return true;
  }
}
