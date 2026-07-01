import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Save, Trash2 } from 'lucide-react'
import { useData } from '../state/DataContext'
import { useStore } from '../state/store'
import { computeSessionTotals, formatDuration } from '../lib/session'
import { titleCase } from '../lib/data'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Words, CountUp, useReveal } from '../lib/anim'

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
  const revealRef = useReveal<HTMLDivElement>()

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
          <p className="overline">Session summary</p>
          <h1 className="mt-2 font-display text-xl leading-tight">Nothing to summarize</h1>
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
      <div ref={revealRef} className="w-full max-w-2xl">
        {/* Celebratory completion header */}
        <header className="border-b border-border pb-8" data-reveal>
          <p className="overline text-primary">Workout complete</p>
          <Words
            as="h1"
            text={'Nice work.'}
            className="mt-4 font-display text-display leading-[0.95]"
          />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            <span className="capitalize text-text">{activeSession.name}</span> is done. Review your
            session below, then save it to your progress.
          </p>
        </header>

        {/* Stat row */}
        <section
          className="mt-8 grid grid-cols-2 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface sm:grid-cols-4 sm:divide-y-0 sm:divide-x"
          aria-label="Session totals"
          data-reveal
        >
          <div className="flex flex-col gap-1.5 p-5">
            <span className="overline">Duration</span>
            <span className="metric text-[1.75rem] font-medium leading-none">
              {formatDuration(durationSec)}
            </span>
          </div>
          <div className="flex flex-col gap-1.5 p-5">
            <span className="overline">Volume</span>
            <span className="flex items-baseline gap-1">
              <CountUp value={totalVolume} className="metric text-[1.75rem] font-medium leading-none" />
              <span className="text-xs font-medium text-muted">{settings.units}</span>
            </span>
          </div>
          <div className="flex flex-col gap-1.5 p-5">
            <span className="overline">Sets done</span>
            <CountUp value={totalSets} className="metric text-[1.75rem] font-medium leading-none" />
          </div>
          <div className="flex flex-col gap-1.5 p-5">
            <span className="overline">Exercises</span>
            <span className="metric text-[1.75rem] font-medium leading-none">
              {exercisesCompleted}/{activeSession.exercises.length}
            </span>
          </div>
        </section>

        {/* Per-exercise recap */}
        <section className="mt-10" aria-label="Exercise recap" data-reveal>
          <p className="overline">Breakdown</p>
          <h2 className="section-title mt-1 mb-4">Recap</h2>
          <ol className="flex flex-col gap-3">
            {activeSession.exercises.map((ex, i) => {
              const meta = byId.get(ex.exerciseId)
              const name = meta ? titleCase(meta.name) : 'Unknown exercise'
              const doneCount = ex.sets.filter((s) => s.done).length
              return (
                <li key={`${ex.exerciseId}-${i}`} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display capitalize leading-snug">{name}</h3>
                    <span className="badge shrink-0 tabular-nums">
                      {doneCount}/{ex.sets.length} sets
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {ex.sets.map((s, j) => (
                      <span
                        key={j}
                        className={`chip tabular-nums ${s.done ? 'chip-active' : 'opacity-50'}`}
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
