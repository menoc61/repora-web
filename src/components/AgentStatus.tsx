import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '../lib/utils'

const dotVariants = cva('w-2 h-2 rounded-full', {
  variants: {
    state: {
      final: 'bg-status-final',
      review: 'bg-status-review',
      draft: 'bg-status-draft',
      ai: 'bg-ai-vibrant',
      idle: 'bg-outline',
      thinking: 'bg-ai-vibrant animate-pulse',
      writing: 'bg-ai-vibrant animate-wave-active',
      error: 'bg-status-review',
      done: 'bg-status-final',
    },
  },
  defaultVariants: { state: 'idle' },
})

const STATE_LABELS: Record<string, string> = {
  final: 'final',
  review: 'revue',
  draft: 'brouillon',
  ai: 'ia',
  idle: 'inactif',
  thinking: 'reflexion',
  writing: 'redaction',
  error: 'erreur',
  done: 'termine',
}

interface AgentStatusProps extends VariantProps<typeof dotVariants> {
  name: string
  progress?: number
  children?: React.ReactNode
  className?: string
}

export function AgentStatus({ name, state = 'idle', progress, children, className }: AgentStatusProps) {
  return (
    <div className={cn('bg-white p-3 rounded border border-outline-variant shadow-sm', className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={dotVariants({ state })} />
          <span className="font-label-sm text-label-sm font-bold">{name}</span>
        </div>
        <span className="font-label-sm text-[10px] text-on-surface-variant uppercase">{STATE_LABELS[state as string] || state}</span>
      </div>
      {progress !== undefined ? (
        <div className="h-1 bg-surface-variant rounded-full overflow-hidden">
          <div
            className={`h-full bg-ai-vibrant ${state === 'thinking' ? 'animate-pulse' : ''}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : (
        children
      )}
    </div>
  )
}

export default AgentStatus
