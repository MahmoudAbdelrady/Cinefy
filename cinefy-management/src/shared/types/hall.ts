interface HallType {
  id: string;
  name: string;
}

interface HallListItem {
  id: string;
  name: string;
}

interface HallItem {
  id: string;
  name: string;
  status: 'now_showing' | 'scheduled' | 'under_maintenance' | 'inactive' | null;
  rows: number;
  seatsPerRow: number;
  currentMovie: string | null;
  occupancy: number;
}

export type { HallType, HallListItem, HallItem };
