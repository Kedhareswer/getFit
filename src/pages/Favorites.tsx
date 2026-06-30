import { Star } from 'lucide-react'
import type { Exercise } from '../types'
import { useData } from '../state/DataContext'
import { useStore } from '../state/store'
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

  return (
    <div className="page">
      <header className="mb-5">
        <h1 className="text-2xl font-bold sm:text-3xl">Favorites</h1>
        {items.length > 0 && (
          <p className="mt-1 text-sm text-muted" aria-live="polite">
            {items.length.toLocaleString()} saved
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
