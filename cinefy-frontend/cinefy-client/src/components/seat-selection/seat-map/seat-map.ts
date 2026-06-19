import { Component, computed, input, output, signal } from '@angular/core';
import { SEAT_KIND_LABEL, type Seat, type SeatKind } from '../../../shared/types';

interface LegendItem {
  value: Exclude<SeatKind, 'AISLE'>;
  label: string;
}

@Component({
  selector: 'seat-map',
  imports: [],
  templateUrl: './seat-map.html',
  styleUrl: './seat-map.scss',
})
export class SeatMapComponent {
  protected readonly legendItems: LegendItem[] = Object.entries(SEAT_KIND_LABEL).map(
    ([value, label]) => ({ value: value as LegendItem['value'], label }),
  );

  readonly rows = input.required<Seat[][]>();

  readonly selectionChange = output<Seat[]>();

  private readonly selectedIds = signal<Set<string>>(new Set());

  private readonly selectedSeats = computed(() => {
    const ids = this.selectedIds();
    return this.rows()
      .flat()
      .filter((seat) => ids.has(seat.id));
  });

  protected isSelected(seat: Seat): boolean {
    return this.selectedIds().has(seat.id);
  }

  protected toggle(seat: Seat): void {
    if (seat.kind === 'TAKEN' || seat.kind === 'AISLE') return;
    this.selectedIds.update((prev) => {
      const next = new Set(prev);
      if (next.has(seat.id)) {
        next.delete(seat.id);
      } else {
        next.add(seat.id);
      }
      return next;
    });
    this.selectionChange.emit(this.selectedSeats());
  }
}
