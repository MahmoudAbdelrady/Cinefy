import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
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
import { catchError, EMPTY, finalize, map, switchMap, tap } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';
import { Tooltip } from 'primeng/tooltip';
import {
  DollarSignIcon,
  EditIcon,
  LayoutIcon,
  SettingsIcon,
  StarIcon,
} from '../../../shared/icons';
import {
  CinefyLoadingSpinner,
  CinefyErrorState,
  CinefyInput,
  CinefySelect,
  CinefySwitch,
  CinefyDialog,
  CinefyDialogHeader,
  CinefyDialogFooter,
} from 'cinefy-ui/components';
import { CinefyToastService } from 'cinefy-ui/services';
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
import { seatRowIndex, seatRowLabel } from 'cinefy-ui/types';
import { HallLayoutEditorComponent, seatStats } from '../hall-layout-editor/hall-layout-editor';
import { skipServerErrorToast } from 'cinefy-ui/http';
import { HallsService } from '../../../services';
import { RESOURCE_NAME_PATTERN } from '../../../shared/constants';

const MAX_GRID_DIMENSION = 50;
const MAX_PRICE_DECIMALS = 2;
const MAX_PRICE = 99_999_999.99;

function createSeatGrid(rows: number, cols: number): Seat[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ type: 'NORMAL' as SeatCategory, onsiteOnly: false })),
  );
}

function resizeGrid(prev: Seat[][], rows: number, cols: number): Seat[][] {
  const layout: Seat[][] = [];
  for (let i = 0; i < rows; i++) {
    const row: Seat[] = [];
    for (let j = 0; j < cols; j++) {
      if (i < prev.length && j < prev[i].length) {
        row.push(prev[i][j]);
      } else {
        row.push({ type: 'NORMAL', onsiteOnly: false });
      }
    }
    layout.push(row);
  }
  return layout;
}

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
    Tooltip,
    CinefySwitch,
    CinefyDialog,
    CinefyDialogHeader,
    CinefyDialogFooter,
    CinefyLoadingSpinner,
    CinefyErrorState,
    CinefyInput,
    CinefySelect,
    HallLayoutEditorComponent,
  ],
  templateUrl: './hall-config-modal.html',
  styleUrl: './hall-config-modal.scss',
})
export class HallConfigModalComponent {
  protected readonly icons = {
    DollarSignIcon,
    EditIcon,
    LayoutIcon,
    SettingsIcon,
    StarIcon,
  };
  protected readonly maxGridDimension = MAX_GRID_DIMENSION;

  private readonly dialog = viewChild.required(CinefyDialog);

  private readonly hallsService = inject(HallsService);
  private readonly toastService = inject(CinefyToastService);
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

  readonly selectedHallId = input<string | null>(null);
  readonly openInEditMode = input(false);

  readonly closed = output<void>();
  readonly hallCreated = output<HallSummary>();
  readonly hallUpdated = output<HallSummary>();

  protected readonly isEditing = linkedSignal(() => this.openInEditMode());
  private readonly selectedHallData = signal<HallDetail | null>(null);

  protected readonly saving = signal(false);
  private readonly layoutBaseline = signal<LayoutBaseline | null>(null);

  protected readonly loadingHall = signal(false);
  protected readonly loadHallError = signal(false);

  private readonly initialSnapshot = signal<string | null>(null);
  private readonly hallTypes = signal<HallType[]>([]);
  protected readonly loadingHallTypes = signal(true);
  private readonly halls = signal<HallSummary[]>([]);
  protected readonly loadingHalls = signal(true);
  protected readonly loadingCopiedLayout = signal(false);

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
    () => this.selectedHallId() !== null && !this.isEditing(),
  );
  protected readonly modalTitle = computed(() => {
    if (!this.selectedHallId()) return 'Add new hall';
    const hall = this.selectedHallData();
    const mode = this.isEditing() ? 'Edit' : 'View';
    return hall ? `${mode} ${hall.name} config` : `${mode} hall`;
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
      .pipe(
        switchMap((hallId) => this.copyLayoutFrom(hallId)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    afterNextRender(() => {
      this.hallsService
        .getHallTypes()
        .pipe(
          finalize(() => this.loadingHallTypes.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (types) => this.hallTypes.set(types),
          error: () => {},
        });
      this.hallsService
        .getHalls(this.selectedHallId() ?? undefined)
        .pipe(
          finalize(() => this.loadingHalls.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (halls) => this.halls.set(halls),
          error: () => {},
        });

      const hallId = this.selectedHallId();
      if (hallId) {
        this.loadHallData(hallId);
      }
    });
  }

  private loadHallData(id: string) {
    this.loadingHall.set(true);
    this.loadHallError.set(false);
    this.hallsService
      .getHall(id, skipServerErrorToast())
      .pipe(
        finalize(() => this.loadingHall.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (detail: HallDetail) => {
          this.selectedHallData.set(detail);
          this.applyHallDetail(detail);
        },
        error: () => this.loadHallError.set(true),
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

  private copyLayoutFrom(hallId: string | null) {
    if (!hallId) {
      this.loadingCopiedLayout.set(false);
      this.restoreOriginalLayout();
      return EMPTY;
    }

    this.loadingCopiedLayout.set(true);
    return this.hallsService.getHallLayout(hallId).pipe(
      tap((hallLayout) => {
        this.applyLayoutData(hallLayout);
        this.loadingCopiedLayout.set(false);
      }),
      catchError(() => {
        this.loadingCopiedLayout.set(false);
        return EMPTY;
      }),
    );
  }

  protected saveHall() {
    if (this.hallForm.invalid) return;

    const hall = this.buildHallPayload();
    const existing = this.selectedHallId();

    this.saving.set(true);
    const request$ = existing
      ? this.hallsService.updateHall(existing, hall)
      : this.hallsService.createHall(hall);

    request$
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          if (existing) {
            this.hallUpdated.emit(result);
            this.toastService.success('Hall updated');
          } else {
            this.hallCreated.emit(result);
            this.toastService.success('Hall created');
          }
          this.dialog().close();
        },
        error: () => {},
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
      const label = seatRowLabel(rowIdx);
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
      rowIdx: seatRowIndex(match![1]),
      colIdx: parseInt(match![2]) - 1,
    };
  }
}
