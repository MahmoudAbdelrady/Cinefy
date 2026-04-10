import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
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
  HallStatus,
  Hall,
  SeatCategory,
  SeatCategoryItem,
  TicketPricing,
} from '../../../shared/types';
import { CustomSelectComponent } from '../../drop-down/custom-select/custom-select';
import { PaginatedSelectComponent } from '../../drop-down/paginated-select/paginated-select';
import { HallLayoutEditorComponent } from '../hall-layout-editor/hall-layout-editor';
import type { Seat } from '../hall-layout-editor/hall-layout-editor';
import { HallsService, ToastService } from '../../../services';

@Component({
  selector: 'hall-config-modal',
  imports: [
    NgClass,
    ReactiveFormsModule,
    LucideAngularModule,
    NgpButton,
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
  private readonly layoutEditor = viewChild.required(HallLayoutEditorComponent);

  readonly close = input.required<() => void>();
  readonly selectedHall = input<HallSummary | null>(null);
  readonly isEditMode = signal(false);

  readonly hallTypes = signal<HallType[]>([]);
  protected readonly saving = signal(false);

  protected readonly hallForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    numberOfRows: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
    }),
    seatsPerRow: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
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

  protected readonly numRowsValue = toSignal(this.hallForm.controls.numberOfRows.valueChanges, {
    initialValue: null,
  });
  protected readonly seatsPerRowValue = toSignal(this.hallForm.controls.seatsPerRow.valueChanges, {
    initialValue: null,
  });
  protected readonly supports3DValue = toSignal(this.hallForm.controls.supports3D.valueChanges, {
    initialValue: false,
  });

  protected readonly hallStatusEntries = Object.entries(HALL_STATUS_LABELS) as [
    HallStatus,
    string,
  ][];
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
  protected onSiteOnly = signal(false);

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
  }

  ngOnInit() {
    this.hallsService.getHallTypes().subscribe((types) => this.hallTypes.set(types));
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

  protected toggleEditMode() {
    this.isEditMode.update((v) => !v);
  }

  protected copyLayoutFrom(hall: HallSummary) {
    this.hallsService.getHallLayout(hall.id).subscribe({
      next: (hallLayout) => {
        this.hallForm.patchValue({
          numberOfRows: hallLayout.numberOfRows,
          seatsPerRow: hallLayout.seatsPerRow,
        });
        const grid = this.convertApiLayoutToSeatGrid(
          hallLayout.layout,
          hallLayout.numberOfRows,
          hallLayout.seatsPerRow,
        );
        this.layoutEditor().setLayout(grid);
      },
      error: (err: HttpErrorResponse) => {
        this.toastService.error(err.error?.message ?? 'Failed to copy layout');
      },
    });
  }

  protected saveHall() {
    if (this.hallForm.invalid) return;

    const formValue = this.hallForm.getRawValue();
    const layout = this.extractLayout();
    const ticketPricing = this.buildTicketPricing(formValue.normalPrice, formValue.vipPrice);

    const hall: Hall = {
      name: formValue.name,
      numberOfRows: formValue.numberOfRows!,
      seatsPerRow: formValue.seatsPerRow!,
      status: formValue.status,
      typeId: formValue.typeId,
      supports3D: formValue.supports3D,
      layout,
      ticketPricing,
    };

    this.saving.set(true);
    this.hallsService.createHall(hall).subscribe({
      next: () => {
        this.saving.set(false);
        this.toastService.success('Hall created successfully');
        this.close()();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.toastService.error(err.error?.message ?? 'Failed to create hall');
      },
    });
  }

  private extractLayout(): Partial<Record<SeatCategory, string[]>> {
    const editor = this.layoutEditor();
    const seatLayout = editor.seatLayout();
    const result: Partial<Record<SeatCategory, string[]>> = {};

    for (let rowIdx = 0; rowIdx < seatLayout.length; rowIdx++) {
      const rowLabel = editor.rowLabel(rowIdx);
      for (let colIdx = 0; colIdx < seatLayout[rowIdx].length; colIdx++) {
        const seat = seatLayout[rowIdx][colIdx];
        if (seat.type === 'NORMAL') continue;
        const category = seat.type;
        const seatId = `${rowLabel}${colIdx + 1}`;
        if (!result[category]) {
          result[category] = [];
        }
        result[category]!.push(seatId);
      }
    }

    return result;
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

  private convertApiLayoutToSeatGrid(
    layout: Partial<Record<SeatCategory, string[]>>,
    rows: number,
    cols: number,
  ): Seat[][] {
    const grid: Seat[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ type: 'NORMAL' as SeatCategory, onsiteOnly: false })),
    );

    for (const [category, positions] of Object.entries(layout)) {
      const seatType = category as SeatCategory;
      for (const pos of positions!) {
        const match = pos.match(/^([A-Z]+)(\d+)$/);
        if (!match) continue;
        const rowIdx = this.rowLabelToIndex(match[1]);
        const colIdx = parseInt(match[2]) - 1;
        if (rowIdx < rows && colIdx < cols) {
          grid[rowIdx][colIdx] = { type: seatType, onsiteOnly: false };
        }
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
