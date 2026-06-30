import type { Exercise } from '../types'

// --- Body regions: group the 10 raw body_part values for filtering & color-coding ---
export const REGION_OF: Record<string, string> = {
  'upper arms': 'Arms',
  'lower arms': 'Arms',
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  waist: 'Core',
  'upper legs': 'Legs',
  'lower legs': 'Legs',
  cardio: 'Cardio',
  neck: 'Cardio',
}

export const REGIONS = ['Arms', 'Chest', 'Back', 'Shoulders', 'Core', 'Legs', 'Cardio'] as const
export type Region = (typeof REGIONS)[number]

export function regionOf(bodyPart: string): Region {
  return (REGION_OF[bodyPart] as Region) ?? 'Cardio'
}

// --- Equipment display groups over the 28 raw equipment values ---
const EQUIPMENT_GROUP_OF: Record<string, string> = {
  'body weight': 'Bodyweight',
  assisted: 'Bodyweight',
  dumbbell: 'Free weights',
  barbell: 'Free weights',
  'ez barbell': 'Free weights',
  kettlebell: 'Free weights',
  weighted: 'Free weights',
  'olympic barbell': 'Free weights',
  'trap bar': 'Free weights',
  hammer: 'Free weights',
  cable: 'Cable & Machine',
  'leverage machine': 'Cable & Machine',
  'smith machine': 'Cable & Machine',
  'sled machine': 'Cable & Machine',
  'upper body ergometer': 'Cable & Machine',
  skierg: 'Cable & Machine',
  'elliptical machine': 'Cable & Machine',
  'stepmill machine': 'Cable & Machine',
  'stationary bike': 'Cable & Machine',
  band: 'Bands',
  'resistance band': 'Bands',
  'stability ball': 'Functional & Ball',
  'medicine ball': 'Functional & Ball',
  'bosu ball': 'Functional & Ball',
  roller: 'Functional & Ball',
  'wheel roller': 'Functional & Ball',
  rope: 'Functional & Ball',
  tire: 'Functional & Ball',
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
  { name: 'Full-Body Bodyweight Kickstart', goal: 'Beginner conditioning, zero equipment', bodyParts: ['chest', 'back', 'upper legs', 'waist', 'shoulders'], exerciseCount: 8, equipment: 'body weight' },
  { name: 'Push Day · Chest / Shoulders / Triceps', goal: 'Hypertrophy for pressing muscles', bodyParts: ['chest', 'shoulders', 'upper arms'], exerciseCount: 7 },
  { name: 'Pull Day · Back / Biceps', goal: 'Back width and arm size', bodyParts: ['back', 'upper arms'], exerciseCount: 7 },
  { name: 'Leg Day · Quads / Hams / Calves', goal: 'Lower-body strength and mass', bodyParts: ['upper legs', 'lower legs'], exerciseCount: 7 },
  { name: 'Core & Abs Crusher', goal: 'Midsection definition and stability', bodyParts: ['waist'], exerciseCount: 6 },
  { name: 'Dumbbell-Only Full Body', goal: 'Complete session with just dumbbells', bodyParts: ['chest', 'back', 'shoulders', 'upper legs', 'upper arms'], exerciseCount: 8, equipment: 'dumbbell' },
  { name: 'Arm Day · Biceps / Triceps / Forearms', goal: 'Dedicated arm pump', bodyParts: ['upper arms', 'lower arms'], exerciseCount: 6 },
  { name: 'Quick Cardio & Glutes Burn', goal: 'Conditioning + glute activation', bodyParts: ['cardio', 'upper legs'], exerciseCount: 6 },
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
