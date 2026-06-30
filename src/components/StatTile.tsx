import type { LucideIcon } from 'lucide-react'

interface Props {
  label: string
  value: string | number
  unit?: string
  icon?: LucideIcon
  accent?: string // hex; defaults to primary
}

export default function StatTile({ label, value, unit, icon: Icon, accent }: Props) {
  return (
    <div className="stat-tile">
      <div className="flex items-center justify-between">
        <span className="overline">{label}</span>
        {Icon && (
          <Icon
            size={16}
            aria-hidden
            style={accent ? { color: accent } : undefined}
            className={accent ? '' : 'text-primary'}
          />
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-display text-2xl font-bold tabular-nums">{value}</span>
        {unit && <span className="text-xs font-medium text-muted">{unit}</span>}
      </div>
    </div>
  )
}
