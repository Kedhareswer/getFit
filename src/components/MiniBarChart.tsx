interface Datum {
  label: string
  value: number
}

interface Props {
  data: Datum[]
  unit?: string
  /** caption for screen readers describing what the chart shows */
  caption: string
}

/** Hand-rolled, dependency-free bar chart with an accessible data-table equivalent. */
export default function MiniBarChart({ data, unit = '', caption }: Props) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const labelEvery = Math.max(1, Math.ceil(data.length / 7))

  return (
    <figure className="m-0">
      <div role="img" aria-label={caption} className="flex h-40 items-end gap-1.5">
        {data.map((d, i) => {
          const pct = (d.value / max) * 100
          return (
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end">
              <div
                className="w-full rounded-t bg-gradient-to-t from-primary/50 to-primary transition-all duration-300"
                style={{ height: `${d.value > 0 ? Math.max(2, pct) : 0}%` }}
                title={`${d.label}: ${d.value.toLocaleString()}${unit ? ' ' + unit : ''}`}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex gap-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[0.625rem] text-dim">
            {i % labelEvery === 0 ? d.label : ''}
          </div>
        ))}
      </div>
      {/* screen-reader equivalent */}
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Value{unit ? ` (${unit})` : ''}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <th scope="row">{d.label}</th>
              <td>{d.value.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
