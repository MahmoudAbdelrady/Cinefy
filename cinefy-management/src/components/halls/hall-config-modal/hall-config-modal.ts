import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { LucideAngularModule, Star } from 'lucide-angular';
import { DollarSignIcon, EditIcon, EyeIcon, LayoutIcon, SettingsIcon } from '../../../shared/icons';
import { NgpButton } from 'ng-primitives/button';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { NgpSwitch, NgpSwitchThumb } from 'ng-primitives/switch';
import { ModalComponent } from '../../modal/modal';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';
import { InputField } from '../../input-field/input-field';
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
  SeatCategoryItem,
  SeatLayout,
  TicketPricing,
} from '../../../shared/types';
import { CustomSelectComponent } from '../../drop-down/custom-select/custom-select';
import { PaginatedSelectComponent } from '../../drop-down/paginated-select/paginated-select';
import { HallLayoutEditorComponent } from '../hall-layout-editor/hall-layout-editor';
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
    NgpSwitch,
    NgpSwitchThumb,
    ModalComponent,
    LoadingSpinnerComponent,
    InputField,
    CustomSelectComponent,
    PaginatedSelectComponent,
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
    StarIcon: Star,
  };

  private readonly hallsService = inject(HallsService);
  private readonly toastService = inject(ToastService);
  private readonly layoutEditor = viewChild.required(HallLayoutEditorComponent);
  private readonly discardTrigger = viewChild<ElementRef>('discardTrigger');

  private static readonly AUTO_HALL_STATUSES: HallStatus[] = ['SCHEDULED', 'NOW_SHOWING'];

  private static readonly SELECTABLE_HALL_STATUS_ENTRIES = (
    Object.entries(HALL_STATUS_LABELS) as [HallStatus, string][]
  ).filter(([key]) => !HallConfigModalComponent.AUTO_HALL_STATUSES.includes(key));

  protected readonly hallStatusEntries = computed<[HallStatus, string][]>(() => {
    const current = this.selectedHallData()?.status;
    const base = HallConfigModalComponent.SELECTABLE_HALL_STATUS_ENTRIES;
    if (current && HallConfigModalComponent.AUTO_HALL_STATUSES.includes(current)) {
      return [...base, [current, HALL_STATUS_LABELS[current]]];
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

  readonly isEditMode = signal(false);
  private readonly selectedHallData = signal<HallDetail | null>(null);
  readonly hallTypes = signal<HallType[]>([]);
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
    return this.isEditMode() ? 'Edit Hall' : (this.selectedHallData()?.name ?? 'Loading...');
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
  private readonly statusValue = toSignal(this.hallForm.controls.status.valueChanges, {
    initialValue: this.hallForm.controls.status.value,
  });
  protected readonly hasNormalSeats = computed(() => this.layoutEditor().stats().normal > 0);
  protected readonly hasVipSeats = computed(() => this.layoutEditor().stats().vip > 0);
  protected readonly onSiteOnly = computed(() =>
    this.selectedSeatCategory().type === 'AISLE' ? false : this.onSiteOnlyPreference(),
  );
  protected readonly statusEntry = computed(
    () => this.hallStatusEntries().find((e) => e[0] === this.statusValue()) ?? null,
  );
  private readonly currentFormValue = toSignal(this.hallForm.valueChanges, {
    initialValue: this.hallForm.getRawValue(),
  });
  protected readonly hasChanges = computed(() => {
    const snapshot = this.initialSnapshot();
    if (snapshot === null) return true;
    this.currentFormValue();
    this.layoutEditor().seatLayout();
    return this.serializeState() !== snapshot;
  });

  private serializeState(): string {
    return JSON.stringify({
      form: this.hallForm.getRawValue(),
      grid: this.layoutEditor().seatLayout(),
    });
  }

  protected readonly statusDisplayFn = (entry: [HallStatus, string]) => entry[1];
  protected readonly statusValueFn = (entry: [HallStatus, string]) => entry[0];
  protected readonly hallTypeDisplayFn = (type: HallType) => type.name;
  protected readonly hallTypeValueFn = (type: HallType) => type.id;
  protected readonly compareHallTypes = (a: HallType, b: HallType) => a?.id === b?.id;
  protected readonly fetchHalls = (page: number, size: number, search?: string) =>
    this.hallsService.getHalls(search, { page, size }, this.selectedHallId() ?? undefined);
  protected readonly hallDisplayFn = (hall: HallSummary) => hall.name;
  protected readonly hallValueFn = (hall: HallSummary) => hall.id;

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
      this.hallsService.getHallTypes().subscribe((types) => this.hallTypes.set(types));

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
      error: (err: HttpErrorResponse) => {
        this.loadingHall.set(false);
        this.toastService.error(err.error?.message ?? 'Failed to load hall data');
      },
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

  protected onStatusChange(entry: [HallStatus, string]) {
    this.hallForm.controls.status.setValue(entry[0]);
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
      this.layoutEditor().setLayout(this.createDefaultGrid());
    }
  }

  protected onResetLayout() {
    const baseline = this.layoutBaseline();
    if (baseline) {
      this.hallForm.patchValue(baseline);
      this.layoutEditor().setLayout(this.deepCopyGrid(baseline.grid));
    } else {
      this.hallForm.patchValue({
        numberOfRows: null,
        seatsPerRow: null,
        normalPrice: null,
        vipPrice: null,
      });
      this.layoutEditor().setLayout(this.createDefaultGrid());
    }
  }

  protected copyLayoutFrom(hall: HallSummary) {
    this.hallsService.getHallLayout(hall.id).subscribe({
      next: (hallLayout) => this.applyLayoutData(hallLayout),
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
          this.toastService.success('Hall updated');
        } else {
          this.hallCreated.emit(result);
          this.toastService.success('Hall created');
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

  private createDefaultGrid(rows = 10, cols = 12): Seat[][] {
    return Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ type: 'NORMAL' as SeatCategory, onsiteOnly: false })),
    );
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
    this.layoutEditor().setLayout(grid);
    this.layoutBaseline.set({
      numberOfRows: source.numberOfRows,
      seatsPerRow: source.seatsPerRow,
      normalPrice,
      vipPrice,
      grid: this.deepCopyGrid(grid),
    });
  }

  private convertApiLayoutToSeatGrid(layout: SeatLayout, rows: number, cols: number): Seat[][] {
    const grid: Seat[][] = this.createDefaultGrid(rows, cols);

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
      rowIdx: this.rowLabelToIndex(match![1]),
      colIdx: parseInt(match![2]) - 1,
    };
  }

  private rowLabelToIndex(label: string): number {
    const repeat = label.length;
    const letterCode = label.charCodeAt(0) - 65;
    return (repeat - 1) * 26 + letterCode;
  }
}
