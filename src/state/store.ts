import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ActiveSession,
  LoggedSet,
  Settings,
  SessionLog,
  Workout,
  WorkoutExercise,
} from '../types'

// --- validation bounds (security: never trust persisted / user input) ---
const LIMITS = {
  nameLen: 60,
  sets: [1, 20],
  reps: [1, 100],
  rest: [0, 600],
  weight: [0, 2000],
  maxExercisesPerWorkout: 60,
  maxWorkouts: 200,
  maxHistory: 500,
} as const

const clamp = (n: number, lo: number, hi: number) =>
  Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : lo

/** Weight allows one decimal place; clamped to bounds. */
const clampWeight = (n: number) =>
  Number.isFinite(n) ? Math.min(LIMITS.weight[1], Math.max(LIMITS.weight[0], Math.round(n * 10) / 10)) : 0

const cleanName = (s: string, fallback = 'Untitled workout') => {
  const t = (s ?? '').toString().trim().slice(0, LIMITS.nameLen)
  return t || fallback
}

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

const cleanWorkoutExercise = (exerciseId: string): WorkoutExercise => ({
  exerciseId,
  sets: 3,
  reps: 10,
  restSec: 60,
})

/**
 * Clamp/repair a workout coming from an untrusted source (localStorage rehydrate or
 * imported JSON), so corrupt/malicious values (e.g. sets: 1e9) can never reach
 * startSession and OOM the tab. Returns null for unusable shapes.
 */
function sanitizeWorkout(w: unknown): Workout | null {
  if (!w || typeof w !== 'object') return null
  const o = w as Record<string, unknown>
  if (typeof o.id !== 'string') return null
  const exercises = Array.isArray(o.exercises) ? o.exercises : []
  const cleaned: WorkoutExercise[] = exercises
    .filter((e): e is Record<string, unknown> => !!e && typeof e === 'object')
    .filter((e) => typeof e.exerciseId === 'string')
    .slice(0, LIMITS.maxExercisesPerWorkout)
    .map((e) => ({
      exerciseId: e.exerciseId as string,
      sets: clamp(Number(e.sets), ...LIMITS.sets),
      reps: clamp(Number(e.reps), ...LIMITS.reps),
      restSec: clamp(Number(e.restSec), ...LIMITS.rest),
    }))
  return {
    id: o.id,
    name: cleanName(typeof o.name === 'string' ? o.name : ''),
    createdAt: Number.isFinite(o.createdAt) ? (o.createdAt as number) : Date.now(),
    updatedAt: Number.isFinite(o.updatedAt) ? (o.updatedAt as number) : Date.now(),
    exercises: cleaned,
  }
}

export function sanitizeWorkouts(arr: unknown): Workout[] {
  if (!Array.isArray(arr)) return []
  return arr.map(sanitizeWorkout).filter((w): w is Workout => w !== null).slice(0, LIMITS.maxWorkouts)
}

export interface GetFitState {
  settings: Settings
  favorites: string[]
  workouts: Workout[]
  history: SessionLog[]
  activeSession: ActiveSession | null

  // settings
  patchSettings: (patch: Partial<Settings>) => void

  // favorites
  toggleFavorite: (id: string) => void
  isFavorite: (id: string) => boolean

  // workouts
  createWorkout: (name: string, exerciseIds?: string[]) => string
  renameWorkout: (id: string, name: string) => void
  deleteWorkout: (id: string) => void
  duplicateWorkout: (id: string) => string | null
  addExercise: (workoutId: string, exerciseId: string) => void
  removeExercise: (workoutId: string, index: number) => void
  updateExercise: (workoutId: string, index: number, patch: Partial<WorkoutExercise>) => void
  moveExercise: (workoutId: string, from: number, to: number) => void

  // history
  logSession: (log: Omit<SessionLog, 'id'>) => void
  deleteSession: (id: string) => void
  clearHistory: () => void

  // active session
  startSession: (workout: Workout) => void
  updateActiveSet: (exIndex: number, setIndex: number, patch: Partial<LoggedSet>) => void
  clearActiveSession: () => void
}

const DEFAULT_SETTINGS: Settings = {
  lang: 'en',
  units: 'kg',
  theme: 'dark',
  reduceMotion: false,
}

export const useStore = create<GetFitState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      favorites: [],
      workouts: [],
      history: [],
      activeSession: null,

      patchSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((f) => f !== id)
            : [id, ...s.favorites],
        })),
      isFavorite: (id) => get().favorites.includes(id),

      createWorkout: (name, exerciseIds = []) => {
        const id = uid()
        const now = Date.now()
        const exercises = exerciseIds
          .slice(0, LIMITS.maxExercisesPerWorkout)
          .map(cleanWorkoutExercise)
        set((s) => ({
          workouts: [
            { id, name: cleanName(name), createdAt: now, updatedAt: now, exercises },
            ...s.workouts,
          ].slice(0, LIMITS.maxWorkouts),
        }))
        return id
      },

      renameWorkout: (id, name) =>
        set((s) => ({
          workouts: s.workouts.map((w) =>
            w.id === id ? { ...w, name: cleanName(name), updatedAt: Date.now() } : w,
          ),
        })),

      deleteWorkout: (id) =>
        set((s) => ({ workouts: s.workouts.filter((w) => w.id !== id) })),

      duplicateWorkout: (id) => {
        const src = get().workouts.find((w) => w.id === id)
        if (!src) return null
        const newId = uid()
        const now = Date.now()
        set((s) => ({
          workouts: [
            {
              ...src,
              id: newId,
              name: cleanName(`${src.name} (copy)`),
              createdAt: now,
              updatedAt: now,
              exercises: src.exercises.map((e) => ({ ...e })),
            },
            ...s.workouts,
          ].slice(0, LIMITS.maxWorkouts),
        }))
        return newId
      },

      addExercise: (workoutId, exerciseId) =>
        set((s) => ({
          workouts: s.workouts.map((w) => {
            if (w.id !== workoutId) return w
            if (w.exercises.length >= LIMITS.maxExercisesPerWorkout) return w
            return {
              ...w,
              exercises: [...w.exercises, cleanWorkoutExercise(exerciseId)],
              updatedAt: Date.now(),
            }
          }),
        })),

      removeExercise: (workoutId, index) =>
        set((s) => ({
          workouts: s.workouts.map((w) =>
            w.id === workoutId
              ? { ...w, exercises: w.exercises.filter((_, i) => i !== index), updatedAt: Date.now() }
              : w,
          ),
        })),

      updateExercise: (workoutId, index, patch) =>
        set((s) => ({
          workouts: s.workouts.map((w) => {
            if (w.id !== workoutId) return w
            const exercises = w.exercises.map((e, i) => {
              if (i !== index) return e
              return {
                ...e,
                sets: patch.sets != null ? clamp(patch.sets, ...LIMITS.sets) : e.sets,
                reps: patch.reps != null ? clamp(patch.reps, ...LIMITS.reps) : e.reps,
                restSec: patch.restSec != null ? clamp(patch.restSec, ...LIMITS.rest) : e.restSec,
              }
            })
            return { ...w, exercises, updatedAt: Date.now() }
          }),
        })),

      moveExercise: (workoutId, from, to) =>
        set((s) => ({
          workouts: s.workouts.map((w) => {
            if (w.id !== workoutId) return w
            const ex = [...w.exercises]
            if (from < 0 || from >= ex.length || to < 0 || to >= ex.length) return w
            const [moved] = ex.splice(from, 1)
            ex.splice(to, 0, moved)
            return { ...w, exercises: ex, updatedAt: Date.now() }
          }),
        })),

      logSession: (log) =>
        set((s) => ({
          history: [{ ...log, id: uid() }, ...s.history].slice(0, LIMITS.maxHistory),
        })),

      deleteSession: (id) => set((s) => ({ history: s.history.filter((h) => h.id !== id) })),
      clearHistory: () => set({ history: [] }),

      startSession: (workout) =>
        set({
          activeSession: {
            workoutId: workout.id,
            name: workout.name,
            startedAt: Date.now(),
            exercises: workout.exercises.map((we) => {
              // defense in depth: never trust stored counts when allocating
              const setCount = clamp(we.sets, ...LIMITS.sets)
              const reps = clamp(we.reps, ...LIMITS.reps)
              return {
                exerciseId: we.exerciseId,
                restSec: clamp(we.restSec, ...LIMITS.rest),
                sets: Array.from({ length: setCount }, () => ({ reps, weight: 0, done: false })),
              }
            }),
          },
        }),

      updateActiveSet: (exIndex, setIndex, patch) =>
        set((s) => {
          if (!s.activeSession) return {}
          const exercises = s.activeSession.exercises.map((ex, i) => {
            if (i !== exIndex) return ex
            const sets = ex.sets.map((st, j) => {
              if (j !== setIndex) return st
              return {
                reps: patch.reps != null ? clamp(patch.reps, ...LIMITS.reps) : st.reps,
                weight: patch.weight != null ? clampWeight(patch.weight) : st.weight,
                done: patch.done != null ? patch.done : st.done,
              }
            })
            return { ...ex, sets }
          })
          return { activeSession: { ...s.activeSession, exercises } }
        }),

      clearActiveSession: () => set({ activeSession: null }),
    }),
    {
      name: 'getfit-v1',
      version: 1,
      // security: tolerate corrupt/old persisted shapes — never crash on rehydrate.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<GetFitState>
        return {
          ...current,
          settings: { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) },
          favorites: Array.isArray(p.favorites)
            ? p.favorites.filter((x) => typeof x === 'string').slice(0, 2000)
            : [],
          workouts: sanitizeWorkouts(p.workouts),
          history: Array.isArray(p.history) ? p.history.slice(0, LIMITS.maxHistory) : [],
          activeSession:
            p.activeSession && typeof p.activeSession === 'object' && Array.isArray(p.activeSession.exercises)
              ? p.activeSession
              : null,
        }
      },
      partialize: (s) => ({
        settings: s.settings,
        favorites: s.favorites,
        workouts: s.workouts,
        history: s.history,
        activeSession: s.activeSession,
      }),
    },
  ),
)

export { LIMITS, clamp }
