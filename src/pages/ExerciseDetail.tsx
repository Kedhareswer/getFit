import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Dumbbell, Plus, Star } from 'lucide-react'
import type { Lang } from '../types'
import { useData } from '../state/DataContext'
import { LANGS, LANG_NAMES, titleCase } from '../lib/data'
import { bodyPartColor } from '../lib/theme'
import { useStore } from '../state/store'
import RequireData from '../components/RequireData'
import ExerciseCard from '../components/ExerciseCard'
import ExerciseGif from '../components/ExerciseGif'
import EmptyState from '../components/EmptyState'
import { useWorkoutPicker } from '../components/WorkoutPicker'
import { useReveal } from '../lib/anim'

const RELATED_LIMIT = 8

export default function ExerciseDetail() {
  return (
    <RequireData>
      <ExerciseDetailInner />
    </RequireData>
  )
}

function ExerciseDetailInner() {
  const { id } = useParams()
  const { byId, exercises, ensureFull, fullMap, fullLoading, fullError } = useData()

  useEffect(() => {
    ensureFull()
  }, [ensureFull])

  const exercise = id ? byId.get(id) : undefined

  const settingsLang = useStore((s) => s.settings.lang)
  const isFav = useStore((s) => (exercise ? s.favorites.includes(exercise.id) : false))
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const { open } = useWorkoutPicker()

  const [lang, setLang] = useState<Lang>(settingsLang)
  const revealRef = useReveal<HTMLDivElement>([exercise?.id])

  const related = useMemo(() => {
    if (!exercise) return []
    return exercises
      .filter(
        (e) =>
          e.id !== exercise.id &&
          (e.target === exercise.target || e.body_part === exercise.body_part),
      )
      .slice(0, RELATED_LIMIT)
  }, [exercises, exercise])

  if (!exercise) {
    return (
      <div className="page">
        <EmptyState
          icon={Dumbbell}
          title="Exercise not found"
          message="This exercise may have been removed or the link is incorrect."
          action={{ label: 'Back to library', to: '/exercises' }}
        />
      </div>
    )
  }

  const color = bodyPartColor(exercise.body_part)
  const full = fullMap?.get(exercise.id)
  const steps = full?.instruction_steps?.[lang] ?? full?.instruction_steps?.en
  const paragraph = full?.instructions?.[lang] ?? full?.instructions?.en

  return (
    <div ref={revealRef} className="page">
      {/* Editorial header */}
      <header className="mb-8 border-b border-border pb-8" data-reveal>
        <p className="overline">
          <Link to="/exercises" className="link">
            Library
          </Link>
          <span className="mx-2 text-dim" aria-hidden>
            /
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: color }}
              aria-hidden
            />
            {titleCase(exercise.body_part)}
          </span>
        </p>
        <h1 className="mt-3 font-display text-display-sm capitalize leading-[1.02]">
          {exercise.name}
        </h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-10">
        {/* media */}
        <div className="card overflow-hidden p-0" data-reveal>
          <ExerciseGif
            mediaId={exercise.media_id}
            name={exercise.name}
            accent={bodyPartColor(exercise.body_part)}
            eager
            className="aspect-square w-full rounded-2xl"
          />
        </div>

        {/* summary + actions */}
        <div className="min-w-0" data-reveal>
          <p className="overline">Details</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="badge">{titleCase(exercise.equipment)}</span>
            <span className="badge">{titleCase(exercise.target)}</span>
            <span className="badge">{titleCase(exercise.muscle_group)}</span>
          </div>

          {exercise.secondary_muscles.length > 0 && (
            <div className="mt-6">
              <p className="label mb-2">Secondary muscles</p>
              <div className="flex flex-wrap gap-2">
                {exercise.secondary_muscles.map((muscle) => (
                  <Link
                    key={muscle}
                    to={`/exercises?q=${encodeURIComponent(muscle)}`}
                    className="chip"
                  >
                    {titleCase(muscle)}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-soft"
              onClick={() => toggleFavorite(exercise.id)}
              aria-pressed={isFav}
              aria-label={
                isFav
                  ? `Remove ${exercise.name} from favorites`
                  : `Add ${exercise.name} to favorites`
              }
            >
              <Star size={18} className={isFav ? 'fill-warning text-warning' : ''} aria-hidden />
              {isFav ? 'Favorited' : 'Favorite'}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => open(exercise.id)}
              aria-label={`Add ${exercise.name} to a workout`}
            >
              <Plus size={18} aria-hidden />
              Add to workout
            </button>
          </div>
        </div>
      </div>

      {/* instructions */}
      <section className="mt-12" aria-labelledby="instructions-heading" data-reveal>
        <p className="overline">How to</p>
        <h2 id="instructions-heading" className="section-title mt-1 mb-4">
          Instructions
        </h2>

        <div role="group" aria-label="Instruction language" className="mb-4 flex flex-wrap gap-2">
          {LANGS.map((code) => {
            const active = code === lang
            return (
              <button
                key={code}
                type="button"
                aria-pressed={active}
                className={`chip ${active ? 'chip-active' : ''}`}
                onClick={() => setLang(code)}
              >
                {LANG_NAMES[code]}
              </button>
            )
          })}
        </div>

        {fullError && !full ? (
          <div className="card flex flex-col items-start gap-3 p-4 text-sm">
            <p className="text-muted">Couldn't load instructions.</p>
            <button type="button" className="btn btn-soft btn-sm" onClick={() => ensureFull()}>
              Retry
            </button>
          </div>
        ) : fullLoading && !full ? (
          <div className="space-y-2" aria-hidden>
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-11/12" />
            <div className="skeleton h-4 w-4/5" />
          </div>
        ) : steps && steps.length > 0 ? (
          <>
            <ol className="ml-5 list-decimal space-y-2 text-sm leading-relaxed text-text marker:text-dim marker:font-display">
              {steps.map((step, i) => (
                <li key={i} className="pl-1">
                  {step}
                </li>
              ))}
            </ol>
            {paragraph && (
              <details className="card mt-4 p-4">
                <summary className="cursor-pointer text-sm font-medium text-muted transition hover:text-text">
                  Read as a paragraph
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-text">{paragraph}</p>
              </details>
            )}
          </>
        ) : (
          <p className="text-sm text-muted">No instructions available for this exercise.</p>
        )}
      </section>

      {/* related */}
      {related.length > 0 && (
        <section className="mt-12" aria-labelledby="related-heading" data-reveal>
          <p className="overline">More like this</p>
          <h2 id="related-heading" className="section-title mt-1 mb-4">
            Related exercises
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
            {related.map((e) => (
              <ExerciseCard key={e.id} exercise={e} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
