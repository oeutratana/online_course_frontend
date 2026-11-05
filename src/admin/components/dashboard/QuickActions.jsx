import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight,
  faBookOpen,
  faCreditCard,
  faLayerGroup,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'

const ACTIONS = [
  {
    title: 'Add New Course',
    text: 'Create and publish a new course',
    to: '/admin/courses',
    icon: faBookOpen,
    tone: 'bg-blue-50 text-blue-600',
    hover: 'hover:border-blue-200 hover:bg-blue-50/40',
  },
  {
    title: 'Manage Users',
    text: 'Review students and admins',
    to: '/admin/users',
    icon: faUsers,
    tone: 'bg-emerald-50 text-emerald-600',
    hover: 'hover:border-emerald-200 hover:bg-emerald-50/40',
  },
  {
    title: 'Manage Categories',
    text: 'Organize the course catalog',
    to: '/admin/categories',
    icon: faLayerGroup,
    tone: 'bg-amber-50 text-amber-600',
    hover: 'hover:border-amber-200 hover:bg-amber-50/40',
  },
  {
    title: 'View Payments',
    text: 'Track PayWay transactions',
    to: '/admin/payments',
    icon: faCreditCard,
    tone: 'bg-violet-50 text-violet-600',
    hover: 'hover:border-violet-200 hover:bg-violet-50/40',
  },
]

const QuickActions = () => (
  <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-black text-slate-950">Quick Actions</h2>
        <p className="mt-0.5 text-xs font-semibold text-slate-500">Jump straight into common tasks</p>
      </div>
    </div>

    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {ACTIONS.map((action) => (
        <a
          className={`group flex items-center gap-3 rounded-xl border border-slate-200 p-3.5 transition ${action.hover}`}
          href={action.to}
          key={action.title}
        >
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm ${action.tone}`}>
            <FontAwesomeIcon icon={action.icon} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-black text-slate-900">{action.title}</span>
            <span className="mt-0.5 block truncate text-[11px] font-semibold text-slate-500">{action.text}</span>
          </span>
          <FontAwesomeIcon
            className="text-[10px] text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
            icon={faArrowRight}
          />
        </a>
      ))}
    </div>
  </section>
)

export default QuickActions
