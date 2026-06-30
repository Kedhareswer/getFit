// Runnable self-check for the pure data/session logic. Run: node scripts/check-data.ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  STARTER_WORKOUTS,
  buildStarterWorkoutIds,
  equipmentGroupOf,
  regionOf,
} from '../src/lib/taxonomy.ts'
import { computeSessionTotals, computeStreak, formatDuration } from '../src/lib/session.ts'
import type { Exercise } from '../src/types.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const list: Exercise[] = JSON.parse(
  readFileSync(join(root, 'public', 'data', 'exercises.index.json'), 'utf8'),
)

// taxonomy mappings
assert.equal(regionOf('upper arms'), 'Arms')
assert.equal(regionOf('cardio'), 'Cardio')
assert.equal(equipmentGroupOf('dumbbell'), 'Free weights')
assert.equal(equipmentGroupOf('body weight'), 'Bodyweight')
assert.equal(equipmentGroupOf('totally unknown'), 'Other')

// starter workout generation
for (const t of STARTER_WORKOUTS) {
  const ids = buildStarterWorkoutIds(list, t)
  assert.equal(ids.length, t.exerciseCount, `${t.name}: expected ${t.exerciseCount}, got ${ids.length}`)
  assert.equal(new Set(ids).size, ids.length, `${t.name}: ids must be unique`)
  const byId = new Map(list.map((e) => [e.id, e]))
  for (const id of ids) {
    const e = byId.get(id)!
    assert.ok(t.bodyParts.includes(e.body_part), `${t.name}: ${e.name} body_part ${e.body_part} not requested`)
    if (t.equipment) assert.equal(e.equipment, t.equipment, `${t.name}: ${e.name} equipment mismatch`)
  }
}

// session totals — only completed sets count
const totals = computeSessionTotals([
  { exerciseId: 'a', sets: [{ reps: 10, weight: 20, done: true }, { reps: 10, weight: 20, done: false }] },
  { exerciseId: 'b', sets: [{ reps: 5, weight: 100, done: true }] },
])
assert.equal(totals.totalSets, 2)
assert.equal(totals.totalVolume, 10 * 20 + 5 * 100) // 700

// streak: today + yesterday = 2
const DAY = 86_400_000
const now = Date.now()
const mk = (t: number) => ({
  id: String(t), workoutId: null, name: 'x', startedAt: t, finishedAt: t,
  durationSec: 60, exercises: [], totalVolume: 0, totalSets: 0,
})
assert.equal(computeStreak([mk(now), mk(now - DAY)]), 2)
assert.equal(computeStreak([]), 0)

// duration formatting
assert.equal(formatDuration(65), '1:05')
assert.equal(formatDuration(3665), '1:01:05')

console.log('✓ data/session checks passed')
