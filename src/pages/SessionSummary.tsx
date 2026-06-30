import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock, Dumbbell, ListChecks, Save, Trash2, Trophy } from 'lucide-react'
import { useData } from '../state/DataContext'
import { useStore } from '../state/store'
import { computeSessionTotals, formatDuration } from '../lib/session'
import { titleCase } from '../lib/data'
import StatTile from '../components/StatTile'
import ConfirmDialog from '../components/ui/ConfirmDialog'

export default function SessionSummary() {
  const navigate = useNavigate()
  const { byId } = useData()
  const activeSession = useStore((s) => s.activeSession)
  const settings = useStore((s) => s.settings)
  const logSession = useStore((s) => s.logSession)
  const clearActiveSession = useStore((s) => s.clearActiveSession)

  // Freeze the finish time once, on first render.
  const [finishedAt] = useState(() => Date.now())
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  // Derive everything that depends on the (possibly null) active session,
  // before any early return, so hook order stays stable.
  const exercises = activeSession?.exercises ?? []
  const { totalVolume, totalSets } = useMemo(
    () => computeSessionTotals(exercises),
    [exercises],
  )

  if (!activeSession) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="card w-full max-w-md animate-rise-in px-6 py-12 text-center">
          <h1 className="text-xl font-bold">Nothing to summarize</h1>
          <p className="mt-2 text-sm text-muted">
            There is no workout in progress. Start a session to track your sets.
          </p>
          <Link to="/" className="btn btn-primary mt-6">
            Back to dashboard
          </Link>
        </div>
      </main>
    )
  }

  const durationSec = Math.round((finishedAt - activeSession.startedAt) / 1000)
  const exercisesCompleted = activeSession.exercises.filter((ex) =>
    ex.sets.some((s) => s.done),
  ).length

  const handleSave = () => {
    logSession({
      workoutId: activeSession.workoutId,
      name: activeSession.name,
      startedAt: activeSession.startedAt,
      finishedAt,
      durationSec,
      exercises: activeSession.exercises,
      totalVolume,
      totalSets,
    })
    clearActiveSession()
    navigate('/progress')
  }

  const handleDiscard = () => {
    clearActiveSession()
    navigate('/')
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        {/* Celebratory completion header */}
        <header className="card relative overflow-hidden px-6 py-8 text-center shadow-glow-primary animate-scale-in">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/15 to-transparent"
            aria-hidden
          />
          <div className="relative flex flex-col items-center gap-3">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Trophy size={32} aria-hidden />
            </span>
            <p className="overline text-primary">Workout complete</p>
            <h1 className="text-2xl font-bold capitalize sm:text-3xl">{activeSession.name}</h1>
            <p className="max-w-md text-sm text-muted">
              Nice work. Review your session below, then save it to your progress.
            </p>
          </div>
        </header>

        {/* Stat row */}
        <section
          className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 animate-rise-in"
          aria-label="Session totals"
        >
          <StatTile label="Duration" value={formatDuration(durationSec)} icon={Clock} />
          <StatTile
            label="Volume"
            value={totalVolume.toLocaleString()}
            unit={settings.units}
            icon={Dumbbell}
          />
          <StatTile label="Sets done" value={totalSets} icon={ListChecks} />
          <StatTile
            label="Exercises"
            value={`${exercisesCompleted}/${activeSession.exercises.length}`}
            icon={CheckCircle2}
          />
        </section>

        {/* Per-exercise recap */}
        <section className="mt-6 animate-fade-in" aria-label="Exercise recap">
          <h2 className="section-title mb-3">Recap</h2>
          <ol className="flex flex-col gap-3">
            {activeSession.exercises.map((ex, i) => {
              const meta = byId.get(ex.exerciseId)
              const name = meta ? titleCase(meta.name) : 'Unknown exercise'
              const doneCount = ex.sets.filter((s) => s.done).length
              return (
                <li key={`${ex.exerciseId}-${i}`} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold capitalize leading-snug">{name}</h3>
                    <span className="badge shrink-0">
                      {doneCount}/{ex.sets.length} sets
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {ex.sets.map((s, j) => (
                      <span
                        key={j}
                        className={`chip ${s.done ? 'chip-active' : 'opacity-50'}`}
                      >
                        {s.reps} × {s.weight}
                        {settings.units}
                      </span>
                    ))}
                  </div>
                </li>
              )
            })}
          </ol>
        </section>

        {/* Actions */}
        <div className="sticky bottom-0 z-10 mt-8 -mx-4 bg-bg/85 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button className="btn btn-primary btn-lg sm:flex-1" onClick={handleSave}>
              <Save size={18} aria-hidden /> Save to history
            </button>
            <button
              className="btn btn-ghost btn-lg sm:flex-1"
              onClick={() => setConfirmDiscard(true)}
            >
              <Trash2 size={18} aria-hidden /> Discard
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDiscard}
        title="Discard this session?"
        message="This workout will not be saved to your progress. This cannot be undone."
        confirmLabel="Discard"
        cancelLabel="Keep session"
        danger
        onConfirm={handleDiscard}
        onCancel={() => setConfirmDiscard(false)}
      />
    </main>
  )
}
