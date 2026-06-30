import { useMemo, useState } from 'react'
import { Activity, Dumbbell, Flame, Timer, Trash2 } from 'lucide-react'
import type { SessionLog } from '../types'
import { useStore } from '../state/store'
import { computeStreak, formatDuration, volumeByDay } from '../lib/session'
import { formatNumber } from '../lib/theme'
import EmptyState from '../components/EmptyState'
import StatTile from '../components/StatTile'
import MiniBarChart from '../components/MiniBarChart'
import ConfirmDialog from '../components/ui/ConfirmDialog'

const HEATMAP_DAYS = 84

const startOfDay = (ms: number) => {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

interface HeatCell {
  key: number
  label: string
  sessions: number
  volume: number
}

export default function Progress() {
  const history = useStore((s) => s.history)
  const deleteSession = useStore((s) => s.deleteSession)
  const clearHistory = useStore((s) => s.clearHistory)
  const units = useStore((s) => s.settings.units)

  const [pendingDelete, setPendingDelete] = useState<SessionLog | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const totals = useMemo(() => {
    let volume = 0
    let seconds = 0
    for (const h of history) {
      volume += h.totalVolume || 0
      seconds += h.durationSec || 0
    }
    return {
      streak: computeStreak(history),
      sessions: history.length,
      volume: Math.round(volume),
      minutes: Math.round(seconds / 60),
    }
  }, [history])

  const trend = useMemo(
    () => volumeByDay(history, 14).map((d) => ({ label: d.date, value: d.volume })),
    [history],
  )

  const heatmap = useMemo<HeatCell[]>(() => {
    const buckets = new Map<number, { sessions: number; volume: number }>()
    for (const h of history) {
      const key = startOfDay(h.finishedAt || h.startedAt)
      const cur = buckets.get(key) ?? { sessions: 0, volume: 0 }
      cur.sessions += 1
      cur.volume += h.totalVolume || 0
      buckets.set(key, cur)
    }
    const cells: HeatCell[] = []
    // Step by calendar day (setDate) so DST transitions don't shift keys off local midnight.
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - (HEATMAP_DAYS - 1))
    for (let i = 0; i < HEATMAP_DAYS; i++) {
      const key = d.getTime()
      const b = buckets.get(key) ?? { sessions: 0, volume: 0 }
      cells.push({
        key,
        label: new Date(key).toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        sessions: b.sessions,
        volume: b.volume,
      })
      d.setDate(d.getDate() + 1)
    }
    return cells
  }, [history])

  const reversed = useMemo(() => [...history].reverse(), [history])

  if (history.length === 0) {
    return (
      <div className="page">
        <header className="mb-5">
          <h1 className="text-2xl font-bold sm:text-3xl">Progress</h1>
        </header>
        <EmptyState
          icon={Activity}
          title="No sessions logged yet"
          message="Your trends, streak and history appear after your first workout."
          action={{ label: 'Start your first workout', to: '/workouts' }}
        />
      </div>
    )
  }

  return (
    <div className="page">
      <header className="mb-5">
        <h1 className="text-2xl font-bold sm:text-3xl">Progress</h1>
        <p className="mt-1 text-sm text-muted">Your trends, streak and training history.</p>
      </header>

      {/* headline stats */}
      <section aria-label="Summary" className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          label="Current streak"
          value={formatNumber(totals.streak)}
          unit={totals.streak === 1 ? 'day' : 'days'}
          icon={Flame}
          accent="#FB923C"
        />
        <StatTile label="Total sessions" value={formatNumber(totals.sessions)} icon={Activity} />
        <StatTile
          label="Total volume"
          value={formatNumber(totals.volume)}
          unit={units}
          icon={Dumbbell}
        />
        <StatTile
          label="Total minutes"
          value={formatNumber(totals.minutes)}
          unit="min"
          icon={Timer}
        />
      </section>

      {/* volume trend */}
      <section className="mb-8">
        <div className="card animate-rise-in">
          <h2 className="section-title mb-4">Last 14 days</h2>
          <MiniBarChart
            data={trend}
            unit={units}
            caption="Daily training volume over the last 14 days"
          />
        </div>
      </section>

      {/* activity heatmap */}
      <section className="mb-8">
        <div className="card animate-rise-in">
          <h2 className="section-title mb-4">Activity</h2>
          <div className="overflow-x-auto pb-1">
            <div className="grid grid-flow-col grid-rows-7 gap-1" role="img" aria-label="Activity heatmap of the last 84 days">
              {heatmap.map((cell) => {
                const label = `${cell.label}: ${cell.sessions} ${
                  cell.sessions === 1 ? 'session' : 'sessions'
                }`
                return (
                  <span
                    key={cell.key}
                    title={label}
                    aria-label={label}
                    className={`h-3.5 w-3.5 rounded-sm ${heatClass(cell.sessions)}`}
                  />
                )
              })}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-dim">
            <span>Less</span>
            <span className="h-3.5 w-3.5 rounded-sm bg-surface-2" aria-hidden />
            <span className="h-3.5 w-3.5 rounded-sm bg-primary/30" aria-hidden />
            <span className="h-3.5 w-3.5 rounded-sm bg-primary/55" aria-hidden />
            <span className="h-3.5 w-3.5 rounded-sm bg-primary/80" aria-hidden />
            <span className="h-3.5 w-3.5 rounded-sm bg-primary" aria-hidden />
            <span>More</span>
          </div>
          {/* screen-reader equivalent of the heatmap */}
          <table className="sr-only">
            <caption>Training activity over the last {HEATMAP_DAYS} days — days with logged sessions</caption>
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col">Sessions</th>
              </tr>
            </thead>
            <tbody>
              {heatmap.filter((c) => c.sessions > 0).length === 0 ? (
                <tr>
                  <td colSpan={2}>No sessions logged in this period</td>
                </tr>
              ) : (
                heatmap
                  .filter((c) => c.sessions > 0)
                  .map((c) => (
                    <tr key={c.key}>
                      <th scope="row">{c.label}</th>
                      <td>{c.sessions}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* history list */}
      <section aria-label="Session history">
        <h2 className="section-title mb-4">History</h2>
        <ul className="flex flex-col gap-3">
          {reversed.map((log) => (
            <li key={log.id} className="card card-hover flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="truncate font-semibold text-text">{log.name}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {new Date(log.finishedAt || log.startedAt).toLocaleDateString()}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {formatDuration(log.durationSec)} · {formatNumber(log.totalVolume)} {units} ·{' '}
                  {log.totalSets} {log.totalSets === 1 ? 'set' : 'sets'}
                </p>
              </div>
              <button
                className="icon-btn shrink-0 hover:text-danger"
                onClick={() => setPendingDelete(log)}
                aria-label={`Delete session ${log.name}`}
              >
                <Trash2 size={18} aria-hidden />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex justify-center">
          <button
            className="text-sm font-medium text-muted underline-offset-2 hover:text-danger hover:underline"
            onClick={() => setConfirmClear(true)}
          >
            Clear all history
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete session?"
        message={
          pendingDelete
            ? `“${pendingDelete.name}” will be permanently removed from your history. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (pendingDelete) deleteSession(pendingDelete.id)
          setPendingDelete(null)
        }}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmDialog
        open={confirmClear}
        title="Clear all history?"
        message="Every logged session will be permanently removed. This cannot be undone."
        confirmLabel="Clear all"
        danger
        onConfirm={() => {
          clearHistory()
          setConfirmClear(false)
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  )
}

/** Opacity tier for a day's activity intensity. */
function heatClass(sessions: number): string {
  if (sessions <= 0) return 'bg-surface-2'
  if (sessions === 1) return 'bg-primary/30'
  if (sessions === 2) return 'bg-primary/55'
  if (sessions === 3) return 'bg-primary/80'
  return 'bg-primary'
}
