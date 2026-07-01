import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useData } from '../state/DataContext'

/** Gate page content on the exercise index being loaded; show skeleton / retry otherwise. */
export default function RequireData({ children }: { children: ReactNode }) {
  const { loading, error, retry } = useData()

  if (error) {
    return (
      <div className="page flex min-h-[60vh] items-center justify-center">
        <div className="card mx-auto flex max-w-md flex-col items-center gap-4 p-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/12 text-warning">
            <AlertTriangle size={22} aria-hidden />
          </span>
          <div>
            <p className="overline text-warning">Data unavailable</p>
            <h1 className="mt-2 font-display text-display-sm leading-[1.05]">
              Couldn’t load exercises
            </h1>
          </div>
          <p className="text-sm leading-relaxed text-muted">{error}</p>
          <button className="btn btn-primary mt-1" onClick={retry}>
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading exercises…</span>
        <div className="mb-8 flex items-center gap-2.5">
          <span
            className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-soft"
            aria-hidden
          />
          <span className="label text-dim">Loading exercises</span>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="skeleton aspect-square w-full rounded-none" />
              <div className="space-y-2 p-3">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
