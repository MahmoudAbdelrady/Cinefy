import { afterNextRender, Component, computed, inject, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import {
  AlertIcon,
  DeleteIcon,
  EyeIcon,
  LayoutIcon,
  SearchIcon,
  TagIcon,
  UsersIcon,
} from '../../../shared/icons';
import { NgpButton } from 'ng-primitives/button';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  InputField,
  LoadingSpinnerComponent,
  ModalComponent,
  EmptyStateComponent,
  CustomSelectComponent,
} from 'cinefy-ui/components';
import { ToastService } from 'cinefy-ui/services';
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
    LucideAngularModule,
    NgpButton,
    NgpDialogTrigger,
    InputField,
    CustomSelectComponent,
    ModalComponent,
    HallConfigModalComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
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
    DeleteIcon,
    AlertIcon,
    TagIcon,
  };

  private readonly hallsService = inject(HallsService);
  private readonly toastService = inject(ToastService);

  protected readonly statusLabels = HALL_STATUS_LABELS;
  protected readonly hallStatuses = Object.keys(HALL_STATUS_LABELS) as HallStatus[];

  protected readonly loading = signal(true);
  protected readonly deletingHallId = signal<string | null>(null);
  protected readonly halls = signal<HallSummary[]>([]);

  readonly statisticsChanged = output<StatisticsChange>();

  protected readonly statusFilter = signal<HallStatus | undefined>(undefined);

  protected readonly searchControl = new FormControl<string>('', { nonNullable: true });
  private readonly searchTerm = toSignal(this.searchControl.valueChanges, { initialValue: '' });

  protected readonly filteredHalls = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();
    return this.halls().filter((hall) => {
      const matchesSearch = !term || hall.name.toLowerCase().includes(term);
      const matchesStatus = !status || hall.status === status;
      return matchesSearch && matchesStatus;
    });
  });

  protected readonly statusDisplayFn = (status: HallStatus): string => HALL_STATUS_LABELS[status];

  constructor() {
    afterNextRender(() => {
      this.hallsService.getHalls().subscribe({
        next: (halls) => {
          this.halls.set(halls);
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.toastService.error(err.error?.message ?? 'Failed to load halls');
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

  protected onStatusFilterChange(status: HallStatus): void {
    this.statusFilter.set(status);
  }

  protected onStatusFilterCleared(): void {
    this.statusFilter.set(undefined);
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

  protected deleteHall(hall: HallSummary, close: () => void): void {
    this.deletingHallId.set(hall.id);
    this.hallsService.deleteHall(hall.id).subscribe({
      next: () => {
        this.halls.update((halls) => halls.filter((h) => h.id !== hall.id));
        this.statisticsChanged.emit({
          action: 'delete',
          status: hall.status,
          capacity: hall.totalRows * hall.totalColumns,
        });
        this.deletingHallId.set(null);
        this.toastService.success('Hall deleted');
        close();
      },
      error: (err: HttpErrorResponse) => {
        this.deletingHallId.set(null);
        this.toastService.error(err.error?.message ?? 'Failed to delete hall');
      },
    });
  }
}
