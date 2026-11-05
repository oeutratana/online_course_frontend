import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowTrendDown, faArrowTrendUp } from '@fortawesome/free-solid-svg-icons'

const StatCard = ({ title, value, hint, icon, tone, trend = null }) => {
  const hasTrend = trend !== null && trend !== undefined && Number.isFinite(Number(trend))
  const trendValue = Number(trend)
  const isPositive = trendValue >= 0

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/70">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-3 truncate text-3xl font-black tracking-tight text-slate-950">{value}</p>
        </div>
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg ${tone}`}>
          <FontAwesomeIcon icon={icon} />
        </span>
      </div>

      <div className="mt-3 flex min-h-5 items-center gap-2">
        {hasTrend && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-black ${
              isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
            }`}
          >
            <FontAwesomeIcon icon={isPositive ? faArrowTrendUp : faArrowTrendDown} />
            {isPositive ? '+' : ''}
            {trendValue}%
          </span>
        )}
        {hint && <p className="truncate text-[11px] font-semibold text-slate-500">{hint}</p>}
      </div>

      <span className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-slate-50 opacity-0 transition group-hover:opacity-100" />
    </article>
  )
}

export default StatCard
