import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
} from '../../../shared/icons';
import { NgpButton } from 'ng-primitives/button';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import {
  ModalComponent,
  LoadingSpinnerComponent,
  InputField,
  CustomSelectComponent,
  AsyncSelectComponent,
  Switch,
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
import {
  createDefaultGrid,
  resizeGrid,
  rowLabel,
  rowLabelToIndex,
  seatStats,
} from '../seat-layout';

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

@Component({
  selector: 'hall-config-modal',
  imports: [
    NgClass,
    ReactiveFormsModule,
    LucideDynamicIcon,
    NgpButton,
    NgpDialogTrigger,
    Switch,
    ModalComponent,
    LoadingSpinnerComponent,
    InputField,
    CustomSelectComponent,
    AsyncSelectComponent,
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
  };

  private readonly hallsService = inject(HallsService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly discardTrigger = viewChild<ElementRef>('discardTrigger');

  private static readonly AUTO_HALL_STATUSES: HallStatus[] = ['SCHEDULED', 'NOW_SHOWING'];

  private static readonly SELECTABLE_HALL_STATUS_ENTRIES = (
    Object.entries(HALL_STATUS_LABELS) as [HallStatus, string][]
  )
    .filter(([value]) => !HallConfigModalComponent.AUTO_HALL_STATUSES.includes(value))
    .map(([value, label]) => ({ value, label }));

  protected readonly hallStatusEntries = computed<HallStatusEntry[]>(() => {
    const current = this.selectedHallData()?.status;
    const base = HallConfigModalComponent.SELECTABLE_HALL_STATUS_ENTRIES;
    if (current && HallConfigModalComponent.AUTO_HALL_STATUSES.includes(current)) {
      return [...base, { value: current, label: HALL_STATUS_LABELS[current] }];
    }
    return base;
  });

  protected readonly isStatusLocked = computed(() => {
    const current = this.selectedHallData()?.status;
    return current ? HallConfigModalComponent.AUTO_HALL_STATUSES.includes(current) : false;
  });

  protected readonly seatCategoryItems: SeatCategoryItem[] = Object.entries(
    SEAT_CATEGORY_LABELS,
  ).map(([key, name]) => ({
    name,
    type: key as SeatCategory,
  }));

  readonly close = input.required<() => void>();
  readonly selectedHallId = input<string | null>(null);

  readonly hallCreated = output<HallSummary>();
  readonly hallUpdated = output<HallSummary>();

  protected readonly isEditMode = signal(false);
  private readonly selectedHallData = signal<HallDetail | null>(null);
  protected readonly hallTypes = toSignal(this.hallsService.getHallTypes(), {
    initialValue: [] as HallType[],
  });
  protected readonly saving = signal(false);
  private readonly layoutBaseline = signal<LayoutBaseline | null>(null);
  protected readonly loadingHall = signal(false);
  private readonly initialSnapshot = signal<string | null>(null);
  protected readonly selectedHallType = signal<HallType | null>(null);
  protected selectedSeatCategory = signal<SeatCategoryItem>(this.seatCategoryItems[0]);
  private readonly onSiteOnlyPreference = signal(false);

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

  protected readonly isViewMode = computed(
    () => this.selectedHallId() !== null && !this.isEditMode(),
  );
  protected readonly modalTitle = computed(() => {
    if (!this.selectedHallId()) return 'Add New Hall';
    return this.isEditMode() ? 'Edit Hall' : (this.selectedHallData()?.name ?? 'Loading…');
  });
  private readonly numRowsValue = toSignal(
    this.hallForm.controls.numberOfRows.valueChanges.pipe(
      map((v) => (v != null && v > 100 ? null : v)),
    ),
    { initialValue: null },
  );
  private readonly seatsPerRowValue = toSignal(
    this.hallForm.controls.seatsPerRow.valueChanges.pipe(
      map((v) => (v != null && v > 50 ? null : v)),
    ),
    { initialValue: null },
  );
  protected readonly seatLayout = linkedSignal<{ rows: number; cols: number }, Seat[][]>({
    source: () => ({ rows: this.numRowsValue() ?? 10, cols: this.seatsPerRowValue() ?? 12 }),
    computation: ({ rows, cols }, previous) => resizeGrid(previous?.value ?? [], rows, cols),
  });
  protected readonly supports3DValue = toSignal(this.hallForm.controls.supports3D.valueChanges, {
    initialValue: false,
  });
  private readonly statusValue = toSignal(this.hallForm.controls.status.valueChanges, {
    initialValue: this.hallForm.controls.status.value,
  });
  private readonly seatStatsValue = computed(() => seatStats(this.seatLayout()));
  protected readonly hasNormalSeats = computed(() => this.seatStatsValue().normal > 0);
  protected readonly hasVipSeats = computed(() => this.seatStatsValue().vip > 0);
  protected readonly onSiteOnly = computed(() =>
    this.selectedSeatCategory().type === 'AISLE' ? false : this.onSiteOnlyPreference(),
  );
  protected readonly statusEntry = computed(
    () => this.hallStatusEntries().find((e) => e.value === this.statusValue()) ?? null,
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

  protected readonly statusDisplayFn = (entry: HallStatusEntry) => entry.label;
  protected readonly statusValueFn = (entry: HallStatusEntry) => entry.value;
  protected readonly hallTypeDisplayFn = (type: HallType) => type.name;
  protected readonly hallTypeValueFn = (type: HallType) => type.id;
  protected readonly compareHallTypes = (a: HallType, b: HallType) => a?.id === b?.id;
  protected readonly hallDisplayFn = (hall: HallSummary) => hall.name;
  protected readonly hallValueFn = (hall: HallSummary) => hall.id;
  protected readonly fetchHalls = () =>
    this.hallsService.getHalls(this.selectedHallId() ?? undefined);

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

    afterNextRender(() => {
      const hallId = this.selectedHallId();
      if (hallId) {
        this.loadHallData(hallId);
      }
    });
  }

  private loadHallData(id: string) {
    this.loadingHall.set(true);
    this.hallsService.getHall(id).subscribe({
      next: (detail: HallDetail) => {
        this.selectedHallData.set(detail);
        this.applyHallDetail(detail);
        this.loadingHall.set(false);
      },
      error: () => this.loadingHall.set(false),
    });
  }

  private applyHallDetail(detail: HallDetail) {
    this.selectedHallType.set(detail.type);
    this.hallForm.patchValue({
      name: detail.name,
      status: detail.status,
      typeId: detail.type.id ?? '',
      supports3D: detail.supports3D,
    });
    this.applyLayoutData(detail);
    this.initialSnapshot.set(this.serializeState());
  }

  protected onStatusChange(entry: HallStatusEntry) {
    this.hallForm.controls.status.setValue(entry.value);
  }

  protected onHallTypeChange(type: HallType) {
    this.selectedHallType.set(type);
    this.hallForm.controls.typeId.setValue(type.id ?? '');
  }

  protected selectSeatCategory(category: SeatCategoryItem) {
    this.selectedSeatCategory.set(category);
  }

  protected setOnSiteOnly(value: boolean) {
    this.onSiteOnlyPreference.set(value);
  }

  protected toggleEditMode() {
    if (this.isEditMode() && this.hasChanges()) {
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
      this.applyLayoutData(detail);
    } else {
      this.layoutBaseline.set(null);
      this.hallForm.patchValue({
        numberOfRows: null,
        seatsPerRow: null,
        normalPrice: null,
        vipPrice: null,
      });
      this.seatLayout.set(createDefaultGrid());
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
      this.seatLayout.set(createDefaultGrid());
    }
  }

  protected copyLayoutFrom(hall: HallSummary) {
    this.hallsService.getHallLayout(hall.id).subscribe({
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
        this.close()();
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
    const grid: Seat[][] = createDefaultGrid(rows, cols);

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
