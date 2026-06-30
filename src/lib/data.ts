import type { Exercise, ExerciseFull, Facets, FilterCriteria, Lang } from '../types'

export const LANGS: Lang[] = ['en', 'es', 'it', 'tr', 'ru', 'zh']
export const LANG_NAMES: Record<Lang, string> = {
  en: 'English',
  es: 'Español',
  it: 'Italiano',
  tr: 'Türkçe',
  ru: 'Русский',
  zh: '中文',
}

const MEDIA_HOST = 'https://static.exercisedb.dev/media'

/** Build the hotlinked animation URL for an exercise, or null if no media id. */
export function mediaUrl(mediaId: string | null | undefined): string | null {
  if (!mediaId) return null
  // ponytail: media_id values are short alphanumerics from the dataset; guard anyway.
  if (!/^[\w-]{1,32}$/.test(mediaId)) return null
  return `${MEDIA_HOST}/${mediaId}.gif`
}

/** "body weight" -> "Body Weight" */
export function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

const base = import.meta.env.BASE_URL || '/'

let indexCache: Promise<Exercise[]> | null = null
/** Eagerly-loadable lean list (~270KB). Cached for the session. */
export function fetchIndex(): Promise<Exercise[]> {
  if (!indexCache) {
    indexCache = fetch(`${base}data/exercises.index.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load exercises (${r.status})`)
        return r.json()
      })
      .then((arr: unknown) => {
        if (!Array.isArray(arr)) throw new Error('Malformed exercise index')
        return arr as Exercise[]
      })
      .catch((err) => {
        indexCache = null // allow retry
        throw err
      })
  }
  return indexCache
}

let fullCache: Promise<Map<string, ExerciseFull>> | null = null
/** Full records with multilingual instructions (~9.7MB). Lazy; fetched once on first detail view. */
export function fetchFullMap(): Promise<Map<string, ExerciseFull>> {
  if (!fullCache) {
    fullCache = fetch(`${base}data/exercises.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load instructions (${r.status})`)
        return r.json()
      })
      .then((arr: unknown) => {
        if (!Array.isArray(arr)) throw new Error('Malformed exercise data')
        const map = new Map<string, ExerciseFull>()
        for (const e of arr as ExerciseFull[]) map.set(e.id, e)
        return map
      })
      .catch((err) => {
        fullCache = null
        throw err
      })
  }
  return fullCache
}

/** Distinct facet values with counts, sorted by frequency. */
export function buildFacets(list: Exercise[]): Facets {
  const tally = (key: (e: Exercise) => string) => {
    const m = new Map<string, number>()
    for (const e of list) {
      const v = key(e)
      if (!v) continue
      m.set(v, (m.get(v) ?? 0) + 1)
    }
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([value, count]) => ({ value, label: titleCase(value), count }))
  }
  return {
    bodyParts: tally((e) => e.body_part),
    equipment: tally((e) => e.equipment),
    targets: tally((e) => e.target),
  }
}

/** Lowercase + strip accents so "glúteo"/"Türkçe" text searches harmlessly. */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

function nameBlob(e: Exercise): string {
  return normalize(e.name)
}
function muscleBlob(e: Exercise): string {
  return normalize([e.target, e.muscle_group, ...e.secondary_muscles, e.body_part, e.equipment].join(' '))
}

/** Filter by facets, then (if a query is present) rank by relevance: name hits beat muscle hits. */
export function filterExercises(list: Exercise[], c: FilterCriteria): Exercise[] {
  const bp = new Set(c.bodyParts)
  const eq = new Set(c.equipment)
  const tg = new Set(c.targets)
  const narrowed = list.filter((e) => {
    if (bp.size && !bp.has(e.body_part)) return false
    if (eq.size && !eq.has(e.equipment)) return false
    if (tg.size && !tg.has(e.target)) return false
    return true
  })

  const q = normalize(c.query.trim())
  if (!q) return narrowed
  const terms = q.split(/\s+/).filter(Boolean)

  const scored: { e: Exercise; score: number }[] = []
  for (const e of narrowed) {
    const name = nameBlob(e)
    const muscles = muscleBlob(e)
    // every term must appear somewhere (AND)
    if (!terms.every((t) => name.includes(t) || muscles.includes(t))) continue
    let score = 0
    if (name.startsWith(q)) score += 100
    if (name.includes(q)) score += 50
    for (const t of terms) {
      if (name.includes(t)) score += 10
      if (muscles.includes(t)) score += 3
    }
    scored.push({ e, score })
  }
  scored.sort((a, b) => b.score - a.score || a.e.name.localeCompare(b.e.name))
  return scored.map((s) => s.e)
}
