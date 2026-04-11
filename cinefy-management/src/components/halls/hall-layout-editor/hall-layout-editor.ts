import { Component, computed, effect, input, output, signal } from '@angular/core';
import { NgpButton } from 'ng-primitives/button';
import type { SeatCategory } from '../../../shared/types';

export interface Seat {
  type: SeatCategory;
  onsiteOnly: boolean;
}

interface SeatStats {
  normal: number;
  vip: number;
  onsiteOnly: number;
  total: number;
}

@Component({
  selector: 'hall-layout-editor',
  imports: [NgpButton],
  templateUrl: './hall-layout-editor.html',
  styleUrl: './hall-layout-editor.scss',
})
export class HallLayoutEditorComponent {
  readonly numRows = input(10);
  readonly seatsPerRow = input(12);
  readonly selectedSeatType = input<SeatCategory>('NORMAL');
  readonly selectedOnsiteOnly = input(false);
  readonly disabled = input(false);
  readonly seatChanged = output<void>();
  readonly layoutReset = output<void>();

  private readonly _seatLayout = signal<Seat[][]>([]);
  readonly seatLayout = this._seatLayout.asReadonly();

  protected readonly rowLabelWidth = computed(() => {
    const rows = this.numRows();
    const maxChars = rows <= 0 ? 1 : this.rowLabel(rows - 1).length;
    return Math.max(24, maxChars * 10);
  });

  readonly stats = computed<SeatStats>(() => {
    let normal = 0;
    let vip = 0;
    let onsiteOnly = 0;
    let total = 0;

    for (const row of this.seatLayout()) {
      for (const seat of row) {
        if (seat.type !== 'AISLE') {
          total++;
          if (seat.type === 'NORMAL') normal++;
          else if (seat.type === 'VIP') vip++;
          if (seat.onsiteOnly) onsiteOnly++;
        }
      }
    }

    return { normal, vip, onsiteOnly, total };
  });

  constructor() {
    effect(() => {
      const rows = this.numRows();
      const cols = this.seatsPerRow();
      this.initializeLayout(rows, cols);
    });
  }

  rowLabel(index: number): string {
    const letter = String.fromCharCode(65 + (index % 26));
    const repeat = Math.floor(index / 26) + 1;
    return letter.repeat(repeat);
  }

  protected seatTitle(rowIndex: number, seatIndex: number, seat: Seat): string {
    const id = `${this.rowLabel(rowIndex)}${seatIndex + 1}`;
    const action = this.disabled() ? '' : ' - Click to change';
    if (seat.type === 'AISLE') return `${id} (Aisle)${action}`;
    const label = seat.type === 'VIP' ? 'VIP' : 'Normal';
    const onsite = seat.onsiteOnly ? ', On-Site Only' : '';
    return `${id} (${label}${onsite})${action}`;
  }

  protected handleSeatClick(rowIndex: number, colIndex: number) {
    if (this.disabled()) return;
    const type = this.selectedSeatType();
    const onsiteOnly = type === 'AISLE' ? false : this.selectedOnsiteOnly();
    const currentSeat = this._seatLayout()[rowIndex]?.[colIndex];
    const layoutChanged =
      currentSeat && (currentSeat.type !== type || currentSeat.onsiteOnly !== onsiteOnly);

    this._seatLayout.update((layout) =>
      layout.map((row, ri) =>
        ri === rowIndex
          ? row.map((seat, ci) => (ci === colIndex ? { type, onsiteOnly } : seat))
          : row,
      ),
    );

    if (layoutChanged) {
      this.seatChanged.emit();
    }
  }

  setLayout(layout: Seat[][]) {
    this._seatLayout.set(layout);
  }

  private initializeLayout(rows: number, cols: number) {
    this._seatLayout.update((prev) => {
      const layout: Seat[][] = [];
      for (let i = 0; i < rows; i++) {
        const row: Seat[] = [];
        for (let j = 0; j < cols; j++) {
          if (prev.length > 0 && i < prev.length && j < prev[i].length) {
            row.push(prev[i][j]);
          } else {
            row.push({ type: 'NORMAL', onsiteOnly: false });
          }
        }
        layout.push(row);
      }
      return layout;
    });
  }
}
