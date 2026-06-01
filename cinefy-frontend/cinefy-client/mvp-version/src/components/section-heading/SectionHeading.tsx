import { Button } from '@/components/ui/button'

interface SectionHeadingProps {
  title: string
  action?: string
}

export function SectionHeading({ title, action }: SectionHeadingProps) {
  return (
    <div className="mb-8 flex items-center justify-between gap-4">
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      {action && (
        <Button variant="link" className="text-amber hover:text-amber/80">
          {action}
        </Button>
      )}
    </div>
  )
}
