import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useData } from '../state/DataContext'

/** Gate page content on the exercise index being loaded; show skeleton / retry otherwise. */
export default function RequireData({ children }: { children: ReactNode }) {
  const { loading, error, retry } = useData()

  if (error) {
    return (
      <div className="page">
        <div className="card mx-auto flex max-w-md flex-col items-center gap-3 p-8 text-center">
          <AlertTriangle className="text-warning" size={32} />
          <h1 className="text-lg font-bold">Couldn’t load exercises</h1>
          <p className="text-sm text-muted">{error}</p>
          <button className="btn btn-primary mt-2" onClick={retry}>
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
        <div className="skeleton mb-6 h-9 w-48" />
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
