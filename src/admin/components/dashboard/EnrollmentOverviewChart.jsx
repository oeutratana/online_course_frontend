import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartLine } from '@fortawesome/free-solid-svg-icons'

const RANGES = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '3m', label: '3 Months' },
  { key: '1y', label: '1 Year' },
]

const CHART = {
  width: 760,
  height: 280,
  left: 46,
  right: 20,
  top: 24,
  bottom: 42,
}

const buildPoints = (values, max) => {
  const plotWidth = CHART.width - CHART.left - CHART.right
  const plotHeight = CHART.height - CHART.top - CHART.bottom
  const step = values.length > 1 ? plotWidth / (values.length - 1) : 0

  return values.map((value, index) => ({
    value,
    x: CHART.left + index * step,
    y: CHART.top + (1 - value / max) * plotHeight,
  }))
}

const smoothPath = (points) => points.reduce((path, point, index) => {
  if (index === 0) return `M${point.x},${point.y}`

  const previous = points[index - 1]
  const control = (point.x - previous.x) * 0.4

  return `${path} C${previous.x + control},${previous.y} ${point.x - control},${point.y} ${point.x},${point.y}`
}, '')

const areaPath = (points) => {
  if (points.length === 0) return ''

  const baseline = CHART.height - CHART.bottom

  return `${smoothPath(points)} L${points.at(-1).x},${baseline} L${points[0].x},${baseline} Z`
}

const EnrollmentOverviewChart = ({ data = [], range, onRangeChange, loading, error, total = 0 }) => {
  const values = data.map((point) => Number(point.count ?? 0))
  const rawMax = Math.max(...values, 1)
  const max = Math.max(4, Math.ceil(rawMax / 4) * 4)
  const points = buildPoints(values, max)
  const labelStep = Math.max(1, Math.ceil(data.length / 7))
  const gridLines = [0, 1, 2, 3, 4]

  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FontAwesomeIcon icon={faChartLine} />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-950">Enrollment Overview</h2>
              <p className="text-xs font-semibold text-slate-500">New enrollments over time</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
          {RANGES.map((item) => (
            <button
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                range === item.key
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              key={item.key}
              onClick={() => onRangeChange(item.key)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-end gap-2">
        <p className="text-2xl font-black text-slate-950">{total.toLocaleString()}</p>
        <p className="pb-1 text-xs font-semibold text-slate-500">enrollments in this period</p>
      </div>

      {loading ? (
        <div className="mt-4 h-64 w-full animate-pulse rounded-xl bg-slate-100" />
      ) : error ? (
        <div className="mt-4 flex h-64 items-center justify-center rounded-xl border border-dashed border-rose-200 bg-rose-50 px-6 text-center text-sm font-semibold text-rose-600">
          {error}
        </div>
      ) : data.length === 0 ? (
        <div className="mt-4 flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm font-semibold text-slate-500">
          No enrollment data for this period yet.
        </div>
      ) : (
        <div className="mt-2 h-64 w-full">
          <svg
            aria-label="Enrollment overview line chart"
            className="h-full w-full"
            role="img"
            viewBox={`0 0 ${CHART.width} ${CHART.height}`}
          >
            <defs>
              <linearGradient id="enrollmentLineArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {gridLines.map((line) => {
              const y = CHART.top + (line * (CHART.height - CHART.top - CHART.bottom)) / 4

              return (
                <g key={line}>
                  <line
                    stroke="#e2e8f0"
                    strokeDasharray="4 6"
                    x1={CHART.left}
                    x2={CHART.width - CHART.right}
                    y1={y}
                    y2={y}
                  />
                  <text
                    fill="#94a3b8"
                    fontSize="11"
                    fontWeight="700"
                    textAnchor="end"
                    x={CHART.left - 10}
                    y={y + 4}
                  >
                    {Math.round(max - (max / 4) * line)}
                  </text>
                </g>
              )
            })}

            <path d={areaPath(points)} fill="url(#enrollmentLineArea)" />
            <path
              d={smoothPath(points)}
              fill="none"
              stroke="#2563eb"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />

            {points.map((point, index) => {
              const showLabel = index % labelStep === 0 || index === points.length - 1

              return (
                <g key={`${data[index].key || index}-${index}`}>
                  <circle cx={point.x} cy={point.y} fill="#ffffff" r="4" stroke="#2563eb" strokeWidth="2.5">
                    <title>{`${data[index].label}: ${point.value} enrollment${point.value === 1 ? '' : 's'}`}</title>
                  </circle>
                  {showLabel && (
                    <text
                      fill="#94a3b8"
                      fontSize="10"
                      fontWeight="700"
                      textAnchor="middle"
                      x={point.x}
                      y={CHART.height - 16}
                    >
                      {data[index].label}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>
      )}
    </section>
  )
}

export default EnrollmentOverviewChart
