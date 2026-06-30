import { regionOf } from './taxonomy'
import type { Workout } from '../types'

/** Distinct hue per body region for color-coding cards/chips (always paired with a text label — never color-alone). */
export const REGION_COLORS: Record<string, string> = {
  Arms: '#FBBF24',
  Chest: '#F472B6',
  Back: '#38BDF8',
  Shoulders: '#A78BFA',
  Core: '#34D399',
  Legs: '#FB923C',
  Cardio: '#F43F5E',
}

export function bodyPartColor(bodyPart: string): string {
  return REGION_COLORS[regionOf(bodyPart)] ?? '#A3E635'
}

/** Rough session-length estimate: per set ≈ (reps * 3.5s work) + rest. */
export function estimateWorkoutMinutes(w: Pick<Workout, 'exercises'>): number {
  let sec = 0
  for (const e of w.exercises) sec += e.sets * (e.reps * 3.5 + e.restSec)
  return Math.max(1, Math.round(sec / 60))
}

export function formatNumber(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}
