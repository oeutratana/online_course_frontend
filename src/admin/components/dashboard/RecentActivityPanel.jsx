import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBookOpen,
  faClockRotateLeft,
  faCreditCard,
  faUserGraduate,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'
import { formatRelativeTime } from '../../adminUtils'

const ACTIVITY_META = {
  enrollment: { icon: faUserGraduate, tone: 'bg-blue-50 text-blue-600' },
  payment: { icon: faCreditCard, tone: 'bg-emerald-50 text-emerald-600' },
  user: { icon: faUsers, tone: 'bg-violet-50 text-violet-600' },
  course_created: { icon: faBookOpen, tone: 'bg-amber-50 text-amber-600' },
  course_updated: { icon: faBookOpen, tone: 'bg-cyan-50 text-cyan-600' },
}

const RecentActivityPanel = ({ activities = [], loading }) => (
  <section className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <FontAwesomeIcon icon={faClockRotateLeft} />
        </span>
        <div>
          <h2 className="text-lg font-black text-slate-950">Recent Activity</h2>
          <p className="text-xs font-semibold text-slate-500">Live platform events</p>
        </div>
      </div>
      <a className="text-xs font-black text-blue-600 hover:underline" href="/admin/enrollments">
        View all
      </a>
    </div>

    <div className="mt-5 flex-1">
      {loading && activities.length === 0 ? (
        <ul className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <li className="flex gap-3" key={`activity-skeleton-${index}`}>
              <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-100" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-2.5 w-1/2 animate-pulse rounded bg-slate-100" />
                <div className="h-2.5 w-3/4 animate-pulse rounded bg-slate-100" />
              </div>
            </li>
          ))}
        </ul>
      ) : activities.length === 0 ? (
        <div className="flex h-full min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
            <FontAwesomeIcon icon={faClockRotateLeft} />
          </span>
          <p className="mt-3 text-sm font-bold text-slate-600">No activity yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Events appear when students enroll or payments are confirmed.
          </p>
        </div>
      ) : (
        <ul className="space-y-1">
          {activities.map((event) => {
            const meta = ACTIVITY_META[event.type] || ACTIVITY_META.user

            return (
              <li className="flex gap-3 rounded-xl px-1 py-2.5 transition hover:bg-slate-50" key={event.id}>
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs ${meta.tone}`}>
                  <FontAwesomeIcon icon={meta.icon} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black text-slate-900">{event.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-4 text-slate-500">{event.description}</p>
                </div>
                <span className="shrink-0 pt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {formatRelativeTime(event.timestamp)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>

    <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] font-semibold text-slate-400">
      Derived from real enrollment, payment, user and course timestamps.
    </p>
  </section>
)

export default RecentActivityPanel
