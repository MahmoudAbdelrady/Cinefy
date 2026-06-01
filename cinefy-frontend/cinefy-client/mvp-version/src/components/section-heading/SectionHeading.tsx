import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

interface SectionHeadingProps {
  title: string
  action?: string
  /** when set, the action renders as a link to this route */
  actionTo?: string
}

export function SectionHeading({ title, action, actionTo }: SectionHeadingProps) {
  return (
    <div className="mb-8 flex items-center justify-between gap-4">
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      {action &&
        (actionTo ? (
          <Button asChild variant="link" className="text-amber hover:text-amber/80">
            <Link to={actionTo}>{action}</Link>
          </Button>
        ) : (
          <Button variant="link" className="text-amber hover:text-amber/80">
            {action}
          </Button>
        ))}
    </div>
  )
}
