import { Component, computed, input, output, signal } from '@angular/core';
import type { Seat } from '../../../shared/types';

@Component({
  selector: 'seat-map',
  imports: [],
  templateUrl: './seat-map.html',
  styleUrl: './seat-map.scss',
})
export class SeatMapComponent {
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
