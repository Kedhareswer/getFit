import { useState } from 'react'
import type { Facet, Facets, FilterCriteria } from '../types'

interface Props {
  facets: Facets
  criteria: FilterCriteria
  onChange: (next: FilterCriteria) => void
}

type FacetKey = 'bodyParts' | 'equipment' | 'targets'

export default function FilterPanel({ facets, criteria, onChange }: Props) {
  const toggle = (key: FacetKey, value: string) => {
    const arr = criteria[key]
    onChange({
      ...criteria,
      [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
    })
  }

  return (
    <div className="space-y-6">
      <FacetGroup
        title="Body part"
        items={facets.bodyParts}
        selected={criteria.bodyParts}
        onToggle={(v) => toggle('bodyParts', v)}
      />
      <FacetGroup
        title="Target muscle"
        items={facets.targets}
        selected={criteria.targets}
        onToggle={(v) => toggle('targets', v)}
        initial={8}
      />
      <FacetGroup
        title="Equipment"
        items={facets.equipment}
        selected={criteria.equipment}
        onToggle={(v) => toggle('equipment', v)}
        initial={8}
      />
    </div>
  )
}

function FacetGroup({
  title,
  items,
  selected,
  onToggle,
  initial,
}: {
  title: string
  items: Facet[]
  selected: string[]
  onToggle: (value: string) => void
  initial?: number
}) {
  const [expanded, setExpanded] = useState(false)
  const shown = initial && !expanded ? items.slice(0, initial) : items
  const hidden = items.length - shown.length

  return (
    <fieldset>
      <legend className="label">{title}</legend>
      <div className="flex flex-wrap gap-1.5">
        {shown.map((f) => {
          const active = selected.includes(f.value)
          return (
            <button
              key={f.value}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(f.value)}
              className={`chip ${active ? 'chip-active' : ''}`}
            >
              {f.label}
              <span className={active ? 'text-primary/70' : 'text-dim'}>{f.count}</span>
            </button>
          )
        })}
        {initial && hidden > 0 && (
          <button
            type="button"
            className="chip border-dashed"
            onClick={() => setExpanded(true)}
          >
            +{hidden} more
          </button>
        )}
        {initial && expanded && (
          <button type="button" className="chip border-dashed" onClick={() => setExpanded(false)}>
            Show less
          </button>
        )}
      </div>
    </fieldset>
  )
}
