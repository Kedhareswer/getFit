import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import type { FilterCriteria } from '../types'
import { useData } from '../state/DataContext'
import { filterExercises, titleCase } from '../lib/data'
import { useDebouncedValue } from '../lib/hooks'
import RequireData from '../components/RequireData'
import ExerciseCard from '../components/ExerciseCard'
import FilterPanel from '../components/FilterPanel'
import EmptyState from '../components/EmptyState'
import Modal from '../components/ui/Modal'
import { useReveal } from '../lib/anim'

const PAGE = 48

export default function Library() {
  return (
    <RequireData>
      <LibraryInner />
    </RequireData>
  )
}

function LibraryInner() {
  const { exercises, facets } = useData()
  const [params, setParams] = useSearchParams()
  const [mobileFilters, setMobileFilters] = useState(false)

  const csv = (k: string) => params.get(k)?.split(',').filter(Boolean) ?? []
  const criteria: FilterCriteria = useMemo(
    () => ({
      query: params.get('q') ?? '',
      bodyParts: csv('bp'),
      equipment: csv('eq'),
      targets: csv('tg'),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params],
  )
  const sort = params.get('sort') ?? 'relevance'

  const writeParams = (next: FilterCriteria, sortNext = sort) => {
    const p = new URLSearchParams()
    if (next.query) p.set('q', next.query)
    if (next.bodyParts.length) p.set('bp', next.bodyParts.join(','))
    if (next.equipment.length) p.set('eq', next.equipment.join(','))
    if (next.targets.length) p.set('tg', next.targets.join(','))
    if (sortNext !== 'relevance') p.set('sort', sortNext)
    setParams(p, { replace: true })
  }

  // search input — local for responsiveness, debounced into the URL
  const [q, setQ] = useState(criteria.query)
  const dq = useDebouncedValue(q, 200)
  useEffect(() => {
    if (dq !== criteria.query) writeParams({ ...criteria, query: dq })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq])

  const results = useMemo(() => filterExercises(exercises, criteria), [exercises, criteria])
  const sorted = useMemo(() => {
    if (sort === 'name') return [...results].sort((a, b) => a.name.localeCompare(b.name))
    return results
  }, [results, sort])

  const [limit, setLimit] = useState(PAGE)
  useEffect(() => setLimit(PAGE), [criteria, sort])
  const visible = sorted.slice(0, limit)

  const activeChips = [
    ...criteria.bodyParts.map((v) => ({ key: 'bp', v })),
    ...criteria.targets.map((v) => ({ key: 'tg', v })),
    ...criteria.equipment.map((v) => ({ key: 'eq', v })),
  ]
  const hasFilters = activeChips.length > 0 || criteria.query.length > 0

  const removeChip = (key: string, value: string) => {
    const map: Record<string, keyof FilterCriteria> = { bp: 'bodyParts', tg: 'targets', eq: 'equipment' }
    const field = map[key]
    writeParams({ ...criteria, [field]: (criteria[field] as string[]).filter((v) => v !== value) })
  }

  const clearAll = () => {
    setQ('')
    writeParams({ query: '', bodyParts: [], equipment: [], targets: [] })
  }

  const revealRef = useReveal<HTMLDivElement>()

  return (
    <div ref={revealRef} className="page-wide">
      <header className="mb-8 border-b border-border pb-8" data-reveal>
        <p className="overline">The library</p>
        <h1 className="mt-3 font-display text-display-sm leading-[1.02]">Exercise Library</h1>
        <p className="mt-3 font-mono text-xs uppercase tracking-wide text-muted" aria-live="polite">
          {sorted.length.toLocaleString()}
          <span className="text-dim"> / {exercises.length.toLocaleString()} exercises</span>
        </p>
      </header>

      {/* search + controls */}
      <div className="sticky top-14 z-20 -mx-4 mb-5 bg-bg/85 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim"
              aria-hidden
            />
            <input
              type="search"
              className="input pl-11"
              placeholder="Search exercises, muscles…"
              aria-label="Search exercises"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <label className="hidden items-center gap-2 sm:flex">
            <span className="sr-only">Sort by</span>
            <select
              className="input w-auto"
              value={sort}
              onChange={(e) => writeParams(criteria, e.target.value)}
            >
              <option value="relevance">Relevance</option>
              <option value="name">Name A–Z</option>
            </select>
          </label>
          <button
            className="btn btn-soft lg:hidden"
            onClick={() => setMobileFilters(true)}
            aria-label="Open filters"
          >
            <SlidersHorizontal size={18} />
            {activeChips.length > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-fg">
                {activeChips.length}
              </span>
            )}
          </button>
        </div>

        {hasFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {activeChips.map(({ key, v }) => (
              <button
                key={`${key}-${v}`}
                className="chip chip-active"
                onClick={() => removeChip(key, v)}
                aria-label={`Remove filter ${titleCase(v)}`}
              >
                {titleCase(v)}
                <X size={14} aria-hidden />
              </button>
            ))}
            <button className="text-sm font-medium text-muted underline-offset-2 hover:text-text hover:underline" onClick={clearAll}>
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="lg:flex lg:gap-8">
        {/* desktop filter rail */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-6">
            <FilterPanel facets={facets} criteria={criteria} onChange={(c) => writeParams(c)} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {visible.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No exercises match these filters"
              message={`Try removing a filter — there are ${exercises.length.toLocaleString()} exercises in total.`}
              action={{ label: 'Clear all filters', onClick: clearAll }}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                {visible.map((e) => (
                  <ExerciseCard key={e.id} exercise={e} />
                ))}
              </div>
              {limit < sorted.length ? (
                <div className="mt-8 flex justify-center">
                  <button className="btn btn-soft" onClick={() => setLimit((l) => l + PAGE)}>
                    Load more ({(sorted.length - limit).toLocaleString()} remaining)
                  </button>
                </div>
              ) : (
                sorted.length > PAGE && (
                  <p className="mt-8 text-center text-sm text-dim">End of results</p>
                )
              )}
            </>
          )}
        </div>
      </div>

      {/* mobile filter sheet */}
      <Modal open={mobileFilters} onClose={() => setMobileFilters(false)} title="Filters" size="md">
        <FilterPanel facets={facets} criteria={criteria} onChange={(c) => writeParams(c)} />
        <div className="mt-6 flex gap-2">
          <button className="btn btn-ghost flex-1" onClick={clearAll}>
            Clear all
          </button>
          <button className="btn btn-primary flex-1" onClick={() => setMobileFilters(false)}>
            Show {sorted.length.toLocaleString()} results
          </button>
        </div>
      </Modal>
    </div>
  )
}
