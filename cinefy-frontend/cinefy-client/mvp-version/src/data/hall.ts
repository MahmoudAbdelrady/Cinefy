export type SeatTier = 'standard' | 'premium' | 'recliner'

export interface Seat {
  id: string
  row: string
  number: number
  tier: SeatTier
  taken: boolean
  /** surcharge added on top of the showtime base price, in cents */
  surchargeCents: number
}

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
const COLS = 12
/** aisle gaps rendered after these 1-based column numbers */
export const AISLE_AFTER_COLS = [2, 9]

const TIER_SURCHARGE: Record<SeatTier, number> = {
  standard: 0,
  premium: 500,
  recliner: 1000,
}

/** Rows D–G are premium, H–J recliner, the rest standard (matches v2 zoning). */
function tierForRow(rowIdx: number): SeatTier {
  if (rowIdx >= 7) return 'recliner'
  if (rowIdx >= 3) return 'premium'
  return 'standard'
}

/**
 * Deterministic "taken" pattern — looks lived-in, renders identically every
 * time (no Math.random; the mock must be stable across reloads/SSR).
 */
function isTaken(rowIdx: number, col: number): boolean {
  const h = (rowIdx * 31 + col * 17 + rowIdx * col * 7) % 100
  return h < 22
}

export function buildHall(): Seat[][] {
  return ROWS.map((row, rowIdx) => {
    const tier = tierForRow(rowIdx)
    return Array.from({ length: COLS }, (_, c) => {
      const number = c + 1
      return {
        id: `${row}${number}`,
        row,
        number,
        tier,
        taken: isTaken(rowIdx, c),
        surchargeCents: TIER_SURCHARGE[tier],
      }
    })
  })
}

export const tierLabel: Record<SeatTier, string> = {
  standard: 'Standard',
  premium: 'Premium',
  recliner: 'Recliner',
}

/** Look up seats by id (e.g. to re-price a saved booking from its seat ids). */
export function seatsByIds(ids: string[]): Seat[] {
  const all = new Map(buildHall().flat().map((s) => [s.id, s]))
  return ids.map((id) => all.get(id)).filter((s): s is Seat => Boolean(s))
}

export function surchargeForSeats(ids: string[]): number {
  return seatsByIds(ids).reduce((sum, s) => sum + s.surchargeCents, 0)
}
