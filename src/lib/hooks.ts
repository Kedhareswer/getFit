import { useEffect, useRef, useState } from 'react'

/** Debounce a rapidly-changing value (e.g. a search box). */
export function useDebouncedValue<T>(value: T, delayMs = 200): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

/** setInterval as a hook. Pass delay=null to pause. */
export function useInterval(callback: () => void, delayMs: number | null): void {
  const saved = useRef(callback)
  useEffect(() => {
    saved.current = callback
  }, [callback])
  useEffect(() => {
    if (delayMs === null) return
    const id = setInterval(() => saved.current(), delayMs)
    return () => clearInterval(id)
  }, [delayMs])
}
