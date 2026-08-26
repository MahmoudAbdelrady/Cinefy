/**
 * Position-based access — mirrors `src/shared/access.ts` in the Angular app.
 *
 * The dashboard's composition rule lives here: a widget is a preview of a page,
 * so a position only sees the widget if it can open that page. Otherwise the
 * dashboard becomes a way around the nav restrictions.
 */

export type StaffPosition = 'Manager' | 'Cashier' | 'Projectionist' | 'Usher' | 'Concessions';

export type NavSection =
  | 'dashboard'
  | 'halls'
  | 'movies'
  | 'payment'
  | 'statistics'
  | 'staff'
  | 'profile';

const SECTION_ACCESS: Record<NavSection, readonly StaffPosition[] | 'all'> = {
  dashboard: 'all',
  profile: 'all',
  halls: ['Manager'],
  movies: ['Manager', 'Cashier'],
  payment: ['Manager'],
  statistics: ['Manager'],
  staff: ['Manager'],
};

export function canAccessSection(section: NavSection, position: StaffPosition): boolean {
  const allowed = SECTION_ACCESS[section];
  return allowed === 'all' || allowed.includes(position);
}

// ─── Dashboard composition ───────────────────────────────────────────────────

export type DashboardWidget = 'statistics' | 'schedule' | 'halls' | 'gateway' | 'onShift';

/** Each widget previews exactly one page, and inherits that page's access. */
const WIDGET_SECTION: Record<DashboardWidget, NavSection> = {
  statistics: 'statistics',
  schedule: 'movies',
  halls: 'halls',
  gateway: 'payment',
  onShift: 'staff',
};

const WIDGET_ORDER: readonly DashboardWidget[] = [
  'statistics',
  'schedule',
  'halls',
  'gateway',
  'onShift',
];

export function dashboardWidgetsFor(position: StaffPosition): DashboardWidget[] {
  return WIDGET_ORDER.filter((widget) => canAccessSection(WIDGET_SECTION[widget], position));
}

/**
 * A position with nothing to preview gets the ticket scanner as its whole
 * dashboard — otherwise it would sign in to an empty page. The backend already
 * allows this: BookingController.scanTicket permits ADMIN, MANAGER, CASHIER
 * and USHER.
 */
export function showsScannerAsPage(position: StaffPosition): boolean {
  return dashboardWidgetsFor(position).length === 0;
}
