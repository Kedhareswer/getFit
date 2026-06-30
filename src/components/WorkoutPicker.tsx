import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Plus } from 'lucide-react'
import { useStore } from '../state/store'
import { useData } from '../state/DataContext'
import { estimateWorkoutMinutes } from '../lib/theme'
import Modal from './ui/Modal'

interface PickerApi {
  open: (exerciseId: string) => void
}
const Ctx = createContext<PickerApi | null>(null)

export function useWorkoutPicker(): PickerApi {
  const v = useContext(Ctx)
  if (!v) throw new Error('useWorkoutPicker must be used within WorkoutPickerProvider')
  return v
}

export function WorkoutPickerProvider({ children }: { children: ReactNode }) {
  const [exerciseId, setExerciseId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)
  const navigate = useNavigate()

  const workouts = useStore((s) => s.workouts)
  const addExercise = useStore((s) => s.addExercise)
  const createWorkout = useStore((s) => s.createWorkout)
  const { byId } = useData()

  const open = useCallback((id: string) => setExerciseId(id), [])
  const close = () => setExerciseId(null)

  const flash = (msg: string) => {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }

  const exercise = exerciseId ? byId.get(exerciseId) : null

  const addToExisting = (workoutId: string, name: string) => {
    if (!exerciseId) return
    addExercise(workoutId, exerciseId)
    flash(`Added to “${name}”`)
    close()
  }

  const addToNew = () => {
    if (!exerciseId) return
    const id = createWorkout('New workout', [exerciseId])
    close()
    navigate(`/workouts/${id}`)
  }

  return (
    <Ctx.Provider value={{ open }}>
      {children}

      <Modal open={!!exerciseId} onClose={close} title="Add to workout">
        {exercise && (
          <p className="-mt-2 mb-4 text-sm text-muted">
            Add <span className="font-semibold text-text">{exercise.name}</span> to:
          </p>
        )}
        <div className="flex flex-col gap-2">
          <button className="btn btn-primary w-full justify-start" onClick={addToNew}>
            <Plus size={18} /> Create a new workout
          </button>
          {workouts.length > 0 && (
            <div className="mt-2 flex flex-col gap-1.5">
              <span className="overline px-1">Your workouts</span>
              {workouts.map((w) => (
                <button
                  key={w.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface px-3.5 py-3 text-left transition hover:border-border-strong hover:bg-surface-2"
                  onClick={() => addToExisting(w.id, w.name)}
                >
                  <span>
                    <span className="block text-sm font-semibold">{w.name}</span>
                    <span className="text-xs text-muted">
                      {w.exercises.length} exercises · ~{estimateWorkoutMinutes(w)} min
                    </span>
                  </span>
                  <Plus size={18} className="text-muted" aria-hidden />
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 lg:bottom-6"
        >
          <div className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg shadow-glow-primary animate-rise-in">
            <Check size={16} /> {toast}
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}
