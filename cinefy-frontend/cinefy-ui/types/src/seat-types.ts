type SeatCategory = "NORMAL" | "VIP" | "AISLE";

const SEAT_CATEGORY_LABEL: Record<SeatCategory, string> = {
  NORMAL: "Normal",
  VIP: "Premium",
  AISLE: "Aisle",
};

interface Seat {
  id: string;
  row: string;
  number: number;
  category: SeatCategory;
  onSiteOnly: boolean;
  taken: boolean;
}

export { SEAT_CATEGORY_LABEL };
export type { Seat, SeatCategory };
