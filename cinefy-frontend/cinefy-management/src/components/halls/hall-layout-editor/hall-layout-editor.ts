import { Component, computed, input, model, output } from '@angular/core';
import { NgpButton } from 'ng-primitives/button';
import type { Seat, SeatCategory } from '../../../shared/types';
import { rowLabel, seatStats } from '../seat-layout';

@Component({
  selector: 'hall-layout-editor',
  imports: [NgpButton],
  templateUrl: './hall-layout-editor.html',
  styleUrl: './hall-layout-editor.scss',
})
export class HallLayoutEditorComponent {
  readonly selectedSeatType = input<SeatCategory>('NORMAL');
  readonly selectedOnsiteOnly = input(false);
  readonly disabled = input(false);

  readonly seatLayout = model<Seat[][]>([]);

  readonly layoutReset = output<void>();

  protected readonly rowLabel = rowLabel;

  protected readonly stats = computed(() => seatStats(this.seatLayout()));

  protected readonly rowLabelWidth = computed(() => {
    const rows = this.seatLayout().length;
    const maxChars = rows <= 0 ? 1 : rowLabel(rows - 1).length;
    return Math.max(24, maxChars * 10);
  });

  protected seatTitle(rowIndex: number, seatIndex: number, seat: Seat): string {
    const id = `${rowLabel(rowIndex)}${seatIndex + 1}`;
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

    this.seatLayout.update((layout) =>
      layout.map((row, ri) =>
        ri === rowIndex
          ? row.map((seat, ci) => (ci === colIndex ? { type, onsiteOnly } : seat))
          : row,
      ),
    );
  }
}
