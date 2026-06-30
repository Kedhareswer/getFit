import { useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  Check,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Play,
  Plus,
  Search,
  X,
} from 'lucide-react'
import type { Exercise, Facets, FilterCriteria } from '../types'
import { useData } from '../state/DataContext'
import { useStore } from '../state/store'
import { filterExercises, titleCase } from '../lib/data'
import { bodyPartColor, estimateWorkoutMinutes } from '../lib/theme'
import { useDebouncedValue } from '../lib/hooks'
import RequireData from '../components/RequireData'
import ExerciseGif from '../components/ExerciseGif'
import FilterPanel from '../components/FilterPanel'
import EmptyState from '../components/EmptyState'
import Modal from '../components/ui/Modal'

export default function Builder() {
  return (
    <RequireData>
      <BuilderInner />
    </RequireData>
  )
}

function BuilderInner() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { byId, exercises, facets } = useData()

  const workout = useStore((s) => s.workouts.find((w) => w.id === id))
  const renameWorkout = useStore((s) => s.renameWorkout)
  const addExercise = useStore((s) => s.addExercise)
  const removeExercise = useStore((s) => s.removeExercise)
  const updateExercise = useStore((s) => s.updateExercise)
  const moveExercise = useStore((s) => s.moveExercise)
  const startSession = useStore((s) => s.startSession)

  const [pickerOpen, setPickerOpen] = useState(false)

  if (!workout || !id) {
    return (
      <div className="page">
        <EmptyState
          title="This workout no longer exists"
          message="It may have been deleted. Head back to pick another."
          action={{ label: 'Back to workouts', to: '/workouts' }}
        />
      </div>
    )
  }

  const totalSets = workout.exercises.reduce((sum, we) => sum + we.sets, 0)
  const minutes = estimateWorkoutMinutes(workout)
  const isEmpty = workout.exercises.length === 0

  const start = () => {
    startSession(workout)
    navigate(`/session/${workout.id}`)
  }

  return (
    <div className="page pb-24">
      <header className="mb-5 animate-fade-in">
        <Link
          to="/workouts"
          className="text-sm font-medium text-muted underline-offset-2 hover:text-text hover:underline"
        >
          ← Back to workouts
        </Link>
        <h1 className="sr-only">Edit workout {workout.name}</h1>
        <label className="label mt-3 block" htmlFor="workout-name">
          Workout name
        </label>
        <div className="flex items-center gap-2">
          <input
            id="workout-name"
            className="input flex-1 text-lg font-semibold"
            value={workout.name}
            maxLength={60}
            onChange={(e) => renameWorkout(id, e.target.value)}
            aria-label="Workout name"
          />
        </div>
        <p className="mt-2 flex items-center gap-1 text-xs text-muted" aria-live="polite">
          <Check size={14} aria-hidden /> Saved automatically
        </p>
      </header>

      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="section-title">Exercises</h2>
        <button className="btn btn-secondary btn-sm" onClick={() => setPickerOpen(true)}>
          <Plus size={16} /> Add exercises
        </button>
      </div>

      {isEmpty ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-muted">
            <Dumbbell size={24} aria-hidden />
          </span>
          <p className="text-sm text-muted">This workout is empty. Add exercises to begin.</p>
          <button className="btn btn-primary btn-sm" onClick={() => setPickerOpen(true)}>
            <Plus size={16} /> Add exercises
          </button>
        </div>
      ) : (
        <ol className="space-y-3">
          {workout.exercises.map((we, i) => {
            const ex = byId.get(we.exerciseId)
            const name = ex?.name ?? 'Unknown exercise'
            const last = i === workout.exercises.length - 1
            return (
              <li key={`${we.exerciseId}-${i}`} className="card animate-rise-in p-3">
                <div className="flex gap-3">
                  <ExerciseGif
                    mediaId={ex?.media_id ?? null}
                    name={name}
                    className="h-16 w-16 shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="overline">Exercise {i + 1}</span>
                        {ex ? (
                          <Link
                            to={`/exercises/${we.exerciseId}`}
                            className="block truncate font-semibold capitalize leading-snug transition hover:text-primary"
                          >
                            {name}
                          </Link>
                        ) : (
                          <span className="block truncate font-semibold leading-snug text-muted">
                            {name}
                          </span>
                        )}
                        {ex && (
                          <span className="badge mt-1">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ background: bodyPartColor(ex.body_part) }}
                              aria-hidden
                            />
                            {titleCase(ex.body_part)}
                          </span>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          className="icon-btn"
                          onClick={() => moveExercise(id, i, i - 1)}
                          disabled={i === 0}
                          aria-label={`Move ${name} up`}
                        >
                          <ChevronUp size={16} aria-hidden />
                        </button>
                        <button
                          className="icon-btn"
                          onClick={() => moveExercise(id, i, i + 1)}
                          disabled={last}
                          aria-label={`Move ${name} down`}
                        >
                          <ChevronDown size={16} aria-hidden />
                        </button>
                        <button
                          className="icon-btn text-muted hover:text-danger"
                          onClick={() => removeExercise(id, i)}
                          aria-label={`Remove ${name}`}
                        >
                          <X size={16} aria-hidden />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <NumberField
                        label="Sets"
                        id={`sets-${i}`}
                        value={we.sets}
                        onChange={(v) => updateExercise(id, i, { sets: v })}
                      />
                      <NumberField
                        label="Reps"
                        id={`reps-${i}`}
                        value={we.reps}
                        onChange={(v) => updateExercise(id, i, { reps: v })}
                      />
                      <NumberField
                        label="Rest (sec)"
                        id={`rest-${i}`}
                        value={we.restSec}
                        onChange={(v) => updateExercise(id, i, { restSec: v })}
                      />
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      )}

      {/* sticky summary + actions */}
      <div className="sticky bottom-16 z-20 -mx-4 mt-6 border-t border-border bg-bg/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:bottom-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            <span className="font-semibold text-text">{workout.exercises.length}</span> exercises ·{' '}
            <span className="font-semibold text-text">{totalSets}</span> sets · ~
            <span className="font-semibold text-text">{minutes}</span> min
          </p>
          <div className="flex items-center gap-2">
            <Link to="/workouts" className="btn btn-ghost btn-sm">
              Back to workouts
            </Link>
            <button className="btn btn-primary" onClick={start} disabled={isEmpty}>
              <Play size={16} /> Start session
            </button>
          </div>
        </div>
      </div>

      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title="Add exercises" size="lg">
        <ExercisePicker
          exercises={exercises}
          facets={facets}
          onAdd={(exerciseId) => addExercise(id, exerciseId)}
        />
      </Modal>
    </div>
  )
}

function NumberField({
  label,
  id,
  value,
  onChange,
}: {
  label: string
  id: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="label">{label}</span>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        className="input"
        value={value}
        min={0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

function ExercisePicker({
  exercises,
  facets,
  onAdd,
}: {
  exercises: Exercise[]
  facets: Facets
  onAdd: (exerciseId: string) => void
}) {
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [bodyParts, setBodyParts] = useState<string[]>([])
  const [equipment, setEquipment] = useState<string[]>([])
  const [targets, setTargets] = useState<string[]>([])
  const [added, setAdded] = useState<Record<string, number>>({})

  const dq = useDebouncedValue(query, 200)

  const criteria: FilterCriteria = useMemo(
    () => ({ query: dq, bodyParts, equipment, targets }),
    [dq, bodyParts, equipment, targets],
  )

  const results = useMemo(
    () => filterExercises(exercises, criteria),
    [exercises, criteria],
  )
  const visible = results.slice(0, 60)

  const handleAdd = (exerciseId: string) => {
    onAdd(exerciseId)
    setAdded((prev) => ({ ...prev, [exerciseId]: (prev[exerciseId] ?? 0) + 1 }))
  }

  const onFilterChange = (next: FilterCriteria) => {
    setBodyParts(next.bodyParts)
    setEquipment(next.equipment)
    setTargets(next.targets)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim"
            aria-hidden
          />
          <input
            type="search"
            className="input pl-11"
            placeholder="Search exercises, muscles…"
            aria-label="Search exercises to add"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn btn-soft"
          aria-pressed={showFilters}
          onClick={() => setShowFilters((v) => !v)}
        >
          Filters
        </button>
      </div>

      {showFilters && (
        <div className="card p-4">
          <FilterPanel facets={facets} criteria={criteria} onChange={onFilterChange} />
        </div>
      )}

      <p className="text-sm text-muted" aria-live="polite">
        {results.length.toLocaleString()} {results.length === 1 ? 'exercise' : 'exercises'}
      </p>

      <div className="max-h-[50vh] overflow-y-auto pr-1">
        {visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-dim">No exercises match your search.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {visible.map((ex) => {
              const count = added[ex.id] ?? 0
              return (
                <li
                  key={ex.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface p-2"
                >
                  <ExerciseGif
                    mediaId={ex.media_id}
                    name={ex.name}
                    className="h-12 w-12 shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold capitalize leading-snug">
                      {ex.name}
                    </p>
                    <p className="truncate text-xs text-muted">{titleCase(ex.target)}</p>
                  </div>
                  <button
                    type="button"
                    className={`btn btn-sm shrink-0 ${count > 0 ? 'btn-soft' : 'btn-secondary'}`}
                    onClick={() => handleAdd(ex.id)}
                    aria-label={
                      count > 0 ? `${ex.name} added, add again` : `Add ${ex.name} to workout`
                    }
                  >
                    {count > 0 ? (
                      <>
                        <Check size={14} aria-hidden /> Added{count > 1 ? ` ×${count}` : ''}
                      </>
                    ) : (
                      <>
                        <Plus size={14} aria-hidden /> Add
                      </>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
