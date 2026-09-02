import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  DollarSignIcon,
  EditIcon,
  EyeIcon,
  LayoutIcon,
  SettingsIcon,
  StarIcon,
  WarningIcon,
} from '../../../shared/icons';
import {
  LoadingSpinnerComponent,
  EmptyStateComponent,
  CinefyInput,
  CuiSelect,
  CinefySwitch,
  CinefyDialog,
  CinefyDialogHeader,
  CinefyDialogFooter,
} from 'cinefy-ui/components';
import { ToastService } from 'cinefy-ui/services';
import {
  HALL_STATUS_LABELS,
  SEAT_CATEGORY_LABELS,
  Seat,
  HallType,
  HallSummary,
  HallDetail,
  HallLayout,
  HallStatus,
  Hall,
  SeatCategory,
  SeatLayout,
  TicketPricing,
} from '../../../shared/types';
import { HallLayoutEditorComponent } from '../hall-layout-editor/hall-layout-editor';
import { HallsService } from '../../../services';
import { RESOURCE_NAME_PATTERN } from '../../../shared/validation';
import { createSeatGrid, resizeGrid, rowLabel, rowLabelToIndex, seatStats } from '../seat-layout';

const MAX_GRID_DIMENSION = 50;
const MAX_PRICE_DECIMALS = 2;
const MAX_PRICE = 99_999_999.99;

function maxDecimals(decimals: number): ValidatorFn {
  return (control): ValidationErrors | null => {
    const value = control.value;
    if (value == null || value === '') return null;
    const fraction = String(value).split('.')[1];
    return fraction && fraction.length > decimals ? { maxDecimals: true } : null;
  };
}

interface LayoutBaseline {
  numberOfRows: number;
  seatsPerRow: number;
  normalPrice: number | null;
  vipPrice: number | null;
  grid: Seat[][];
}

interface SeatCategoryItem {
  name: string;
  type: SeatCategory;
}

interface HallStatusEntry {
  value: HallStatus;
  label: string;
}

const AUTO_HALL_STATUS: HallStatus = 'SCHEDULED';

const SELECTABLE_HALL_STATUS_ENTRIES = (
  Object.entries(HALL_STATUS_LABELS) as [HallStatus, string][]
)
  .filter(([value]) => value !== AUTO_HALL_STATUS)
  .map(([value, label]) => ({ value, label }));

@Component({
  selector: 'hall-config-modal',
  imports: [
    NgClass,
    ReactiveFormsModule,
    LucideDynamicIcon,
    CinefySwitch,
    CinefyDialog,
    CinefyDialogHeader,
    CinefyDialogFooter,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    CinefyInput,
    CuiSelect,
    HallLayoutEditorComponent,
  ],
  templateUrl: './hall-config-modal.html',
  styleUrl: './hall-config-modal.scss',
})
export class HallConfigModalComponent {
  protected readonly icons = {
    DollarSignIcon,
    EditIcon,
    EyeIcon,
    LayoutIcon,
    SettingsIcon,
    StarIcon,
    WarningIcon,
  };
  protected readonly maxGridDimension = MAX_GRID_DIMENSION;

  private readonly hallsService = inject(HallsService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly hallStatusEntries = computed<HallStatusEntry[]>(() => {
    const current = this.selectedHallData()?.status;
    const base = SELECTABLE_HALL_STATUS_ENTRIES;
    if (current === AUTO_HALL_STATUS) {
      return [...base, { value: current, label: HALL_STATUS_LABELS[current] }];
    }
    return base;
  });

  protected readonly isStatusLocked = computed(() => {
    const current = this.selectedHallData()?.status;
    return current === AUTO_HALL_STATUS;
  });

  protected readonly seatCategoryItems: SeatCategoryItem[] = Object.entries(
    SEAT_CATEGORY_LABELS,
  ).map(([key, name]) => ({
    name,
    type: key as SeatCategory,
  }));

  readonly visible = model(false);
  readonly selectedHallId = input<string | null>(null);

  readonly closed = output<void>();
  readonly hallCreated = output<HallSummary>();
  readonly hallUpdated = output<HallSummary>();

  protected readonly isEditMode = signal(false);
  protected readonly discardVisible = signal(false);
  private readonly selectedHallData = signal<HallDetail | null>(null);

  protected readonly saving = signal(false);
  private readonly layoutBaseline = signal<LayoutBaseline | null>(null);

  protected readonly loadingHall = signal(false);
  protected readonly loadHallError = signal(false);

  private readonly initialSnapshot = signal<string | null>(null);
  private readonly hallTypes = signal<HallType[]>([]);
  private readonly halls = signal<HallSummary[]>([]);

  protected selectedSeatCategory = signal<SeatCategoryItem>(this.seatCategoryItems[0]);
  private readonly onSiteOnlyPreference = signal(false);

  protected readonly hallForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(50),
        Validators.pattern(RESOURCE_NAME_PATTERN),
      ],
    }),
    numberOfRows: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1), Validators.max(MAX_GRID_DIMENSION)],
    }),
    seatsPerRow: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1), Validators.max(MAX_GRID_DIMENSION)],
    }),
    status: new FormControl<HallStatus>('ACTIVE', {
      nonNullable: true,
    }),
    typeId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    supports3D: new FormControl(false, { nonNullable: true }),
    normalPrice: new FormControl<number | null>(null),
    vipPrice: new FormControl<number | null>(null),
  });

  protected readonly copyLayoutControl = new FormControl<string | null>(null);

  protected readonly isViewMode = computed(
    () => this.selectedHallId() !== null && !this.isEditMode(),
  );
  protected readonly modalTitle = computed(() => {
    if (!this.selectedHallId()) return 'Add New Hall';
    if (this.loadingHall()) return 'Loading…';
    const hall = this.selectedHallData();
    if (!hall) return '—';
    return this.isEditMode() ? `Editing ${hall.name}` : `Viewing ${hall.name} config`;
  });

  private readonly numRowsValue = toSignal(
    this.hallForm.controls.numberOfRows.valueChanges.pipe(
      map((v) => (v != null && v > MAX_GRID_DIMENSION ? null : v)),
    ),
    { initialValue: null },
  );
  private readonly seatsPerRowValue = toSignal(
    this.hallForm.controls.seatsPerRow.valueChanges.pipe(
      map((v) => (v != null && v > MAX_GRID_DIMENSION ? null : v)),
    ),
    { initialValue: null },
  );
  protected readonly seatLayout = linkedSignal<{ rows: number; cols: number }, Seat[][]>({
    source: () => ({ rows: this.numRowsValue() ?? 0, cols: this.seatsPerRowValue() ?? 0 }),
    computation: ({ rows, cols }, previous) => resizeGrid(previous?.value ?? [], rows, cols),
  });

  private readonly seatStatsValue = computed(() => seatStats(this.seatLayout()));
  protected readonly hasNormalSeats = computed(() => this.seatStatsValue().normal > 0);
  protected readonly hasVipSeats = computed(() => this.seatStatsValue().vip > 0);
  protected readonly onSiteOnly = computed(() =>
    this.selectedSeatCategory().type === 'AISLE' ? false : this.onSiteOnlyPreference(),
  );

  private readonly currentFormValue = toSignal(this.hallForm.valueChanges, {
    initialValue: this.hallForm.getRawValue(),
  });
  protected readonly hasChanges = computed(() => {
    const snapshot = this.initialSnapshot();
    if (snapshot === null) return true;
    this.currentFormValue();
    this.seatLayout();
    return this.serializeState() !== snapshot;
  });

  protected readonly hallTypeEntries = computed(() =>
    this.hallTypes().map((type) => ({ value: type.id!, label: type.name })),
  );

  protected readonly hallEntries = computed(() =>
    this.halls().map((hall) => ({ value: hall.id, label: hall.name })),
  );

  constructor() {
    effect(() => {
      const normalCtrl = this.hallForm.controls.normalPrice;
      const vipCtrl = this.hallForm.controls.vipPrice;

      if (this.hasNormalSeats()) {
        normalCtrl.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(MAX_PRICE),
          maxDecimals(MAX_PRICE_DECIMALS),
        ]);
      } else {
        normalCtrl.clearValidators();
      }

      if (this.hasVipSeats()) {
        vipCtrl.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(MAX_PRICE),
          maxDecimals(MAX_PRICE_DECIMALS),
        ]);
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

      const statusCtrl = this.hallForm.controls.status;
      if (this.isViewMode() || this.isStatusLocked()) {
        statusCtrl.removeValidators(Validators.required);
        statusCtrl.disable({ emitEvent: false });
      } else {
        statusCtrl.addValidators(Validators.required);
        statusCtrl.enable({ emitEvent: false });
      }
      statusCtrl.updateValueAndValidity();
    });

    this.copyLayoutControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((hallId) => {
        if (hallId) {
          this.copyLayoutFrom(hallId);
        } else {
          this.restoreOriginalLayout();
        }
      });

    afterNextRender(() => {
      this.hallsService.getHallTypes().subscribe((types) => this.hallTypes.set(types));
      this.hallsService
        .getHalls(this.selectedHallId() ?? undefined)
        .subscribe((halls) => this.halls.set(halls));

      const hallId = this.selectedHallId();
      if (hallId) {
        this.loadHallData(hallId);
      }
    });
  }

  private loadHallData(id: string) {
    this.loadingHall.set(true);
    this.loadHallError.set(false);
    this.hallsService.getHall(id).subscribe({
      next: (detail: HallDetail) => {
        this.selectedHallData.set(detail);
        this.applyHallDetail(detail);
        this.loadingHall.set(false);
      },
      error: () => {
        this.loadHallError.set(true);
        this.loadingHall.set(false);
      },
    });
  }

  private applyHallDetail(detail: HallDetail) {
    this.hallForm.patchValue({
      name: detail.name,
      status: detail.status,
      typeId: detail.type.id ?? '',
      supports3D: detail.supports3D,
    });
    this.applyLayoutData(detail);
    this.initialSnapshot.set(this.serializeState());
  }

  protected selectSeatCategory(category: SeatCategoryItem) {
    this.selectedSeatCategory.set(category);
  }

  protected setOnSiteOnly(value: boolean) {
    this.onSiteOnlyPreference.set(value);
  }

  protected toggleEditMode() {
    if (this.isEditMode() && this.hasChanges()) {
      this.discardVisible.set(true);
      return;
    }
    this.isEditMode.update((v) => !v);
  }

  protected confirmDiscard() {
    this.discardVisible.set(false);
    this.isEditMode.set(false);
    this.applyHallDetail(this.selectedHallData()!);
  }

  private restoreOriginalLayout() {
    const detail = this.selectedHallData();
    if (detail) {
      this.applyLayoutData(detail);
    } else {
      this.layoutBaseline.set(null);
      this.hallForm.patchValue({
        numberOfRows: null,
        seatsPerRow: null,
        normalPrice: null,
        vipPrice: null,
      });
      this.seatLayout.set([]);
    }
  }

  protected onResetLayout() {
    const baseline = this.layoutBaseline();
    if (baseline) {
      this.hallForm.patchValue(baseline);
      this.seatLayout.set(this.deepCopyGrid(baseline.grid));
    } else {
      this.hallForm.patchValue({
        numberOfRows: null,
        seatsPerRow: null,
        normalPrice: null,
        vipPrice: null,
      });
      this.seatLayout.set([]);
    }
  }

  private copyLayoutFrom(hallId: string) {
    this.hallsService.getHallLayout(hallId).subscribe({
      next: (hallLayout) => this.applyLayoutData(hallLayout),
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

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        this.saving.set(false);
        if (existing) {
          this.hallUpdated.emit(result);
          this.toastService.success('Hall updated');
        } else {
          this.hallCreated.emit(result);
          this.toastService.success('Hall created');
        }
        this.visible.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  private serializeState(): string {
    return JSON.stringify({
      form: this.hallForm.getRawValue(),
      grid: this.seatLayout(),
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
    const seatLayout = this.seatLayout();
    const categories: Partial<Record<SeatCategory, string[]>> = {};
    const onSiteOnly: string[] = [];

    for (let rowIdx = 0; rowIdx < seatLayout.length; rowIdx++) {
      const label = rowLabel(rowIdx);
      for (let colIdx = 0; colIdx < seatLayout[rowIdx].length; colIdx++) {
        const seat = seatLayout[rowIdx][colIdx];
        const seatId = `${label}${colIdx + 1}`;
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

  private extractPrices(pricing: TicketPricing[] | undefined): {
    normalPrice: number | null;
    vipPrice: number | null;
  } {
    return {
      normalPrice: pricing?.find((p) => p.seatCategory === 'NORMAL')?.price ?? null,
      vipPrice: pricing?.find((p) => p.seatCategory === 'VIP')?.price ?? null,
    };
  }

  private deepCopyGrid(grid: Seat[][]): Seat[][] {
    return grid.map((row) => row.map((seat) => ({ ...seat })));
  }

  private applyLayoutData(source: HallLayout): void {
    const { normalPrice, vipPrice } = this.extractPrices(source.ticketPricing);

    this.hallForm.patchValue({
      numberOfRows: source.numberOfRows,
      seatsPerRow: source.seatsPerRow,
      normalPrice,
      vipPrice,
    });

    const grid = this.convertApiLayoutToSeatGrid(
      source.layout,
      source.numberOfRows,
      source.seatsPerRow,
    );
    this.seatLayout.set(grid);
    this.layoutBaseline.set({
      numberOfRows: source.numberOfRows,
      seatsPerRow: source.seatsPerRow,
      normalPrice,
      vipPrice,
      grid: this.deepCopyGrid(grid),
    });
  }

  private convertApiLayoutToSeatGrid(layout: SeatLayout, rows: number, cols: number): Seat[][] {
    const grid: Seat[][] = createSeatGrid(rows, cols);

    const onSiteOnlySet = new Set(layout.onSiteOnly ?? []);

    for (const [category, positions] of Object.entries(layout.categories ?? {})) {
      const seatType = category as SeatCategory;
      for (const pos of positions!) {
        const { rowIdx, colIdx } = this.parseSeatPosition(pos);
        if (rowIdx < rows && colIdx < cols) {
          grid[rowIdx][colIdx] = { type: seatType, onsiteOnly: onSiteOnlySet.has(pos) };
        }
      }
    }

    // Handle NORMAL seats that are onSiteOnly (not in categories since NORMAL is the default)
    for (const pos of onSiteOnlySet) {
      const { rowIdx, colIdx } = this.parseSeatPosition(pos);
      if (rowIdx < rows && colIdx < cols) {
        grid[rowIdx][colIdx].onsiteOnly = true;
      }
    }

    return grid;
  }

  private parseSeatPosition(pos: string): { rowIdx: number; colIdx: number } {
    const match = pos.match(/^([A-Z]+)(\d+)$/);
    return {
      rowIdx: rowLabelToIndex(match![1]),
      colIdx: parseInt(match![2]) - 1,
    };
  }
}
