import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '../lib/utils'

const statusVariants = cva(
  'inline-flex items-center gap-1 rounded font-label-sm text-label-sm border uppercase px-2 py-0.5',
  {
    variants: {
      status: {
        draft: 'bg-status-draft/10 text-status-draft border-status-draft/20',
        review: 'bg-status-review/10 text-status-review border-status-review/20',
        in_review: 'bg-status-review/10 text-status-review border-status-review/20',
        final: 'bg-status-final/10 text-status-final border-status-final/20',
        validated: 'bg-status-final/10 text-status-final border-status-final/20',
        active: 'bg-status-final/10 text-status-final border-status-final/20',
        rejected: 'bg-error/10 text-error border-error/20',
        reviewed: 'bg-status-review/10 text-status-review border-status-review/20',
        autonomous: 'bg-ai-vibrant/10 text-ai-vibrant border-ai-vibrant/20',
      },
    },
    defaultVariants: { status: 'draft' },
  },
)

const LABELS: Record<string, string> = {
  draft: 'BROUILLON',
  review: 'REVISION',
  in_review: 'EN REVISION',
  final: 'VALIDE',
  validated: 'VALIDE',
  active: 'EDITION ACTIVE',
  rejected: 'REJETE',
  reviewed: 'EXAMINE',
  autonomous: 'AUTONOME',
}

interface StatusBadgeProps extends VariantProps<typeof statusVariants> {
  className?: string
  children?: React.ReactNode
}

export default function StatusBadge({ status = 'draft', className, children }: StatusBadgeProps) {
  const key = (status as string) || 'draft'
  return (
    <span className={cn(statusVariants({ status: key as any }), className)}>
      {children || LABELS[key] || 'BROUILLON'}
    </span>
  )
}
