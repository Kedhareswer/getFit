import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { NavigateFunction } from 'react-router-dom'
import { Check, ChevronLeft, ChevronRight, Flag, Pause, Play, Plus, SkipForward, X } from 'lucide-react'
import type { ActiveSession, Exercise, ExerciseFull, Lang, Units } from '../types'
import { useData } from '../state/DataContext'
import { useStore } from '../state/store'
import { useInterval } from '../lib/hooks'
import { formatDuration } from '../lib/session'
import { titleCase } from '../lib/data'
import { bodyPartColor } from '../lib/theme'
import ExerciseGif from '../components/ExerciseGif'
import ConfirmDialog from '../components/ui/ConfirmDialog'

export default function Player() {
  const { workoutId } = useParams()
  const navigate = useNavigate()

  const { byId, fullMap, ensureFull } = useData()
  const activeSession = useStore((s) => s.activeSession)
  const workouts = useStore((s) => s.workouts)
  const settings = useStore((s) => s.settings)
  const updateActiveSet = useStore((s) => s.updateActiveSet)
  const clearActiveSession = useStore((s) => s.clearActiveSession)
  const startSession = useStore((s) => s.startSession)

  // Load instructions lazily (idempotent).
  useEffect(() => {
    ensureFull()
  }, [ensureFull])

  // Resume guard: if there's no active session but a valid workout for this route,
  // start one exactly once.
  useEffect(() => {
    if (activeSession) return
    const w = workouts.find((x) => x.id === workoutId)
    if (w && w.exercises.length) startSession(w)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession, workoutId])

  if (!activeSession) {
    const w = workouts.find((x) => x.id === workoutId)
    // Workout exists with exercises -> startSession effect will populate shortly.
    if (w && w.exercises.length) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <p className="text-sm text-muted" aria-live="polite">
            Starting session…
          </p>
        </div>
      )
    }
    return <NoSession />
  }

  return (
    <PlayerInner
      session={activeSession}
      byId={byId}
      fullMap={fullMap}
      units={settings.units}
      lang={settings.lang}
      reduceMotion={settings.reduceMotion}
      updateActiveSet={updateActiveSet}
      clearActiveSession={clearActiveSession}
      navigate={navigate}
      workoutId={workoutId}
    />
  )
}

function NoSession() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="card flex max-w-sm flex-col items-center gap-3 px-6 py-12 text-center animate-rise-in">
        <p className="overline">No session</p>
        <h1 className="font-display text-xl leading-tight">No active session</h1>
        <p className="text-sm text-muted">
          This workout isn’t running. Start one from your workouts to track sets and rest.
        </p>
        <Link to="/" className="btn btn-primary mt-2">
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}

interface InnerProps {
  session: ActiveSession
  byId: Map<string, Exercise>
  fullMap: Map<string, ExerciseFull> | null
  units: Units
  lang: Lang
  reduceMotion: boolean
  updateActiveSet: ReturnType<typeof useStore.getState>['updateActiveSet']
  clearActiveSession: () => void
  navigate: NavigateFunction
  workoutId: string | undefined
}

function PlayerInner({
  session,
  byId,
  fullMap,
  units,
  lang,
  reduceMotion,
  updateActiveSet,
  clearActiveSession,
  navigate,
  workoutId,
}: InnerProps) {
  const n = session.exercises.length
  const [idx, setIdx] = useState(0)
  const safeIdx = Math.min(idx, Math.max(0, n - 1))
  const [confirmAbandon, setConfirmAbandon] = useState(false)

  // --- elapsed timer ---
  const [elapsed, setElapsed] = useState(() => Math.floor((Date.now() - session.startedAt) / 1000))
  useInterval(() => setElapsed(Math.floor((Date.now() - session.startedAt) / 1000)), 1000)

  const ex = session.exercises[safeIdx]
  const meta = byId.get(ex.exerciseId)
  // rest duration is snapshotted into the session at start, so editing the source
  // workout mid-session can't desync it.
  const restSec = ex.restSec ?? 60

  // localized instruction steps for the current exercise
  const full = fullMap?.get(ex.exerciseId)
  const steps = useMemo<string[]>(() => {
    const byLang = full?.instruction_steps
    if (!byLang) return []
    return byLang[lang] ?? byLang.en ?? []
  }, [full, lang])

  // --- rest timer ---
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [running, setRunning] = useState(false)
  // announced on transitions only (not every tick) so the live region doesn't flood
  const [restAnnounce, setRestAnnounce] = useState('')
  useInterval(() => setSecondsLeft((s) => (s <= 1 ? 0 : s - 1)), running ? 1000 : null)

  useEffect(() => {
    if (running && secondsLeft === 0) {
      setRunning(false)
      setRestAnnounce('Rest complete')
    }
  }, [running, secondsLeft])

  const startRest = () => {
    setSecondsLeft(restSec)
    setRunning(restSec > 0)
    setRestAnnounce(restSec > 0 ? 'Resting' : '')
  }
  const toggleRunning = () => {
    const next = !running
    setRunning(next)
    setRestAnnounce(next ? 'Resting' : 'Rest paused')
  }
  const skipRest = () => {
    setRunning(false)
    setSecondsLeft(0)
    setRestAnnounce('Rest skipped')
  }

  const toggleDone = (j: number, done: boolean) => {
    updateActiveSet(safeIdx, j, { done })
    if (done) startRest()
  }

  const isFirst = safeIdx === 0
  const isLast = safeIdx >= n - 1

  const goPrev = () => {
    setRunning(false)
    setSecondsLeft(0)
    setIdx(Math.max(0, safeIdx - 1))
  }
  const goNext = () => {
    setRunning(false)
    setSecondsLeft(0)
    setIdx(Math.min(n - 1, safeIdx + 1))
  }

  const restActive = running || secondsLeft > 0

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-base leading-tight sm:text-lg">{session.name}</h1>
            <p className="overline mt-0.5" aria-live="polite">
              Exercise {safeIdx + 1} of {n}
            </p>
          </div>
          <div
            className="metric text-lg"
            aria-label={`Elapsed time ${formatDuration(elapsed)}`}
          >
            {formatDuration(elapsed)}
          </div>
          <button
            type="button"
            className="icon-btn text-muted hover:text-danger"
            onClick={() => setConfirmAbandon(true)}
            aria-label="Abandon workout"
          >
            <X size={18} />
          </button>
        </div>
        {/* progress bar */}
        <div className="h-1 w-full bg-surface-2" aria-hidden>
          <div
            className="h-full bg-primary transition-[width] duration-300"
            style={{ width: `${((safeIdx + 1) / n) * 100}%` }}
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-28 pt-5">
        <ExerciseGif
          mediaId={meta?.media_id ?? null}
          name={meta?.name ?? 'Exercise'}
          accent={meta ? bodyPartColor(meta.body_part) : undefined}
          eager
          className="aspect-video w-full max-h-[40vh] rounded-2xl"
        />

        <h2 className="mt-4 font-display text-xl capitalize leading-tight">{meta?.name ?? 'Exercise'}</h2>
        {meta && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="badge">{titleCase(meta.body_part)}</span>
            <span className="badge">{titleCase(meta.target)}</span>
            <span className="badge">{titleCase(meta.equipment)}</span>
          </div>
        )}

        {steps.length > 0 && (
          <details className="card mt-4 p-4">
            <summary className="cursor-pointer select-none font-semibold">Show steps</summary>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
              {steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </details>
        )}

        {/* Set tracker */}
        <section className="mt-6" aria-label="Set tracker">
          <div className="overline mb-2">Sets</div>
          <div className="flex flex-col gap-2">
            {ex.sets.map((set, j) => (
              <div
                key={j}
                className={`card flex items-center gap-3 p-3 transition ${
                  set.done ? 'ring-1 ring-success/60' : ''
                }`}
              >
                <span
                  className={`metric flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
                    set.done ? 'bg-success/15 text-success' : 'bg-surface-2 text-muted'
                  }`}
                  aria-hidden
                >
                  {j + 1}
                </span>

                <label className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="label !mb-0 text-xs">Reps</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="input"
                    value={set.reps}
                    aria-label={`Set ${j + 1} reps`}
                    onChange={(e) => updateActiveSet(safeIdx, j, { reps: Number(e.target.value) })}
                  />
                </label>

                <label className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="label !mb-0 text-xs">Weight ({units})</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="input"
                    value={set.weight}
                    aria-label={`Set ${j + 1} weight in ${units}`}
                    onChange={(e) => updateActiveSet(safeIdx, j, { weight: Number(e.target.value) })}
                  />
                </label>

                <button
                  type="button"
                  className={`btn shrink-0 ${set.done ? 'btn-primary' : 'btn-soft'}`}
                  aria-pressed={set.done}
                  aria-label={set.done ? `Mark set ${j + 1} not done` : `Mark set ${j + 1} done`}
                  onClick={() => toggleDone(j, !set.done)}
                >
                  <Check size={16} aria-hidden />
                  Done
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Rest timer */}
        <section className="mt-6" aria-label="Rest timer">
          <div
            className={`card flex items-center justify-between gap-3 p-4 transition-colors duration-300 ${
              restActive ? 'border-primary/40' : ''
            }`}
          >
            <div>
              <div className="overline">Rest</div>
              <div
                className={`metric text-3xl ${
                  restActive ? 'text-primary' : 'text-muted'
                } ${running && !reduceMotion ? 'animate-pulse' : ''}`}
              >
                {formatDuration(secondsLeft)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {restActive ? (
                <button
                  type="button"
                  className="btn btn-soft"
                  onClick={toggleRunning}
                  aria-label={running ? 'Pause rest timer' : 'Resume rest timer'}
                >
                  {running ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
                  {running ? 'Pause' : 'Resume'}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-soft"
                  onClick={startRest}
                  aria-label="Start rest timer"
                >
                  <Play size={16} aria-hidden />
                  Start
                </button>
              )}
              <button
                type="button"
                className="btn btn-soft"
                onClick={() => setSecondsLeft((s) => Math.min(s + 15, 600))}
                aria-label="Add 15 seconds to rest timer"
              >
                <Plus size={16} aria-hidden />
                15s
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={skipRest}
                aria-label="Skip rest"
              >
                <SkipForward size={16} aria-hidden />
                Skip
              </button>
            </div>
          </div>
          <div className="sr-only" role="status" aria-live="polite">
            {restAnnounce}
          </div>
        </section>
      </main>

      {/* Footer nav */}
      <footer className="sticky bottom-0 z-20 border-t border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2 px-4 py-3">
          <button
            type="button"
            className="btn btn-soft"
            onClick={goPrev}
            disabled={isFirst}
            aria-label="Previous exercise"
          >
            <ChevronLeft size={18} aria-hidden />
            Previous
          </button>
          <div className="flex-1" />
          {isLast ? (
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={() => navigate(`/session/${workoutId}/summary`)}
            >
              <Flag size={18} aria-hidden />
              Finish workout
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={goNext} aria-label="Next exercise">
              Next
              <ChevronRight size={18} aria-hidden />
            </button>
          )}
        </div>
      </footer>

      <ConfirmDialog
        open={confirmAbandon}
        title="Abandon workout?"
        message="Your progress in this session will be discarded and not saved to history."
        confirmLabel="Abandon"
        cancelLabel="Keep going"
        danger
        onConfirm={() => {
          clearActiveSession()
          navigate('/')
        }}
        onCancel={() => setConfirmAbandon(false)}
      />
    </div>
  )
}
