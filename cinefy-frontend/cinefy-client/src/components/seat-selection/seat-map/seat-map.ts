import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { SEAT_KIND_LABEL, type Seat, type SeatKind } from '../../../shared/types';

interface LegendItem {
  value: SeatKind;
  label: string;
}

@Component({
  selector: 'seat-map',
  imports: [],
  templateUrl: './seat-map.html',
  styleUrl: './seat-map.scss',
})
export class SeatMapComponent {
  protected readonly legendItems: LegendItem[] = (
    Object.entries(SEAT_KIND_LABEL) as [SeatKind, string][]
  )
    .filter(([value]) => value !== 'AISLE')
    .map(([value, label]) => ({ value, label }));

  readonly rows = input.required<Seat[][]>();
  readonly initialSelectedIds = input<string[]>([]);

  readonly selectionChange = output<Seat[]>();

  private readonly selectedIds = linkedSignal<Set<string>>(
    () => new Set(this.initialSelectedIds()),
  );

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
