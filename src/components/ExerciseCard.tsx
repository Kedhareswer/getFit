import { Link } from 'react-router-dom'
import { Plus, Star } from 'lucide-react'
import type { Exercise } from '../types'
import ExerciseGif from './ExerciseGif'
import { titleCase } from '../lib/data'
import { bodyPartColor } from '../lib/theme'
import { useStore } from '../state/store'
import { useWorkoutPicker } from './WorkoutPicker'

export default function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const isFav = useStore((s) => s.favorites.includes(exercise.id))
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const { open } = useWorkoutPicker()
  const color = bodyPartColor(exercise.body_part)

  return (
    <article className="card card-hover group relative flex flex-col overflow-hidden">
      <button
        type="button"
        onClick={() => toggleFavorite(exercise.id)}
        aria-pressed={isFav}
        aria-label={isFav ? `Remove ${exercise.name} from favorites` : `Add ${exercise.name} to favorites`}
        className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-bg/70 text-muted backdrop-blur transition hover:text-text"
      >
        <Star size={16} className={isFav ? 'fill-warning text-warning' : ''} aria-hidden />
      </button>

      <Link to={`/exercises/${exercise.id}`} className="block focus-visible:outline-none">
        <ExerciseGif mediaId={exercise.media_id} name={exercise.name} className="aspect-square w-full" />
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link
          to={`/exercises/${exercise.id}`}
          className="line-clamp-2 font-semibold capitalize leading-snug transition hover:text-primary"
        >
          {exercise.name}
        </Link>
        <div className="flex flex-wrap gap-1.5">
          <span className="badge">
            <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden />
            {titleCase(exercise.body_part)}
          </span>
          <span className="badge">{titleCase(exercise.equipment)}</span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="truncate text-xs text-muted">{titleCase(exercise.target)}</span>
          <button
            className="btn btn-soft btn-sm shrink-0"
            onClick={() => open(exercise.id)}
            aria-label={`Add ${exercise.name} to a workout`}
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>
    </article>
  )
}
