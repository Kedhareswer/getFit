import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Copy, Dumbbell, Pencil, Play, Plus, Trash2 } from 'lucide-react'
import type { Exercise, SessionLog, Workout } from '../types'
import { titleCase } from '../lib/data'
import { bodyPartColor, estimateWorkoutMinutes } from '../lib/theme'
import { useData } from '../state/DataContext'
import { useStore } from '../state/store'
import RequireData from '../components/RequireData'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useReveal } from '../lib/anim'

export default function Workouts() {
  return (
    <RequireData>
      <WorkoutsInner />
    </RequireData>
  )
}

const dateFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

function lastDoneAt(history: SessionLog[], workoutId: string): number | null {
  let latest: number | null = null
  for (const h of history) {
    if (h.workoutId === workoutId && (latest === null || h.finishedAt > latest)) {
      latest = h.finishedAt
    }
  }
  return latest
}

function distinctBodyParts(workout: Workout, byId: Map<string, Exercise>): string[] {
  const seen: string[] = []
  for (const we of workout.exercises) {
    const bp = byId.get(we.exerciseId)?.body_part
    if (bp && !seen.includes(bp)) seen.push(bp)
  }
  return seen
}

function WorkoutsInner() {
  const { byId } = useData()
  const navigate = useNavigate()
  const workouts = useStore((s) => s.workouts)
  const history = useStore((s) => s.history)
  const createWorkout = useStore((s) => s.createWorkout)
  const duplicateWorkout = useStore((s) => s.duplicateWorkout)
  const deleteWorkout = useStore((s) => s.deleteWorkout)
  const startSession = useStore((s) => s.startSession)

  const [pendingDelete, setPendingDelete] = useState<Workout | null>(null)

  const revealRef = useReveal<HTMLDivElement>()

  const newWorkout = () => {
    const id = createWorkout('New workout')
    navigate(`/workouts/${id}`)
  }

  const start = (w: Workout) => {
    startSession(w)
    navigate(`/session/${w.id}`)
  }

  const confirmDelete = () => {
    if (pendingDelete) deleteWorkout(pendingDelete.id)
    setPendingDelete(null)
  }

  return (
    <div ref={revealRef} className="page">
      <header
        className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-8"
        data-reveal
      >
        <div>
          <p className="overline">Your routines</p>
          <h1 className="mt-3 font-display text-display-sm leading-[1.02]">Workouts</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {workouts.length === 0
              ? 'Build a routine to start training.'
              : `${workouts.length.toLocaleString()} ${workouts.length === 1 ? 'workout' : 'workouts'} saved.`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={newWorkout}>
          <Plus size={18} aria-hidden /> New workout
        </button>
      </header>

      {workouts.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No workouts yet"
          message="Create one to start training."
          action={{ label: 'Create your first workout', onClick: newWorkout }}
          secondary={{ label: 'Browse exercises', to: '/exercises' }}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {workouts.map((w) => (
            <WorkoutCard
              key={w.id}
              workout={w}
              byId={byId}
              history={history}
              onStart={() => start(w)}
              onDuplicate={() => duplicateWorkout(w.id)}
              onDelete={() => setPendingDelete(w)}
            />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete workout?"
        message={
          pendingDelete
            ? `“${pendingDelete.name}” will be permanently removed. This can’t be undone.`
            : ''
        }
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}

interface CardProps {
  workout: Workout
  byId: Map<string, Exercise>
  history: SessionLog[]
  onStart: () => void
  onDuplicate: () => void
  onDelete: () => void
}

function WorkoutCard({ workout, byId, history, onStart, onDuplicate, onDelete }: CardProps) {
  const count = workout.exercises.length
  const minutes = useMemo(() => estimateWorkoutMinutes(workout), [workout])
  const lastDone = useMemo(() => lastDoneAt(history, workout.id), [history, workout.id])
  const bodyParts = useMemo(() => distinctBodyParts(workout, byId), [workout, byId])
  const empty = count === 0

  return (
    <li className="card card-hover flex flex-col gap-3 p-5" data-reveal>
      <div>
        <Link
          to={`/workouts/${workout.id}`}
          className="line-clamp-2 font-display text-lg leading-snug transition-colors duration-200 hover:text-primary"
        >
          {workout.name}
        </Link>
        <p className="mt-2 font-mono text-xs uppercase tracking-wide text-muted">
          {count} {count === 1 ? 'exercise' : 'exercises'}
          <span className="text-dim"> · ~{minutes} min</span>
        </p>
        <p className="mt-1 text-xs text-dim">
          {lastDone !== null ? `Last done ${dateFmt.format(lastDone)}` : 'Not done yet'}
        </p>
      </div>

      {bodyParts.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {bodyParts.slice(0, 4).map((bp) => (
            <span key={bp} className="badge">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: bodyPartColor(bp) }}
                aria-hidden
              />
              {titleCase(bp)}
            </span>
          ))}
          {bodyParts.length > 4 && <span className="badge">+{bodyParts.length - 4}</span>}
        </div>
      ) : (
        <p className="text-xs text-dim">No exercises added</p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <button
          className="btn btn-primary btn-sm"
          onClick={onStart}
          disabled={empty}
          aria-label={`Start workout ${workout.name}`}
        >
          <Play size={14} aria-hidden /> Start
        </button>
        <Link
          to={`/workouts/${workout.id}`}
          className="btn btn-soft btn-sm"
          aria-label={`Edit workout ${workout.name}`}
        >
          <Pencil size={14} aria-hidden /> Edit
        </Link>
        <button
          className="icon-btn ml-auto"
          onClick={onDuplicate}
          aria-label={`Duplicate workout ${workout.name}`}
        >
          <Copy size={16} aria-hidden />
        </button>
        <button
          className="icon-btn text-danger hover:text-danger"
          onClick={onDelete}
          aria-label={`Delete workout ${workout.name}`}
        >
          <Trash2 size={16} aria-hidden />
        </button>
      </div>
    </li>
  )
}
