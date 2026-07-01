import type { Exercise } from '../types'

// --- Body regions: group raw body_part values for filtering & color-coding ---
export const REGION_OF: Record<string, string> = {
  // current dataset (ExerciseGymGifsDB) body parts
  arms: 'Arms',
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  core: 'Core',
  legs: 'Legs',
  cardio: 'Cardio',
  // legacy aliases (kept harmless)
  'upper arms': 'Arms',
  'lower arms': 'Arms',
  waist: 'Core',
  'upper legs': 'Legs',
  'lower legs': 'Legs',
  neck: 'Cardio',
}

export const REGIONS = ['Arms', 'Chest', 'Back', 'Shoulders', 'Core', 'Legs', 'Cardio'] as const
export type Region = (typeof REGIONS)[number]

export function regionOf(bodyPart: string): Region {
  return (REGION_OF[bodyPart] as Region) ?? 'Cardio'
}

// --- Equipment display groups over the raw equipment values ---
const EQUIPMENT_GROUP_OF: Record<string, string> = {
  // current dataset (ExerciseGymGifsDB)
  bodyweight: 'Bodyweight',
  dumbbell: 'Free weights',
  barbell: 'Free weights',
  'ez-bar': 'Free weights',
  kettlebell: 'Free weights',
  cable: 'Cable & Machine',
  lever: 'Cable & Machine',
  smith: 'Cable & Machine',
  sled: 'Cable & Machine',
  machine: 'Cable & Machine',
  band: 'Bands',
  other: 'Other',
  // legacy aliases (kept harmless)
  'body weight': 'Bodyweight',
  assisted: 'Bodyweight',
  'ez barbell': 'Free weights',
  'leverage machine': 'Cable & Machine',
  'smith machine': 'Cable & Machine',
  'resistance band': 'Bands',
}

export const EQUIPMENT_GROUPS = [
  'Bodyweight',
  'Free weights',
  'Cable & Machine',
  'Bands',
  'Functional & Ball',
  'Other',
] as const

export function equipmentGroupOf(equipment: string): string {
  return EQUIPMENT_GROUP_OF[equipment] ?? 'Other'
}

// --- Starter workout templates (auto-filled from the dataset) ---
export interface StarterTemplate {
  name: string
  goal: string
  bodyParts: string[]
  exerciseCount: number
  equipment?: string // optional raw-equipment constraint
}

export const STARTER_WORKOUTS: StarterTemplate[] = [
  { name: 'Full-Body Bodyweight Kickstart', goal: 'Beginner conditioning, zero equipment', bodyParts: ['chest', 'back', 'legs', 'core', 'shoulders'], exerciseCount: 8, equipment: 'bodyweight' },
  { name: 'Push Day · Chest / Shoulders / Triceps', goal: 'Hypertrophy for pressing muscles', bodyParts: ['chest', 'shoulders', 'arms'], exerciseCount: 7 },
  { name: 'Pull Day · Back / Biceps', goal: 'Back width and arm size', bodyParts: ['back', 'arms'], exerciseCount: 7 },
  { name: 'Leg Day · Quads / Hams / Calves', goal: 'Lower-body strength and mass', bodyParts: ['legs'], exerciseCount: 7 },
  { name: 'Core & Abs Crusher', goal: 'Midsection definition and stability', bodyParts: ['core'], exerciseCount: 6 },
  { name: 'Dumbbell-Only Full Body', goal: 'Complete session with just dumbbells', bodyParts: ['chest', 'back', 'shoulders', 'legs', 'arms'], exerciseCount: 8, equipment: 'dumbbell' },
  { name: 'Arm Day · Biceps / Triceps / Forearms', goal: 'Dedicated arm pump', bodyParts: ['arms'], exerciseCount: 6 },
  { name: 'Quick Cardio & Glutes Burn', goal: 'Conditioning + glute activation', bodyParts: ['cardio', 'legs'], exerciseCount: 6 },
]

/**
 * Pick exercise ids for a starter template: round-robin across the template's
 * body parts for variety, deterministic (sorted by id) so it's stable per render.
 */
export function buildStarterWorkoutIds(list: Exercise[], t: StarterTemplate): string[] {
  const buckets = new Map<string, string[]>()
  for (const bp of t.bodyParts) buckets.set(bp, [])
  const sorted = [...list].sort((a, b) => a.id.localeCompare(b.id))
  for (const e of sorted) {
    if (!buckets.has(e.body_part)) continue
    if (t.equipment && e.equipment !== t.equipment) continue
    buckets.get(e.body_part)!.push(e.id)
  }
  const picked: string[] = []
  let added = true
  while (picked.length < t.exerciseCount && added) {
    added = false
    for (const bp of t.bodyParts) {
      const arr = buckets.get(bp)!
      if (arr.length) {
        picked.push(arr.shift()!)
        added = true
        if (picked.length >= t.exerciseCount) break
      }
    }
  }
  return picked
}
