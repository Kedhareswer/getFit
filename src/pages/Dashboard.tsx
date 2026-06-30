import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Flame, Play, Dumbbell, Plus, ChevronRight, Sparkles, BarChart3, Layers, Clock, Activity } from 'lucide-react'
import type { Exercise, Lang } from '../types'
import { useData } from '../state/DataContext'
import { useStore } from '../state/store'
import { titleCase, LANGS, LANG_NAMES } from '../lib/data'
import { bodyPartColor, estimateWorkoutMinutes, formatNumber } from '../lib/theme'
import { computeStreak } from '../lib/session'
import RequireData from '../components/RequireData'
import ExerciseCard from '../components/ExerciseCard'
import StatTile from '../components/StatTile'

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

  return (
    <div className="page space-y-8">
      {/* 1. Hero header */}
      <header className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/20 via-surface to-surface-2 p-6 shadow-elev-1 animate-fade-in sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="overline">{dateLabel}</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{hello}</h1>
            <p className="mt-1 text-sm text-muted">Ready to train? Everything you need is one tap away.</p>
          </div>
          {streak > 0 && (
            <span className="badge gap-1.5 border-warning/40 bg-warning/15 text-warning">
              <Flame size={16} aria-hidden />
              {streak} day streak
            </span>
          )}
        </div>
      </header>

      {/* 2. Primary CTA */}
      {activeSession ? (
        <Link
          to={`/session/${activeSession.workoutId}`}
          className="card card-hover flex items-center justify-between gap-4 p-5 shadow-glow-primary"
        >
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-fg">
              <Play size={22} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="overline text-primary">Resume session</p>
              <p className="truncate text-lg font-bold">{activeSession.name}</p>
              <p className="text-sm text-muted">
                {remainingSets > 0
                  ? `${remainingSets} ${remainingSets === 1 ? 'set' : 'sets'} remaining`
                  : 'All sets done — finish up'}
              </p>
            </div>
          </div>
          <ChevronRight size={22} className="shrink-0 text-muted" aria-hidden />
        </Link>
      ) : (
        <Link
          to={workouts.length ? '/workouts' : '/exercises'}
          className="card card-hover flex items-center justify-between gap-4 p-5 shadow-glow-primary"
        >
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-fg">
              <Dumbbell size={22} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="overline text-primary">{workouts.length ? 'Start a workout' : 'Get started'}</p>
              <p className="truncate text-lg font-bold">
                {workouts.length ? 'Pick a workout and go' : 'Build your first workout'}
              </p>
              <p className="text-sm text-muted">
                {workouts.length
                  ? `${workouts.length} ${workouts.length === 1 ? 'workout' : 'workouts'} ready`
                  : 'Browse exercises and add them to a plan'}
              </p>
            </div>
          </div>
          <ChevronRight size={22} className="shrink-0 text-muted" aria-hidden />
        </Link>
      )}

      {/* 3. This-week stats strip */}
      <section aria-labelledby="week-heading">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 id="week-heading" className="section-title">
            This week
          </h2>
          <Link to="/progress" className="text-sm font-medium text-primary hover:underline">
            View progress
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <StatTile label="Sessions" value={formatNumber(week.sessions)} icon={Activity} />
          <StatTile label="Volume" value={formatNumber(week.volume)} unit={units} icon={BarChart3} />
          <StatTile label="Sets" value={formatNumber(week.sets)} icon={Layers} />
          <StatTile label="Minutes" value={formatNumber(week.minutes)} unit="min" icon={Clock} />
        </div>
        {!hasHistory && (
          <p className="mt-2 text-sm text-muted">Complete a workout to see your stats here.</p>
        )}
      </section>

      {/* 4. Your workouts row */}
      <section aria-labelledby="workouts-heading">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 id="workouts-heading" className="section-title">
            Your workouts
          </h2>
          {workouts.length > 0 && (
            <Link to="/workouts" className="text-sm font-medium text-primary hover:underline">
              See all
            </Link>
          )}
        </div>
        {workouts.length === 0 ? (
          <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm text-muted">No workouts yet. Build one from the exercise library.</p>
            <Link to="/exercises" className="btn btn-soft btn-sm">
              Browse exercises
            </Link>
          </div>
        ) : (
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
            {workouts.map((w) => (
              <Link
                key={w.id}
                to={`/workouts/${w.id}`}
                className="card card-hover flex w-48 shrink-0 flex-col gap-2 p-4"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Dumbbell size={18} aria-hidden />
                </span>
                <span className="line-clamp-2 font-semibold leading-snug">{w.name}</span>
                <span className="mt-auto text-xs text-muted">
                  {w.exercises.length} {w.exercises.length === 1 ? 'exercise' : 'exercises'} · ~
                  {estimateWorkoutMinutes(w)} min
                </span>
              </Link>
            ))}
            <button
              type="button"
              onClick={handleNewWorkout}
              className="card card-hover flex w-48 shrink-0 flex-col items-center justify-center gap-2 p-4 text-muted hover:text-text"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2">
                <Plus size={20} aria-hidden />
              </span>
              <span className="font-semibold">New workout</span>
            </button>
          </div>
        )}
      </section>

      {/* 5. Discover rail */}
      {discover.length > 0 && (
        <section aria-labelledby="discover-heading">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 id="discover-heading" className="section-title flex items-center gap-2">
              <Sparkles size={18} className="text-primary" aria-hidden />
              Discover
            </h2>
            <Link to="/exercises" className="text-sm font-medium text-primary hover:underline">
              All exercises
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {discover.map((e) => (
              <ExerciseCard key={e.id} exercise={e} />
            ))}
          </div>
        </section>
      )}

      {/* 6. Browse by body part */}
      {facets.bodyParts.length > 0 && (
        <section aria-labelledby="bodypart-heading">
          <h2 id="bodypart-heading" className="section-title mb-3">
            Browse by body part
          </h2>
          <div className="flex flex-wrap gap-2">
            {facets.bodyParts.map((f) => (
              <Link key={f.value} to={`/exercises?bp=${encodeURIComponent(f.value)}`} className="chip">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: bodyPartColor(f.value) }}
                  aria-hidden
                />
                {titleCase(f.value)}
                <span className="text-dim">{f.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 7. Language quick-switcher */}
      <section aria-labelledby="lang-heading" className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h2 id="lang-heading" className="font-semibold">
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
