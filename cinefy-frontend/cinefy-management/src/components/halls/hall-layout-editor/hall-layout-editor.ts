import { Component, computed, input, model, output } from '@angular/core';
import { Tooltip } from 'primeng/tooltip';
import { CinefyEmptyState, CinefyLoadingSpinner } from 'cinefy-ui/components';
import { seatRowLabel } from 'cinefy-ui/types';
import type { Seat, SeatCategory } from '../../../shared/types';
import { LayoutTemplateIcon } from '../../../shared/icons';

export interface SeatStats {
  normal: number;
  vip: number;
  onsiteOnly: number;
  total: number;
}

export function seatStats(layout: Seat[][]): SeatStats {
  let normal = 0;
  let vip = 0;
  let onsiteOnly = 0;
  let total = 0;

  for (const row of layout) {
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
}

@Component({
  selector: 'hall-layout-editor',
  imports: [CinefyEmptyState, CinefyLoadingSpinner, Tooltip],
  templateUrl: './hall-layout-editor.html',
  styleUrl: './hall-layout-editor.scss',
})
export class HallLayoutEditorComponent {
  protected readonly icons = {
    LayoutTemplateIcon,
  };

  readonly selectedSeatType = input<SeatCategory>('NORMAL');
  readonly selectedOnsiteOnly = input(false);
  readonly disabled = input(false);
  readonly loading = input(false);

  readonly seatLayout = model<Seat[][]>([]);

  readonly layoutReset = output<void>();

  protected readonly rowLabel = seatRowLabel;

  protected readonly hasLayout = computed(() => (this.seatLayout()[0]?.length ?? 0) > 0);

  protected readonly stats = computed(() => seatStats(this.seatLayout()));

  protected readonly rowLabelWidth = computed(() => {
    const rows = this.seatLayout().length;
    const maxChars = rows <= 0 ? 1 : seatRowLabel(rows - 1).length;
    return Math.max(24, maxChars * 10);
  });

  protected seatTitle(rowIndex: number, seatIndex: number, seat: Seat): string {
    const id = `${seatRowLabel(rowIndex)}${seatIndex + 1}`;
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
