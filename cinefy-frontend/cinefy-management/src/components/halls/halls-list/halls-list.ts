import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  AlertIcon,
  DeleteIcon,
  EditIcon,
  EyeIcon,
  LayoutIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  TagIcon,
  UsersIcon,
} from '../../../shared/icons';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  CinefyInput,
  CinefyLoadingSpinner,
  CinefyEmptyState,
  CinefySelect,
  CinefyDialog,
  CinefyDialogFooter,
} from 'cinefy-ui/components';
import { CinefyToastService } from 'cinefy-ui/services';
import { HallConfigModalComponent } from '../hall-config-modal/hall-config-modal';
import {
  HALL_STATUS_LABELS,
  HallStatus,
  HallSummary,
  StatisticsChange,
} from '../../../shared/types';
import { HallsService } from '../../../services';

@Component({
  selector: 'halls-list',
  imports: [
    LucideDynamicIcon,
    ReactiveFormsModule,
    CinefyInput,
    CinefySelect,
    CinefyDialog,
    CinefyDialogFooter,
    HallConfigModalComponent,
    CinefyLoadingSpinner,
    CinefyEmptyState,
  ],
  templateUrl: './halls-list.html',
  styleUrl: './halls-list.scss',
})
export class HallsListComponent {
  protected readonly icons = {
    SearchIcon,
    LayoutIcon,
    UsersIcon,
    EyeIcon,
    EditIcon,
    DeleteIcon,
    AlertIcon,
    TagIcon,
    SlidersHorizontalIcon,
  };

  private readonly hallsService = inject(HallsService);
  private readonly toastService = inject(CinefyToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly statusLabels = HALL_STATUS_LABELS;

  protected readonly loading = signal(true);
  protected readonly deleting = signal(false);
  protected readonly configuredHall = signal<{ id: string; editMode: boolean } | null>(null);
  protected readonly hallToDelete = signal<HallSummary | null>(null);
  protected readonly halls = signal<HallSummary[]>([]);

  readonly statisticsChanged = output<StatisticsChange>();

  protected readonly filterForm = new FormGroup({
    search: new FormControl<string>('', { nonNullable: true }),
    status: new FormControl<HallStatus | null>(null),
  });

  private readonly searchTerm = toSignal(this.filterForm.controls.search.valueChanges, {
    initialValue: '',
  });

  private readonly statusFilter = toSignal(this.filterForm.controls.status.valueChanges, {
    initialValue: null,
  });

  protected readonly filteredHalls = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();
    return this.halls().filter((hall) => {
      const matchesSearch = !term || hall.name.toLowerCase().includes(term);
      const matchesStatus = !status || hall.status === status;
      return matchesSearch && matchesStatus;
    });
  });

  protected readonly hasFilters = computed(
    () => this.searchTerm().trim() !== '' || this.statusFilter() !== null,
  );

  protected readonly hallStatusEntries = (
    Object.entries(HALL_STATUS_LABELS) as [HallStatus, string][]
  ).map(([value, label]) => ({ value, label }));

  constructor() {
    afterNextRender(() => {
      this.hallsService
        .getHalls()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (halls) => {
            this.halls.set(halls);
            this.statisticsChanged.emit({
              action: 'set',
              totalHalls: halls.length,
              activeHalls: halls.filter((hall) => hall.status === 'ACTIVE').length,
              totalCapacity: halls.reduce(
                (sum, hall) => sum + hall.totalRows * hall.totalColumns,
                0,
              ),
            });
            this.loading.set(false);
          },
          error: () => {
            this.loading.set(false);
            this.statisticsChanged.emit({ action: 'reset' });
          },
        });
    });
  }

  addHall(hall: HallSummary): void {
    this.halls.update((halls) => [...halls, hall]);
    this.statisticsChanged.emit({
      action: 'add',
      status: hall.status,
      capacity: hall.totalRows * hall.totalColumns,
    });
  }

  protected updateHall(updated: HallSummary): void {
    const previous = this.halls().find((h) => h.id === updated.id);
    this.halls.update((halls) => halls.map((h) => (h.id === updated.id ? updated : h)));
    if (!previous) return;
    this.statisticsChanged.emit({
      action: 'update',
      from: { status: previous.status, capacity: previous.totalRows * previous.totalColumns },
      to: { status: updated.status, capacity: updated.totalRows * updated.totalColumns },
    });
  }

  protected deleteHall(hall: HallSummary): void {
    this.deleting.set(true);
    this.hallsService
      .deleteHall(hall.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.halls.update((halls) => halls.filter((h) => h.id !== hall.id));
          this.statisticsChanged.emit({
            action: 'delete',
            status: hall.status,
            capacity: hall.totalRows * hall.totalColumns,
          });
          this.deleting.set(false);
          this.toastService.success('Hall deleted');
          this.hallToDelete.set(null);
        },
        error: () => this.deleting.set(false),
      });
  }
}
