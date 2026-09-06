import { Component, computed, input, linkedSignal, output } from "@angular/core";
import { SEAT_CATEGORY_LABEL, type Seat, type SeatCategory } from "cinefy-ui/types";

interface LegendItem {
  value: SeatCategory | "TAKEN" | "SELECTED";
  label: string;
}

const LEGEND_CATEGORIES: SeatCategory[] = ["NORMAL", "VIP"];

const FIXED_LEGEND_ITEMS: LegendItem[] = [
  { value: "TAKEN", label: "Taken" },
  { value: "SELECTED", label: "Selected" },
];

@Component({
  selector: "cui-seat-map",
  imports: [],
  templateUrl: "./cinefy-seat-map.html",
  styleUrl: "./cinefy-seat-map.scss",
})
export class CinefySeatMap {
  readonly rows = input.required<Seat[][]>();
  readonly initialSelectedIds = input<string[]>([]);
  readonly allowOnSiteOnly = input(false);

  readonly selectionChange = output<Seat[]>();

  private readonly selectedIds = linkedSignal<Set<string>>(() => new Set(this.initialSelectedIds()));

  protected readonly legendItems = computed<LegendItem[]>(() => {
    const present = new Set(
      this.rows()
        .flat()
        .map((seat) => seat.category),
    );
    return [
      ...LEGEND_CATEGORIES.filter((category) => present.has(category)).map((category) => ({
        value: category,
        label: SEAT_CATEGORY_LABEL[category],
      })),
      ...FIXED_LEGEND_ITEMS,
    ];
  });

  private readonly selectedSeats = computed(() => {
    const ids = this.selectedIds();
    return this.rows()
      .flat()
      .filter((seat) => ids.has(seat.id));
  });

  protected isTaken(seat: Seat): boolean {
    return seat.taken || (seat.onSiteOnly && !this.allowOnSiteOnly());
  }

  protected isSelected(seat: Seat): boolean {
    return this.selectedIds().has(seat.id);
  }

  protected toggle(seat: Seat): void {
    if (seat.category === "AISLE" || this.isTaken(seat)) return;
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
