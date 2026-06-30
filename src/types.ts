// Shared domain types for GetFit.

export type Lang = 'en' | 'es' | 'it' | 'tr' | 'ru' | 'zh'

/** Lean record loaded eagerly for browse/search/filter (from exercises.index.json). */
export interface Exercise {
  id: string
  name: string
  body_part: string
  equipment: string
  target: string
  muscle_group: string
  secondary_muscles: string[]
  media_id: string | null
}

/** Full record, lazily loaded from exercises.json for the detail view. */
export interface ExerciseFull extends Exercise {
  instructions: Partial<Record<Lang, string>>
  instruction_steps: Partial<Record<Lang, string[]>>
  created_at?: string
}

export interface Facet {
  value: string
  label: string
  count: number
}

export interface Facets {
  bodyParts: Facet[]
  equipment: Facet[]
  targets: Facet[]
}

export interface FilterCriteria {
  query: string
  bodyParts: string[]
  equipment: string[]
  targets: string[]
}

// --- User data (persisted to localStorage via zustand) ---

/** A planned exercise inside a workout. */
export interface WorkoutExercise {
  exerciseId: string
  sets: number
  reps: number
  restSec: number
}

export interface Workout {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  exercises: WorkoutExercise[]
}

/** One logged set during a session. */
export interface LoggedSet {
  reps: number
  weight: number // in the user's chosen unit; 0 = bodyweight / unset
  done: boolean
}

export interface LoggedExercise {
  exerciseId: string
  sets: LoggedSet[]
  /** rest seconds snapshotted from the workout at session start (active session only) */
  restSec?: number
}

/** A completed (or partial) workout session, kept in history. */
export interface SessionLog {
  id: string
  workoutId: string | null
  name: string
  startedAt: number
  finishedAt: number
  durationSec: number
  exercises: LoggedExercise[]
  totalVolume: number // sum(reps * weight) across done sets
  totalSets: number
}

/** An in-progress workout session (persisted so a reload resumes exactly). */
export interface ActiveSession {
  workoutId: string | null
  name: string
  startedAt: number
  exercises: LoggedExercise[]
}

export type Units = 'kg' | 'lb'
export type Theme = 'dark' | 'light'

export interface Settings {
  lang: Lang
  units: Units
  theme: Theme
  reduceMotion: boolean // pause exercise GIFs by default
}
