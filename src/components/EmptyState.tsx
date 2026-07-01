import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

interface Action {
  label: string
  to?: string
  onClick?: () => void
}

interface Props {
  icon?: LucideIcon
  title: string
  message?: string
  action?: Action
  secondary?: Action
}

export default function EmptyState({ icon: Icon, title, message, action, secondary }: Props) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
      {Icon && (
        <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-surface-2 text-dim">
          <Icon size={24} aria-hidden />
        </span>
      )}
      <h2 className="font-display text-2xl">{title}</h2>
      {message && <p className="max-w-sm text-sm leading-relaxed text-muted">{message}</p>}
      {(action || secondary) && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {action && <ActionButton action={action} className="btn btn-primary" />}
          {secondary && <ActionButton action={secondary} className="btn btn-ghost" />}
        </div>
      )}
    </div>
  )
}

function ActionButton({ action, className }: { action: Action; className: string }) {
  if (action.to) {
    return (
      <Link to={action.to} className={className}>
        {action.label}
      </Link>
    )
  }
  return (
    <button className={className} onClick={action.onClick}>
      {action.label}
    </button>
  )
}
