import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Exercise, ExerciseFull, Facets } from '../types'
import { buildFacets, fetchFullMap, fetchIndex } from '../lib/data'

interface DataValue {
  exercises: Exercise[]
  byId: Map<string, Exercise>
  facets: Facets
  loading: boolean
  error: string | null
  retry: () => void
  /** Trigger the lazy full-dataset load (instructions). Idempotent. */
  ensureFull: () => void
  fullMap: Map<string, ExerciseFull> | null
  fullLoading: boolean
  fullError: string | null
}

const Ctx = createContext<DataValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  const [fullMap, setFullMap] = useState<Map<string, ExerciseFull> | null>(null)
  const [fullLoading, setFullLoading] = useState(false)
  const [fullError, setFullError] = useState<string | null>(null)
  const fullRequested = useRef(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    fetchIndex()
      .then((list) => {
        if (!alive) return
        setExercises(list)
        setLoading(false)
      })
      .catch((e: unknown) => {
        if (!alive) return
        setError(e instanceof Error ? e.message : 'Failed to load exercises')
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [nonce])

  const ensureFull = useCallback(() => {
    if (fullRequested.current) return
    fullRequested.current = true
    setFullLoading(true)
    setFullError(null)
    fetchFullMap()
      .then((m) => {
        setFullMap(m)
        setFullLoading(false)
      })
      .catch((e: unknown) => {
        fullRequested.current = false // allow retry
        setFullError(e instanceof Error ? e.message : 'Failed to load instructions')
        setFullLoading(false)
      })
  }, [])

  const byId = useMemo(() => {
    const m = new Map<string, Exercise>()
    for (const e of exercises) m.set(e.id, e)
    return m
  }, [exercises])

  const facets = useMemo(() => buildFacets(exercises), [exercises])

  const value: DataValue = {
    exercises,
    byId,
    facets,
    loading,
    error,
    retry: () => setNonce((n) => n + 1),
    ensureFull,
    fullMap,
    fullLoading,
    fullError,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useData(): DataValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useData must be used within DataProvider')
  return v
}
