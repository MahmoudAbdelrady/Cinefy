import { afterNextRender, Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import { LucideAngularModule, Tag } from 'lucide-angular';
import {
  AlertIcon,
  DeleteIcon,
  EyeIcon,
  LayoutIcon,
  SearchIcon,
  UsersIcon,
} from '../../../shared/icons';
import { NgpButton } from 'ng-primitives/button';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { combineLatest, debounceTime, distinctUntilChanged, startWith, switchMap, tap } from 'rxjs';
import { InputField } from '../../input-field/input-field';
import { PaginationComponent } from '../../pagination/pagination';
import { ModalComponent } from '../../modal/modal';
import { HallConfigModalComponent } from '../hall-config-modal/hall-config-modal';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';
import { HALL_STATUS_LABELS, HallSummary, PaginatedResponse } from '../../../shared/types';
import { HallsService, ToastService } from '../../../services';

@Component({
  selector: 'halls-list',
  imports: [
    LucideAngularModule,
    NgpButton,
    NgpDialogTrigger,
    InputField,
    PaginationComponent,
    ModalComponent,
    HallConfigModalComponent,
    LoadingSpinnerComponent,
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
    TagIcon: Tag,
  };

  private readonly hallsService = inject(HallsService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly statusLabels = HALL_STATUS_LABELS;

  protected readonly page = signal(1);
  protected readonly pageSize = 10;
  protected readonly loading = signal(true);
  protected readonly deletingHallId = signal<string | null>(null);
  protected readonly hallPage = signal<PaginatedResponse<HallSummary> | null>(null);

  protected readonly searchControl = new FormControl<string>('', { nonNullable: true });

  private readonly halls$ = combineLatest([
    this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.page.set(1)),
    ),
    toObservable(this.page),
  ]);

  constructor() {
    afterNextRender(() => {
      this.halls$
        .pipe(
          tap(() => this.loading.set(true)),
          switchMap(([search, page]) =>
            this.hallsService.getHalls(search || undefined, {
              page: page - 1,
              size: this.pageSize,
            }),
          ),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (hallPage) => {
            this.hallPage.set(hallPage);
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
    this.hallPage.update((page) =>
      page
        ? {
            ...page,
            content: [...page.content, hall],
            page: { ...page.page, totalElements: page.page.totalElements + 1 },
          }
        : page,
    );
  }

  protected updateHall(updated: HallSummary): void {
    this.hallPage.update((page) =>
      page
        ? {
            ...page,
            content: page.content.map((h) => (h.id === updated.id ? updated : h)),
          }
        : page,
    );
  }

  protected deleteHall(hall: HallSummary, close: () => void): void {
    this.deletingHallId.set(hall.id);
    this.hallsService.deleteHall(hall.id).subscribe({
      next: () => {
        this.hallPage.update((page) =>
          page
            ? {
                ...page,
                content: page.content.filter((h) => h.id !== hall.id),
                page: { ...page.page, totalElements: page.page.totalElements - 1 },
              }
            : page,
        );
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
