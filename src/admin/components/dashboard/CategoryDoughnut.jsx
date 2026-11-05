import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons'

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#64748b']

const CategoryDoughnut = ({ data = [], total = 0, loading, error }) => {
  const counts = data.map((item) => Number(item.count ?? 0))
  const sum = counts.reduce((accumulator, count) => accumulator + count, 0)
  const radius = 68
  const circumference = 2 * Math.PI * radius
  const center = 100

  const segments = data.map((item, index) => {
    const share = sum > 0 ? Number(item.count) / sum : 0
    const length = share * circumference
    const previousCount = data
      .slice(0, index)
      .reduce((accumulator, previous) => accumulator + Number(previous.count ?? 0), 0)

    return {
      ...item,
      color: COLORS[index % COLORS.length],
      length,
      offset: sum > 0 ? (previousCount / sum) * circumference : 0,
      percentage: Number(item.percentage ?? (share * 100)),
    }
  })

  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <FontAwesomeIcon icon={faLayerGroup} />
        </span>
        <div>
          <h2 className="text-lg font-black text-slate-950">Courses by Category</h2>
          <p className="text-xs font-semibold text-slate-500">Distribution across the catalog</p>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 flex flex-1 items-center justify-center">
          <div className="h-40 w-40 animate-pulse rounded-full bg-slate-100" />
        </div>
      ) : error ? (
        <div className="mt-6 flex flex-1 items-center justify-center rounded-xl border border-dashed border-rose-200 bg-rose-50 px-5 py-10 text-center text-sm font-semibold text-rose-600">
          {error}
        </div>
      ) : data.length === 0 || sum === 0 ? (
        <div className="mt-6 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
            <FontAwesomeIcon icon={faLayerGroup} />
          </span>
          <p className="mt-3 text-sm font-bold text-slate-600">No courses yet</p>
          <p className="mt-1 text-xs text-slate-500">Category distribution appears once courses exist.</p>
        </div>
      ) : (
        <div className="mt-4 grid flex-1 gap-5">
          <div className="relative mx-auto h-44 w-44">
            <svg aria-label="Courses by category doughnut chart" className="h-full w-full" role="img" viewBox="0 0 200 200">
              <circle cx={center} cy={center} fill="none" r={radius} stroke="#eef2f7" strokeWidth="26" />
              {segments.map((segment) => (
                <circle
                  cx={center}
                  cy={center}
                  fill="none"
                  key={`${segment.id ?? segment.name}`}
                  r={radius}
                  stroke={segment.color}
                  strokeDasharray={`${Math.max(segment.length - 2, 0)} ${circumference - Math.max(segment.length - 2, 0)}`}
                  strokeDashoffset={-segment.offset}
                  strokeWidth="26"
                  transform={`rotate(-90 ${center} ${center})`}
                >
                  <title>{`${segment.name}: ${segment.count} course${segment.count === 1 ? '' : 's'} (${segment.percentage}%)`}</title>
                </circle>
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-black text-slate-950">{sum.toLocaleString()}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Courses</p>
            </div>
          </div>

          <ul className="max-h-52 space-y-2.5 overflow-y-auto pr-1">
            {segments.map((segment) => (
              <li className="flex items-center justify-between gap-3" key={`legend-${segment.id ?? segment.name}`}>
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
                  <span className="truncate text-xs font-bold text-slate-700">{segment.name}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  <span className="font-black text-slate-900">{segment.count}</span>
                  <span className="min-w-10 text-right font-semibold text-slate-500">{segment.percentage}%</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && !error && data.length > 0 && (
        <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] font-semibold text-slate-400">
          {total > 0 ? `${total.toLocaleString()} courses classified` : 'Counts come from the live courses table'}
        </p>
      )}
    </section>
  )
}

export default CategoryDoughnut
