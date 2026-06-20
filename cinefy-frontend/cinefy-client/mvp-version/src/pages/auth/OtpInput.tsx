import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * A segmented one-time-code input. `length` cells, each a single digit, with
 * auto-advance, backspace-to-previous, full-code paste, and a blinking caret on
 * the focused empty cell. Calls `onComplete` when every cell is filled.
 */

interface OtpInputProps {
  length?: number
  value: string[]
  onChange: (next: string[]) => void
  onComplete?: (code: string) => void
}

export function OtpInput({ length = 6, value, onChange, onComplete }: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const [focused, setFocused] = useState<number | null>(null)

  const commit = (next: string[]) => {
    onChange(next)
    if (next.every((d) => d !== '')) onComplete?.(next.join(''))
  }

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1)
    const next = [...value]
    next[index] = digit
    commit(next)
    if (digit && index < length - 1) refs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (value[index]) {
        const next = [...value]
        next[index] = ''
        onChange(next)
      } else if (index > 0) {
        refs.current[index - 1]?.focus()
        const next = [...value]
        next[index - 1] = ''
        onChange(next)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      refs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length).split('')
    if (!digits.length) return
    const next = Array.from({ length }, (_, i) => digits[i] ?? '')
    commit(next)
    const last = Math.min(digits.length, length - 1)
    refs.current[last]?.focus()
  }

  return (
    <div className="flex justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => {
        const filled = value[i] !== ''
        const isFocused = focused === i
        return (
          <div key={i} className="relative flex-1">
            <input
              ref={(el) => {
                refs.current[i] = el
              }}
              inputMode="numeric"
              maxLength={1}
              value={value[i] ?? ''}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={() => setFocused(i)}
              onBlur={() => setFocused(null)}
              className={cn(
                'aspect-square w-full rounded-xl border bg-input/30 text-center font-mono text-2xl font-semibold text-foreground caret-transparent outline-none transition-all',
                'focus:border-amber focus:bg-amber/5 focus:ring-[3px] focus:ring-amber/25',
                filled ? 'border-amber/50' : 'border-input',
              )}
            />
            {isFocused && !filled && (
              <span className="auth-caret pointer-events-none absolute left-1/2 top-1/2 h-7 w-px -translate-x-1/2 -translate-y-1/2 bg-amber" />
            )}
          </div>
        )
      })}
    </div>
  )
}
