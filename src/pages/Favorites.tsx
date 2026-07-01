import { Star } from 'lucide-react'
import type { Exercise } from '../types'
import { useData } from '../state/DataContext'
import { useStore } from '../state/store'
import { useReveal } from '../lib/anim'
import RequireData from '../components/RequireData'
import ExerciseCard from '../components/ExerciseCard'
import EmptyState from '../components/EmptyState'

export default function Favorites() {
  return (
    <RequireData>
      <FavoritesInner />
    </RequireData>
  )
}

function FavoritesInner() {
  const favorites = useStore((s) => s.favorites)
  const { byId } = useData()
  const items = favorites.map((id) => byId.get(id)).filter(Boolean) as Exercise[]
  const revealRef = useReveal<HTMLDivElement>([items.length === 0])

  return (
    <div className="page" ref={revealRef}>
      <header className="mb-8 border-b border-border pb-8" data-reveal>
        <p className="overline">Saved exercises</p>
        <h1 className="mt-3 font-display text-display-sm leading-[1.02]">Favorites</h1>
        {items.length > 0 && (
          <p className="mt-3 text-sm text-muted" aria-live="polite">
            <span className="metric text-text">{items.length.toLocaleString()}</span>{' '}
            {items.length === 1 ? 'exercise' : 'exercises'} saved
          </p>
        )}
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No favorites yet"
          message="Tap the star on any exercise to save it here for quick access."
          action={{ label: 'Browse exercises', to: '/exercises' }}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
          {items.map((e) => (
            <ExerciseCard key={e.id} exercise={e} />
          ))}
        </div>
      )}
    </div>
  )
}
