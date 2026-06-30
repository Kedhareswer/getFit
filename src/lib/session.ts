import type { LoggedExercise, SessionLog } from '../types'

/** Volume + set totals from logged sets (only completed sets count). */
export function computeSessionTotals(exercises: LoggedExercise[]): {
  totalVolume: number
  totalSets: number
} {
  let totalVolume = 0
  let totalSets = 0
  for (const ex of exercises) {
    for (const s of ex.sets) {
      if (!s.done) continue
      totalSets += 1
      totalVolume += (s.reps || 0) * (s.weight || 0)
    }
  }
  return { totalVolume: Math.round(totalVolume), totalSets }
}

/** seconds -> "8:05" or "1:08:05" */
export function formatDuration(sec: number): string {
  const s = Math.max(0, Math.floor(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  const mm = String(m).padStart(2, '0')
  const rr = String(r).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${rr}` : `${m}:${rr}`
}

/** Timestamp of local midnight for the day containing `ts`. */
export function startOfDayTs(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/**
 * Aggregate history into per-day volume for the last N days.
 * Days are stepped via the calendar (setDate), not a fixed 86.4M ms, so DST
 * transitions don't shift buckets off their local-midnight keys.
 */
export function volumeByDay(
  history: SessionLog[],
  days = 14,
): { date: string; volume: number; sessions: number }[] {
  const buckets = new Map<number, { volume: number; sessions: number }>()
  for (const h of history) {
    const key = startOfDayTs(h.finishedAt || h.startedAt)
    const cur = buckets.get(key) ?? { volume: 0, sessions: 0 }
    cur.volume += h.totalVolume || 0
    cur.sessions += 1
    buckets.set(key, cur)
  }

  const out: { date: string; volume: number; sessions: number }[] = []
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - (days - 1)) // oldest day first
  for (let i = 0; i < days; i++) {
    const b = buckets.get(d.getTime()) ?? { volume: 0, sessions: 0 }
    out.push({
      date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      volume: b.volume,
      sessions: b.sessions,
    })
    d.setDate(d.getDate() + 1)
  }
  return out
}

/** Current consecutive-day streak ending today or yesterday (calendar-day safe). */
export function computeStreak(history: SessionLog[]): number {
  if (!history.length) return 0
  const dayKeys = new Set(history.map((h) => startOfDayTs(h.finishedAt || h.startedAt)))
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  // allow the streak to count if the most recent workout was today or yesterday
  if (!dayKeys.has(d.getTime())) {
    d.setDate(d.getDate() - 1)
    if (!dayKeys.has(d.getTime())) return 0
  }
  let streak = 0
  while (dayKeys.has(d.getTime())) {
    streak += 1
    d.setDate(d.getDate() - 1)
  }
  return streak
}
