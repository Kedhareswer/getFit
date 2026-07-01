import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Flame, Play, Dumbbell, Plus, ArrowRight, Sparkles } from 'lucide-react'
import type { Exercise, Lang } from '../types'
import { useData } from '../state/DataContext'
import { useStore } from '../state/store'
import { titleCase, LANGS, LANG_NAMES } from '../lib/data'
import { bodyPartColor, estimateWorkoutMinutes } from '../lib/theme'
import { computeStreak } from '../lib/session'
import { Words, CountUp, useReveal } from '../lib/anim'
import RequireData from '../components/RequireData'
import ExerciseCard from '../components/ExerciseCard'

const WEEK_MS = 7 * 86_400_000
const DISCOVER_COUNT = 6
const DISCOVER_STRIDE = 137
const DISCOVER_K = 31

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0)
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000)
}

export default function Dashboard() {
  return (
    <RequireData>
      <DashboardInner />
    </RequireData>
  )
}

function DashboardInner() {
  const { exercises, facets } = useData()
  const workouts = useStore((s) => s.workouts)
  const history = useStore((s) => s.history)
  const activeSession = useStore((s) => s.activeSession)
  const lang = useStore((s) => s.settings.lang)
  const units = useStore((s) => s.settings.units)
  const createWorkout = useStore((s) => s.createWorkout)
  const patchSettings = useStore((s) => s.patchSettings)
  const navigate = useNavigate()
  const revealRef = useReveal<HTMLDivElement>()

  const now = new Date()
  const hello = greeting(now.getHours())
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const streak = useMemo(() => computeStreak(history), [history])

  // this-week aggregates from sessions finished in the last 7 days
  const week = useMemo(() => {
    const cutoff = Date.now() - WEEK_MS
    let sessions = 0
    let volume = 0
    let sets = 0
    let seconds = 0
    for (const h of history) {
      if ((h.finishedAt || h.startedAt) < cutoff) continue
      sessions += 1
      volume += h.totalVolume || 0
      sets += h.totalSets || 0
      seconds += h.durationSec || 0
    }
    return { sessions, volume, sets, minutes: Math.round(seconds / 60) }
  }, [history])

  // remaining sets in the active session (sets not yet marked done)
  const remainingSets = useMemo(() => {
    if (!activeSession) return 0
    let n = 0
    for (const ex of activeSession.exercises) for (const st of ex.sets) if (!st.done) n += 1
    return n
  }, [activeSession])

  // deterministic per-day pick of discover exercises
  const discover = useMemo(() => {
    const len = exercises.length
    if (len === 0) return [] as Exercise[]
    const seed = dayOfYear(now)
    const picks: Exercise[] = []
    const seen = new Set<number>()
    let i = 0
    while (picks.length < Math.min(DISCOVER_COUNT, len) && i < len) {
      const idx = ((seed * DISCOVER_K + i * DISCOVER_STRIDE) % len + len) % len
      if (!seen.has(idx)) {
        seen.add(idx)
        picks.push(exercises[idx])
      }
      i += 1
    }
    return picks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises])

  const handleNewWorkout = () => {
    const id = createWorkout('New workout')
    navigate(`/workouts/${id}`)
  }

  const hasHistory = history.length > 0
  const weekStats = [
    { label: 'Sessions', value: week.sessions, unit: '' },
    { label: 'Volume', value: week.volume, unit: units },
    { label: 'Sets', value: week.sets, unit: '' },
    { label: 'Minutes', value: week.minutes, unit: 'min' },
  ]

  return (
    <div ref={revealRef} className="page space-y-16 sm:space-y-20">
      {/* 1. Editorial hero */}
      <header className="pt-2 sm:pt-6">
        <p className="overline">{dateLabel}</p>
        <Words
          as="h1"
          text={`${hello}.`}
          className="mt-4 font-display text-display leading-[0.95]"
        />
        <div className="mt-6 flex flex-wrap items-center gap-4" data-reveal>
          <p className="max-w-md text-[0.95rem] leading-relaxed text-muted">
            Ready to train? Browse {exercises.length.toLocaleString()} exercises, build a plan, and
            keep your streak alive — all private to this device.
          </p>
          {streak > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 font-mono text-xs">
              <Flame size={14} className="text-warning" aria-hidden />
              <span className="tabular-nums">{streak}</span>
              <span className="text-muted">day streak</span>
            </span>
          )}
        </div>
      </header>

      {/* 2. Primary CTA */}
      {activeSession ? (
        <Link
          to={`/session/${activeSession.workoutId}`}
          data-reveal
          className="card card-hover group relative flex items-center justify-between gap-4 overflow-hidden p-5 sm:p-6"
        >
          <span className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden />
          <div className="flex min-w-0 items-center gap-4 pl-2">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-fg">
              <Play size={22} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="overline">Resume session</p>
              <p className="mt-0.5 truncate font-display text-xl">{activeSession.name}</p>
              <p className="text-sm text-muted">
                {remainingSets > 0
                  ? `${remainingSets} ${remainingSets === 1 ? 'set' : 'sets'} remaining`
                  : 'All sets done — finish up'}
              </p>
            </div>
          </div>
          <ArrowRight size={20} className="shrink-0 text-muted transition-transform duration-300 ease-quint group-hover:translate-x-1" aria-hidden />
        </Link>
      ) : (
        <Link
          to={workouts.length ? '/workouts' : '/exercises'}
          data-reveal
          className="card card-hover group relative flex items-center justify-between gap-4 overflow-hidden p-5 sm:p-6"
        >
          <span className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden />
          <div className="flex min-w-0 items-center gap-4 pl-2">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-fg">
              <Dumbbell size={22} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="overline">{workouts.length ? 'Start a workout' : 'Get started'}</p>
              <p className="mt-0.5 truncate font-display text-xl">
                {workouts.length ? 'Pick a workout and go' : 'Build your first workout'}
              </p>
              <p className="text-sm text-muted">
                {workouts.length
                  ? `${workouts.length} ${workouts.length === 1 ? 'workout' : 'workouts'} ready`
                  : 'Browse exercises and add them to a plan'}
              </p>
            </div>
          </div>
          <ArrowRight size={20} className="shrink-0 text-muted transition-transform duration-300 ease-quint group-hover:translate-x-1" aria-hidden />
        </Link>
      )}

      {/* 3. This-week stats strip */}
      <section aria-labelledby="week-heading">
        <div className="mb-5 flex items-end justify-between gap-3" data-reveal>
          <div>
            <p className="overline">Last 7 days</p>
            <h2 id="week-heading" className="section-title mt-1">
              This week
            </h2>
          </div>
          <Link to="/progress" className="link text-sm">
            View progress
          </Link>
        </div>
        <div className="grid grid-cols-2 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface sm:grid-cols-4 sm:divide-y-0 sm:divide-x" data-reveal>
          {weekStats.map((s) => (
            <div key={s.label} className="flex flex-col gap-1.5 p-5">
              <span className="overline">{s.label}</span>
              <span className="flex items-baseline gap-1">
                <CountUp value={s.value} className="metric text-[1.75rem] font-medium leading-none" />
                {s.unit && <span className="text-xs font-medium text-muted">{s.unit}</span>}
              </span>
            </div>
          ))}
        </div>
        {!hasHistory && (
          <p className="mt-3 text-sm text-muted" data-reveal>
            Complete a workout to see your stats here.
          </p>
        )}
      </section>

      {/* 4. Your workouts row */}
      <section aria-labelledby="workouts-heading">
        <div className="mb-5 flex items-end justify-between gap-3" data-reveal>
          <div>
            <p className="overline">Saved plans</p>
            <h2 id="workouts-heading" className="section-title mt-1">
              Your workouts
            </h2>
          </div>
          {workouts.length > 0 && (
            <Link to="/workouts" className="link text-sm">
              See all
            </Link>
          )}
        </div>
        {workouts.length === 0 ? (
          <div className="card flex flex-wrap items-center justify-between gap-3 p-5" data-reveal>
            <p className="text-sm text-muted">No workouts yet. Build one from the exercise library.</p>
            <Link to="/exercises" className="btn btn-soft btn-sm">
              Browse exercises
            </Link>
          </div>
        ) : (
          <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8" data-reveal>
            {workouts.map((w) => (
              <Link
                key={w.id}
                to={`/workouts/${w.id}`}
                className="card card-hover flex w-52 shrink-0 flex-col gap-3 p-4"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface-2 text-primary">
                  <Dumbbell size={18} aria-hidden />
                </span>
                <span className="line-clamp-2 font-medium leading-snug">{w.name}</span>
                <span className="mt-auto font-mono text-[0.7rem] uppercase tracking-wide text-dim">
                  {w.exercises.length} {w.exercises.length === 1 ? 'exercise' : 'exercises'} · ~
                  {estimateWorkoutMinutes(w)} min
                </span>
              </Link>
            ))}
            <button
              type="button"
              onClick={handleNewWorkout}
              className="card card-hover flex w-52 shrink-0 flex-col items-center justify-center gap-2 p-4 text-muted hover:text-text"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-border-strong">
                <Plus size={20} aria-hidden />
              </span>
              <span className="text-sm font-medium">New workout</span>
            </button>
          </div>
        )}
      </section>

      {/* 5. Discover rail */}
      {discover.length > 0 && (
        <section aria-labelledby="discover-heading">
          <div className="mb-5 flex items-end justify-between gap-3" data-reveal>
            <div>
              <p className="overline flex items-center gap-1.5">
                <Sparkles size={12} className="text-primary" aria-hidden />
                Fresh today
              </p>
              <h2 id="discover-heading" className="section-title mt-1">
                Discover
              </h2>
            </div>
            <Link to="/exercises" className="link text-sm">
              All exercises
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6" data-reveal>
            {discover.map((e) => (
              <ExerciseCard key={e.id} exercise={e} />
            ))}
          </div>
        </section>
      )}

      {/* 6. Browse by body part */}
      {facets.bodyParts.length > 0 && (
        <section aria-labelledby="bodypart-heading">
          <div className="mb-5" data-reveal>
            <p className="overline">Muscle groups</p>
            <h2 id="bodypart-heading" className="section-title mt-1">
              Browse by body part
            </h2>
          </div>
          <div className="flex flex-wrap gap-2" data-reveal>
            {facets.bodyParts.map((f) => (
              <Link key={f.value} to={`/exercises?bp=${encodeURIComponent(f.value)}`} className="chip">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: bodyPartColor(f.value) }}
                  aria-hidden
                />
                {titleCase(f.value)}
                <span className="font-mono text-xs text-dim">{f.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 7. Language quick-switcher */}
      <section
        aria-labelledby="lang-heading"
        className="card flex flex-wrap items-center justify-between gap-3 p-5"
        data-reveal
      >
        <div>
          <h2 id="lang-heading" className="font-display text-lg">
            Instruction language
          </h2>
          <p className="text-sm text-muted">Choose the language for exercise instructions.</p>
        </div>
        <label className="flex items-center gap-2">
          <span className="label mb-0">Language</span>
          <select
            className="input w-auto"
            value={lang}
            onChange={(e) => patchSettings({ lang: e.target.value as Lang })}
          >
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {LANG_NAMES[l]}
              </option>
            ))}
          </select>
        </label>
      </section>
    </div>
  )
}
