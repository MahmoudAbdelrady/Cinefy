import {
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  LucideAngularModule,
  Settings,
  Star,
  DollarSign,
  LayoutDashboard,
  SquarePen,
  Eye,
} from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { NgpInput } from 'ng-primitives/input';
import { NgpSwitch, NgpSwitchThumb } from 'ng-primitives/switch';
import { ModalComponent } from '../../modal/modal';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';
import { FieldErrorComponent } from '../../field-error/field-error';
import {
  HALL_STATUS_LABELS,
  SEAT_CATEGORY_LABELS,
  HallType,
  HallSummary,
  HallDetail,
  HallStatus,
  Hall,
  SeatCategory,
  SeatCategoryItem,
  SeatLayout,
  TicketPricing,
} from '../../../shared/types';
import { CustomSelectComponent } from '../../drop-down/custom-select/custom-select';
import { PaginatedSelectComponent } from '../../drop-down/paginated-select/paginated-select';
import { HallLayoutEditorComponent } from '../hall-layout-editor/hall-layout-editor';
import type { Seat } from '../hall-layout-editor/hall-layout-editor';
import { HallsService, ToastService } from '../../../services';

interface LayoutBaseline {
  numberOfRows: number;
  seatsPerRow: number;
  normalPrice: number | null;
  vipPrice: number | null;
  grid: Seat[][];
}

@Component({
  selector: 'hall-config-modal',
  imports: [
    NgClass,
    ReactiveFormsModule,
    LucideAngularModule,
    NgpButton,
    NgpDialogTrigger,
    NgpInput,
    NgpSwitch,
    NgpSwitchThumb,
    ModalComponent,
    LoadingSpinnerComponent,
    FieldErrorComponent,
    CustomSelectComponent,
    PaginatedSelectComponent,
    HallLayoutEditorComponent,
  ],
  templateUrl: './hall-config-modal.html',
  styleUrl: './hall-config-modal.scss',
})
export class HallConfigModalComponent implements OnInit {
  protected readonly SettingsIcon = Settings;
  protected readonly StarIcon = Star;
  protected readonly DollarSignIcon = DollarSign;
  protected readonly LayoutIcon = LayoutDashboard;
  protected readonly EditIcon = SquarePen;
  protected readonly ViewIcon = Eye;

  private readonly hallsService = inject(HallsService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly layoutEditor = viewChild.required(HallLayoutEditorComponent);
  private readonly discardTrigger = viewChild<ElementRef>('discardTrigger');

  readonly close = input.required<() => void>();
  readonly selectedHallId = input<string | null>(null);
  readonly hallCreated = output<HallSummary>();
  readonly hallUpdated = output<HallSummary>();
  readonly isEditMode = signal(false);
  private readonly selectedHallData = signal<HallDetail | null>(null);

  protected readonly isViewMode = computed(
    () => this.selectedHallId() !== null && !this.isEditMode(),
  );
  protected readonly modalTitle = computed(() => {
    if (!this.selectedHallId()) return 'Add New Hall';
    return this.isEditMode() ? 'Edit Hall' : (this.selectedHallData()?.name ?? 'Loading...');
  });

  readonly hallTypes = signal<HallType[]>([]);
  protected readonly saving = signal(false);
  private readonly layoutBaseline = signal<LayoutBaseline | null>(null);
  protected readonly loadingHall = signal(false);
  protected readonly hasUnsavedChanges = signal(false);

  protected readonly hallForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    numberOfRows: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1), Validators.max(100)],
    }),
    seatsPerRow: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1), Validators.max(50)],
    }),
    status: new FormControl<HallStatus>('ACTIVE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    typeId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    supports3D: new FormControl(false, { nonNullable: true }),
    normalPrice: new FormControl<number | null>(null),
    vipPrice: new FormControl<number | null>(null),
  });

  private readonly rawNumRows = toSignal(this.hallForm.controls.numberOfRows.valueChanges, {
    initialValue: null,
  });
  private readonly rawSeatsPerRow = toSignal(this.hallForm.controls.seatsPerRow.valueChanges, {
    initialValue: null,
  });
  protected readonly numRowsValue = computed(() => {
    const v = this.rawNumRows();
    return v != null && v > 100 ? null : v;
  });
  protected readonly seatsPerRowValue = computed(() => {
    const v = this.rawSeatsPerRow();
    return v != null && v > 50 ? null : v;
  });
  protected readonly supports3DValue = toSignal(this.hallForm.controls.supports3D.valueChanges, {
    initialValue: false,
  });

  protected readonly hallStatusEntries = (
    Object.entries(HALL_STATUS_LABELS) as [HallStatus, string][]
  ).filter(([key]) => key !== 'SCHEDULED' && key !== 'NOW_SHOWING');

  protected readonly statusEntry = computed(
    () => this.hallStatusEntries.find((e) => e[0] === this.statusValue()) ?? null,
  );
  protected readonly statusDisplayFn = (entry: [HallStatus, string]) => entry[1];
  protected readonly statusTrackBy = (entry: [HallStatus, string]) => entry[0];

  protected readonly selectedHallType = signal<HallType | null>(null);
  protected readonly hallTypeDisplayFn = (type: HallType) => type.name;
  protected readonly hallTypeTrackBy = (type: HallType) => type.id;
  protected readonly compareHallTypes = (a: HallType, b: HallType) => a?.id === b?.id;

  private readonly statusValue = toSignal(this.hallForm.controls.status.valueChanges, {
    initialValue: this.hallForm.controls.status.value,
  });

  protected readonly fetchHalls = (page: number, size: number) =>
    this.hallsService.getHalls(undefined, { page, size });
  protected readonly hallDisplayFn = (hall: HallSummary) => hall.name;
  protected readonly hallValueFn = (hall: HallSummary) => hall.id;
  protected readonly seatCategoryItems: SeatCategoryItem[] = Object.entries(
    SEAT_CATEGORY_LABELS,
  ).map(([key, name]) => ({
    name,
    type: key as SeatCategory,
  }));

  protected readonly hasNormalSeats = computed(() => this.layoutEditor().stats().normal > 0);
  protected readonly hasVipSeats = computed(() => this.layoutEditor().stats().vip > 0);

  protected selectedSeatCategory = signal<SeatCategoryItem>(this.seatCategoryItems[0]);
  private readonly onSiteOnlyPreference = signal(false);
  protected readonly onSiteOnly = computed(() =>
    this.selectedSeatCategory().type === 'AISLE' ? false : this.onSiteOnlyPreference(),
  );

  constructor() {
    effect(() => {
      const normalCtrl = this.hallForm.controls.normalPrice;
      const vipCtrl = this.hallForm.controls.vipPrice;

      if (this.hasNormalSeats()) {
        normalCtrl.setValidators([Validators.required, Validators.min(1)]);
      } else {
        normalCtrl.clearValidators();
      }

      if (this.hasVipSeats()) {
        vipCtrl.setValidators([Validators.required, Validators.min(1)]);
      } else {
        vipCtrl.clearValidators();
      }

      normalCtrl.updateValueAndValidity();
      vipCtrl.updateValueAndValidity();
    });

    effect(() => {
      if (this.isViewMode()) {
        this.hallForm.disable({ emitEvent: false });
      } else {
        this.hallForm.enable({ emitEvent: false });
      }
    });

    this.hallForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.isEditMode()) {
        this.hasUnsavedChanges.set(true);
      }
    });
  }

  ngOnInit() {
    this.hallsService.getHallTypes().subscribe((types) => this.hallTypes.set(types));

    const hallId = this.selectedHallId();
    if (hallId) {
      this.loadHallData(hallId);
    }
  }

  private loadHallData(id: string) {
    this.loadingHall.set(true);
    this.hallsService.getHall(id).subscribe({
      next: (detail: HallDetail) => {
        this.selectedHallData.set(detail);
        this.applyHallDetail(detail);
        this.loadingHall.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingHall.set(false);
        this.toastService.error(err.error?.message ?? 'Failed to load hall data');
      },
    });
  }

  private applyHallDetail(detail: HallDetail) {
    this.selectedHallType.set(detail.type);

    const normalPrice =
      detail.ticketPricing?.find((p) => p.seatCategory === 'NORMAL')?.price ?? null;
    const vipPrice = detail.ticketPricing?.find((p) => p.seatCategory === 'VIP')?.price ?? null;

    this.hallForm.patchValue({
      name: detail.name,
      numberOfRows: detail.numberOfRows,
      seatsPerRow: detail.seatsPerRow,
      status: detail.status,
      typeId: detail.type.id ?? '',
      supports3D: detail.supports3D,
      normalPrice,
      vipPrice,
    });

    const grid = this.convertApiLayoutToSeatGrid(
      detail.layout,
      detail.numberOfRows,
      detail.seatsPerRow,
    );
    this.layoutEditor().setLayout(grid);
    this.layoutBaseline.set({
      numberOfRows: detail.numberOfRows,
      seatsPerRow: detail.seatsPerRow,
      normalPrice,
      vipPrice,
      grid: grid.map((row) => row.map((seat) => ({ ...seat }))), // shallow copy for baseline
    });
    this.hasUnsavedChanges.set(false);
  }

  protected onStatusChange(entry: [HallStatus, string]) {
    this.hallForm.controls.status.setValue(entry[0]);
  }

  protected onHallTypeChange(type: HallType) {
    this.selectedHallType.set(type);
    this.hallForm.controls.typeId.setValue(type.id ?? '');
  }

  protected onHallTypeCleared() {
    this.selectedHallType.set(null);
    this.hallForm.controls.typeId.setValue('');
  }

  protected selectSeatCategory(category: SeatCategoryItem) {
    this.selectedSeatCategory.set(category);
  }

  protected setOnSiteOnly(value: boolean) {
    this.onSiteOnlyPreference.set(value);
  }

  protected onLayoutClick() {
    if (this.isEditMode()) {
      this.hasUnsavedChanges.set(true);
    }
  }

  protected toggleEditMode() {
    if (this.isEditMode() && this.hasUnsavedChanges()) {
      this.discardTrigger()?.nativeElement.click();
      return;
    }
    this.isEditMode.update((v) => !v);
  }

  protected confirmDiscard(close: () => void) {
    close();
    this.isEditMode.set(false);
    this.applyHallDetail(this.selectedHallData()!);
  }

  protected restoreOriginalLayout() {
    const detail = this.selectedHallData();
    if (detail) {
      this.applyHallDetail(detail);
    } else {
      this.layoutBaseline.set(null);
      this.hallForm.patchValue({
        numberOfRows: null,
        seatsPerRow: null,
        normalPrice: null,
        vipPrice: null,
      });
    }
  }

  protected onResetLayout() {
    const baseline = this.layoutBaseline();
    if (baseline) {
      this.hallForm.patchValue({
        numberOfRows: baseline.numberOfRows,
        seatsPerRow: baseline.seatsPerRow,
        normalPrice: baseline.normalPrice,
        vipPrice: baseline.vipPrice,
      });
      this.layoutEditor().setLayout(baseline.grid.map((row) => row.map((seat) => ({ ...seat }))));
    } else {
      this.hallForm.patchValue({
        numberOfRows: null,
        seatsPerRow: null,
        normalPrice: null,
        vipPrice: null,
      });
    }
  }

  protected copyLayoutFrom(hall: HallSummary) {
    this.hallsService.getHallLayout(hall.id).subscribe({
      next: (hallLayout) => {
        const normalPrice =
          hallLayout.ticketPricing?.find((p) => p.seatCategory === 'NORMAL')?.price ?? null;
        const vipPrice =
          hallLayout.ticketPricing?.find((p) => p.seatCategory === 'VIP')?.price ?? null;

        this.hallForm.patchValue({
          numberOfRows: hallLayout.numberOfRows,
          seatsPerRow: hallLayout.seatsPerRow,
          normalPrice,
          vipPrice,
        });
        const grid = this.convertApiLayoutToSeatGrid(
          hallLayout.layout,
          hallLayout.numberOfRows,
          hallLayout.seatsPerRow,
        );
        this.layoutEditor().setLayout(grid);
        this.layoutBaseline.set({
          numberOfRows: hallLayout.numberOfRows,
          seatsPerRow: hallLayout.seatsPerRow,
          normalPrice,
          vipPrice,
          grid: grid.map((row) => row.map((seat) => ({ ...seat }))),
        });
      },
      error: (err: HttpErrorResponse) => {
        this.toastService.error(err.error?.message ?? 'Failed to copy layout');
      },
    });
  }

  protected saveHall() {
    if (this.hallForm.invalid) return;

    const hall = this.buildHallPayload();
    const existing = this.selectedHallId();

    this.saving.set(true);
    const request$ = existing
      ? this.hallsService.updateHall(existing, hall)
      : this.hallsService.createHall(hall);

    request$.subscribe({
      next: (result) => {
        this.saving.set(false);
        if (existing) {
          this.hallUpdated.emit(result);
          this.toastService.success('Hall updated successfully');
        } else {
          this.hallCreated.emit(result);
          this.toastService.success('Hall created successfully');
        }
        this.close()();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.toastService.error(
          err.error?.message ?? `Failed to ${existing ? 'update' : 'create'} hall`,
        );
      },
    });
  }

  private buildHallPayload(): Hall {
    const formValue = this.hallForm.getRawValue();
    const layout = this.extractLayout();
    const ticketPricing = this.buildTicketPricing(formValue.normalPrice, formValue.vipPrice);

    return {
      name: formValue.name,
      numberOfRows: formValue.numberOfRows!,
      seatsPerRow: formValue.seatsPerRow!,
      status: formValue.status,
      typeId: formValue.typeId,
      supports3D: formValue.supports3D,
      layout,
      ticketPricing,
    };
  }

  private extractLayout(): SeatLayout {
    const editor = this.layoutEditor();
    const seatLayout = editor.seatLayout();
    const categories: Partial<Record<SeatCategory, string[]>> = {};
    const onSiteOnly: string[] = [];

    for (let rowIdx = 0; rowIdx < seatLayout.length; rowIdx++) {
      const rowLabel = editor.rowLabel(rowIdx);
      for (let colIdx = 0; colIdx < seatLayout[rowIdx].length; colIdx++) {
        const seat = seatLayout[rowIdx][colIdx];
        const seatId = `${rowLabel}${colIdx + 1}`;
        if (seat.type !== 'NORMAL') {
          if (!categories[seat.type]) categories[seat.type] = [];
          categories[seat.type]!.push(seatId);
        }
        if (seat.onsiteOnly) onSiteOnly.push(seatId);
      }
    }

    return { categories, onSiteOnly };
  }

  private buildTicketPricing(normalPrice: number | null, vipPrice: number | null): TicketPricing[] {
    const pricing: TicketPricing[] = [];
    if (this.hasNormalSeats() && normalPrice != null) {
      pricing.push({ seatCategory: 'NORMAL', price: normalPrice });
    }
    if (this.hasVipSeats() && vipPrice != null && vipPrice > 0) {
      pricing.push({ seatCategory: 'VIP', price: vipPrice });
    }
    return pricing;
  }

  private convertApiLayoutToSeatGrid(layout: SeatLayout, rows: number, cols: number): Seat[][] {
    const grid: Seat[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ type: 'NORMAL' as SeatCategory, onsiteOnly: false })),
    );

    const onSiteOnlySet = new Set(layout.onSiteOnly ?? []);

    for (const [category, positions] of Object.entries(layout.categories ?? {})) {
      const seatType = category as SeatCategory;
      for (const pos of positions!) {
        const match = pos.match(/^([A-Z]+)(\d+)$/);
        const rowIdx = this.rowLabelToIndex(match![1]);
        const colIdx = parseInt(match![2]) - 1;
        if (rowIdx < rows && colIdx < cols) {
          grid[rowIdx][colIdx] = { type: seatType, onsiteOnly: onSiteOnlySet.has(pos) };
        }
      }
    }

    for (const pos of onSiteOnlySet) {
      const match = pos.match(/^([A-Z]+)(\d+)$/);
      const rowIdx = this.rowLabelToIndex(match![1]);
      const colIdx = parseInt(match![2]) - 1;
      if (rowIdx < rows && colIdx < cols) {
        grid[rowIdx][colIdx].onsiteOnly = true;
      }
    }

    return grid;
  }

  private rowLabelToIndex(label: string): number {
    const repeat = label.length;
    const letterCode = label.charCodeAt(0) - 65;
    return (repeat - 1) * 26 + letterCode;
  }
}
