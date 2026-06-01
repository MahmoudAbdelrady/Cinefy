import { cn } from '@/lib/utils'

/**
 * A faux QR code generated deterministically from a seed string — no library,
 * no network. Purely decorative; it reads as "scannable ticket" in the mock.
 */
export function QrStub({ seed, className }: { seed: string; className?: string }) {
  const cells = 11
  // deterministic fill from the seed's char codes
  const bit = (i: number) => {
    let h = 0
    for (let k = 0; k < seed.length; k++) {
      h = (h * 31 + seed.charCodeAt(k) + i * 13) & 0xffff
    }
    return (h % 7) < 3
  }

  return (
    <div
      className={cn(
        'grid aspect-square gap-[2px] rounded-md bg-white p-2',
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${cells}, 1fr)` }}
    >
      {Array.from({ length: cells * cells }, (_, i) => {
        // force the three finder squares in the corners
        const r = Math.floor(i / cells)
        const c = i % cells
        const finder =
          (r < 3 && c < 3) ||
          (r < 3 && c > cells - 4) ||
          (r > cells - 4 && c < 3)
        const on = finder || bit(i)
        return (
          <span
            key={i}
            className={on ? 'rounded-[1px] bg-neutral-900' : 'bg-transparent'}
          />
        )
      })}
    </div>
  )
}
