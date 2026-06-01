import { Clapperboard } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <Clapperboard className="size-5 text-amber" />
          <span className="font-bold tracking-tight text-foreground">Cinefy</span>
        </div>
        <p className="text-xs">A design mock — every show is fictional.</p>
      </div>
    </footer>
  )
}
