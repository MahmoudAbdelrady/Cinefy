import { Component, computed, effect, input, signal } from '@angular/core';
import { NgpButton } from 'ng-primitives/button';

type SeatType = 'normal' | 'vip' | 'aisle';

interface Seat {
  type: SeatType;
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
  readonly selectedSeatType = input<SeatType>('normal');
  readonly selectedOnsiteOnly = input(false);

  protected readonly seatLayout = signal<Seat[][]>([]);

  protected readonly rowLabelWidth = computed(() => {
    const rows = this.numRows();
    const maxChars = rows <= 0 ? 1 : this.rowLabel(rows - 1).length;
    return Math.max(24, maxChars * 10);
  });

  protected readonly stats = computed<SeatStats>(() => {
    let normal = 0;
    let vip = 0;
    let onsiteOnly = 0;
    let total = 0;

    for (const row of this.seatLayout()) {
      for (const seat of row) {
        if (seat.type !== 'aisle') {
          total++;
          if (seat.type === 'normal') normal++;
          else if (seat.type === 'vip') vip++;
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

  protected rowLabel(index: number): string {
    const letter = String.fromCharCode(65 + (index % 26));
    const repeat = Math.floor(index / 26) + 1;
    return letter.repeat(repeat);
  }

  protected seatTitle(rowIndex: number, seatIndex: number, seat: Seat): string {
    const id = `${this.rowLabel(rowIndex)}${seatIndex + 1}`;
    if (seat.type === 'aisle') return `${id} (Aisle) - Click to change`;
    const label = seat.type === 'vip' ? 'VIP' : 'Normal';
    const onsite = seat.onsiteOnly ? ', On-Site Only' : '';
    return `${id} (${label}${onsite}) - Click to change`;
  }

  protected handleSeatClick(rowIndex: number, colIndex: number) {
    const type = this.selectedSeatType();
    const onsiteOnly = type === 'aisle' ? false : this.selectedOnsiteOnly();

    this.seatLayout.update((layout) =>
      layout.map((row, ri) =>
        ri === rowIndex
          ? row.map((seat, ci) => (ci === colIndex ? { type, onsiteOnly } : seat))
          : row,
      ),
    );
  }

  protected resetLayout() {
    this.seatLayout.update((layout) =>
      layout.map((row) => row.map(() => ({ type: 'normal' as SeatType, onsiteOnly: false }))),
    );
  }

  private initializeLayout(rows: number, cols: number) {
    this.seatLayout.update((prev) => {
      const layout: Seat[][] = [];
      for (let i = 0; i < rows; i++) {
        const row: Seat[] = [];
        for (let j = 0; j < cols; j++) {
          if (prev.length > 0 && i < prev.length && j < prev[i].length) {
            row.push(prev[i][j]);
          } else {
            row.push({ type: 'normal', onsiteOnly: false });
          }
        }
        layout.push(row);
      }
      return layout;
    });
  }
}
