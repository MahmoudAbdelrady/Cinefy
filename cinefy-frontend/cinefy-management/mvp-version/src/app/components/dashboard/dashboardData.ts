/** Mock data for the dashboard widgets. Shapes follow the real API DTOs. */

export const CURRENCY = 'EGP';

export const TODAY_LABEL = 'Tuesday, 24 August';

// ─── Today's statistics ──────────────────────────────────────────────────────
// StatisticsPeriodTotals in the real app. The dashboard renders `current` only —
// no previous-period comparison, that stays on the Statistics page.

export type TodayTotals = {
  ticketsSold: number;
  netRevenue: number;
  refunded: number;
  occupancy: number;
};

export const TODAY_TOTALS: TodayTotals = {
  ticketsSold: 342,
  netRevenue: 48150,
  refunded: 1240,
  occupancy: 0.84,
};

// ─── Today's schedule ────────────────────────────────────────────────────────

export type ScreeningStatus = 'running' | 'upcoming' | 'finished';

export type Screening = {
  id: string;
  title: string;
  poster: string;
  hall: string;
  sold: number;
  capacity: number;
  startsAt: string;
  endsAt: string;
  status: ScreeningStatus;
  /** Minutes until the doors open. Only set while `status` is upcoming. */
  startsInMinutes?: number;
};

/** An upcoming screening within this window is tagged as starting soon. */
export const STARTS_SOON_MINUTES = 45;

export function startsSoon(screening: Screening): boolean {
  return (
    screening.status === 'upcoming' &&
    screening.startsInMinutes !== undefined &&
    screening.startsInMinutes <= STARTS_SOON_MINUTES
  );
}

export const TODAY_SCREENINGS: Screening[] = [
  {
    id: 'sh_01',
    title: 'Wicked',
    poster:
      'https://images.unsplash.com/photo-1572188863110-46d457c9234d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    hall: 'Hall 2',
    sold: 166,
    capacity: 180,
    startsAt: '13:15',
    endsAt: '15:56',
    status: 'running',
  },
  {
    id: 'sh_02',
    title: 'Dune: Part Two',
    poster:
      'https://images.unsplash.com/photo-1761948245703-cbf27a3e7502?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    hall: 'Hall 1',
    sold: 172,
    capacity: 220,
    startsAt: '14:00',
    endsAt: '16:46',
    status: 'running',
  },
  {
    id: 'sh_07',
    title: 'Inside Out 2',
    poster:
      'https://images.unsplash.com/photo-1618410321132-9f4cebb2f7f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    hall: 'Hall 5',
    sold: 94,
    capacity: 140,
    startsAt: '14:50',
    endsAt: '16:26',
    status: 'upcoming',
    startsInMinutes: 28,
  },
  {
    id: 'sh_03',
    title: 'Nosferatu',
    poster:
      'https://images.unsplash.com/photo-1758232589439-f5ec09dc92c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    hall: 'Hall 4',
    sold: 37,
    capacity: 60,
    startsAt: '15:00',
    endsAt: '16:47',
    status: 'upcoming',
    startsInMinutes: 38,
  },
  {
    id: 'sh_04',
    title: 'Dune: Part Two',
    poster:
      'https://images.unsplash.com/photo-1761948245703-cbf27a3e7502?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    hall: 'Hall 1',
    sold: 26,
    capacity: 220,
    startsAt: '17:30',
    endsAt: '20:16',
    status: 'upcoming',
  },
  {
    id: 'sh_05',
    title: 'The Brutalist',
    poster:
      'https://images.unsplash.com/photo-1753944847480-92f369a5f00e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    hall: 'Hall 4',
    sold: 44,
    capacity: 60,
    startsAt: '20:30',
    endsAt: '23:45',
    status: 'upcoming',
  },
  {
    id: 'sh_06',
    title: 'Inside Out 2',
    poster:
      'https://images.unsplash.com/photo-1618410321132-9f4cebb2f7f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    hall: 'Hall 5',
    sold: 71,
    capacity: 140,
    startsAt: '10:30',
    endsAt: '12:06',
    status: 'finished',
  },
];

export const RUNNING_NOW = TODAY_SCREENINGS.filter((s) => s.status === 'running').length;

// ─── Halls ───────────────────────────────────────────────────────────────────
// HallStatus in the real app. "Active" counts ACTIVE + SCHEDULED, per
// ACTIVE_HALL_STATUSES.

export type HallStatusKey = 'active' | 'scheduled' | 'maintenance' | 'inactive';

export type HallStatusCount = {
  key: HallStatusKey;
  label: string;
  count: number;
  /** Tailwind background used for both the bar segment and the legend swatch. */
  swatch: string;
};

export const HALL_STATUS_COUNTS: HallStatusCount[] = [
  { key: 'active', label: 'Active', count: 5, swatch: 'bg-green-500' },
  { key: 'scheduled', label: 'Scheduled', count: 1, swatch: 'bg-blue-500' },
  { key: 'maintenance', label: 'Under maintenance', count: 1, swatch: 'bg-amber-500' },
  { key: 'inactive', label: 'Inactive', count: 1, swatch: 'bg-gray-300' },
];

const OPERATING: HallStatusKey[] = ['active', 'scheduled'];

export const TOTAL_HALLS = HALL_STATUS_COUNTS.reduce((sum, s) => sum + s.count, 0);

export const ACTIVE_HALLS = HALL_STATUS_COUNTS.filter((s) => OPERATING.includes(s.key)).reduce(
  (sum, s) => sum + s.count,
  0,
);

// ─── Payment gateway ─────────────────────────────────────────────────────────
// PaymentGatewayList.active is optional in the real API — "no active gateway"
// is a real state, not a loading artefact.

export type GatewayChannel = {
  name: string;
  currency: string;
  active: boolean;
};

export type ActiveGatewayInfo = {
  name: string;
  provider: string;
  standByCount: number;
  channels: GatewayChannel[];
};

export const ACTIVE_GATEWAY: ActiveGatewayInfo = {
  name: 'Primary Paymob',
  provider: 'Paymob',
  standByCount: 2,
  channels: [
    { name: 'Card', currency: 'EGP', active: true },
    { name: 'Mobile wallet', currency: 'EGP', active: true },
    { name: 'Card', currency: 'USD', active: false },
  ],
};

/** Prototype-only: the three states the widget has to render. */
export type GatewayPreview = 'active' | 'noChannels' | 'none';

export function gatewayForPreview(preview: GatewayPreview): ActiveGatewayInfo | null {
  if (preview === 'none') return null;
  if (preview === 'active') return ACTIVE_GATEWAY;
  return {
    ...ACTIVE_GATEWAY,
    channels: ACTIVE_GATEWAY.channels.map((channel) => ({ ...channel, active: false })),
  };
}

// ─── On shift ────────────────────────────────────────────────────────────────
// Computed from each staff member's working days and hours — there is no shift
// entity in the API.

export type ShiftCount = {
  label: string;
  count: number;
};

export const ON_SHIFT_COUNTS: ShiftCount[] = [
  { label: 'Managers', count: 1 },
  { label: 'Cashiers', count: 2 },
  { label: 'Ushers', count: 3 },
];

export const ON_SHIFT_TOTAL = ON_SHIFT_COUNTS.reduce((sum, p) => sum + p.count, 0);

export const STAFF_TOTAL = 14;

// ─── Formatting ──────────────────────────────────────────────────────────────

export function formatMoney(amount: number): string {
  return amount.toLocaleString('en-US');
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}
