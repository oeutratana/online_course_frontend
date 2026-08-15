import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBell,
  faBuilding,
  faChevronRight,
  faCreditCard,
  faEnvelope,
  faGear,
  faGlobe,
  faKey,
  faLock,
  faPalette,
  faSave,
  faShieldHalved,
  faToggleOn,
  faUserGear,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from './AdminPageHeader'

const quickSettings = [
  { title: 'Platform Profile', text: 'Branding, institution name, and public identity.', icon: faBuilding, color: 'bg-violet-100 text-violet-700' },
  { title: 'Notifications', text: 'Email, alerts, and admin notification rules.', icon: faBell, color: 'bg-cyan-100 text-cyan-700' },
  { title: 'Security', text: 'Password rules, sessions, and administrator access.', icon: faShieldHalved, color: 'bg-emerald-100 text-emerald-700' },
  { title: 'Billing', text: 'Invoices, payout settings, and tax information.', icon: faCreditCard, color: 'bg-amber-100 text-amber-700' },
]

const permissions = [
  ['Course Publishing', 'Allow instructors to publish courses after review'],
  ['Student Export', 'Permit CSV exports for student records'],
  ['Revenue Access', 'Show financial dashboards to senior admins'],
]

const matchesSearch = (query, values) => !query || values.join(' ').toLowerCase().includes(query)

const SettingsPage = ({ searchQuery = '' }) => {
  const normalizedSearch = searchQuery.trim().toLowerCase()
  const filteredQuickSettings = quickSettings.filter((item) => matchesSearch(normalizedSearch, [item.title, item.text]))
  const filteredPermissions = permissions.filter((permission) => matchesSearch(normalizedSearch, permission))
  const footerSettings = [
    ['Theme', 'Customize colors and dashboard appearance.', faPalette],
    ['Localization', 'Manage language and regional settings.', faGlobe],
    ['Billing Rules', 'Set revenue sharing and payout defaults.', faCreditCard],
  ]
  const filteredFooterSettings = footerSettings.filter((item) => matchesSearch(normalizedSearch, item.slice(0, 2)))

  return (
  <div className="px-5 py-8 xl:px-8">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <AdminPageHeader title="Settings" text="Configure platform preferences and admin controls." />
      <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 text-sm font-black text-white shadow-lg shadow-violet-200" type="button">
        <FontAwesomeIcon icon={faSave} />
        Save Changes
      </button>
    </div>

    <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {filteredQuickSettings.map((item) => (
        <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/50" key={item.title}>
          <div className="flex items-start justify-between gap-4">
            <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${item.color}`}>
              <FontAwesomeIcon icon={item.icon} />
            </span>
            <FontAwesomeIcon className="text-slate-300" icon={faChevronRight} />
          </div>
          <h2 className="mt-5 text-lg font-black">{item.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{item.text}</p>
        </article>
      ))}
    </div>

    <div className="mt-8 grid gap-6 2xl:grid-cols-[1fr_420px]">
      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/50">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-xl text-violet-700">
            <FontAwesomeIcon icon={faGear} />
          </span>
          <div>
            <h2 className="text-xl font-black">Platform Settings</h2>
            <p className="mt-1 text-sm text-slate-500">Update the public identity and defaults for your online course platform.</p>
          </div>
        </div>

        <form className="mt-7 grid gap-5 lg:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Platform Name
            <input className="h-12 rounded-lg border border-slate-200 bg-slate-50 px-4 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" defaultValue="Online Course" />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Support Email
            <div className="relative">
              <FontAwesomeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" icon={faEnvelope} />
              <input className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" defaultValue="support@onlinecourse.edu" />
            </div>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Default Language
            <select className="h-12 rounded-lg border border-slate-200 bg-slate-50 px-4 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100">
              <option>English</option>
              <option>Khmer</option>
              <option>Thai</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Time Zone
            <select className="h-12 rounded-lg border border-slate-200 bg-slate-50 px-4 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100">
              <option>Asia/Bangkok</option>
              <option>UTC</option>
              <option>America/New_York</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700 lg:col-span-2">
            Platform Description
            <textarea className="min-h-32 rounded-lg border border-slate-200 bg-slate-50 p-4 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" defaultValue="Professional online learning platform for students, instructors, and institutions." />
          </label>
        </form>
      </section>

      <aside className="grid gap-6">
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/50">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-xl text-emerald-700">
              <FontAwesomeIcon icon={faLock} />
            </span>
            <div>
              <h2 className="text-xl font-black">Security</h2>
              <p className="mt-1 text-sm text-slate-500">Protect admin access.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4">
            {['Two-factor authentication', 'Require strong passwords', 'Auto logout after inactivity']
              .filter((item) => matchesSearch(normalizedSearch, ['Security', item]))
              .map((item) => (
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4" key={item}>
                <span className="font-semibold text-slate-700">{item}</span>
                <FontAwesomeIcon className="text-2xl text-violet-600" icon={faToggleOn} />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/50">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-xl text-amber-700">
              <FontAwesomeIcon icon={faKey} />
            </span>
            <div>
              <h2 className="text-xl font-black">Access Keys</h2>
              <p className="mt-1 text-sm text-slate-500">API and integration controls.</p>
            </div>
          </div>
          <button className="mt-6 h-11 w-full rounded-lg border border-violet-200 bg-violet-50 text-sm font-black text-violet-700" type="button">
            Generate New Key
          </button>
        </section>
      </aside>
    </div>

    <section className="mt-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/50">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-xl text-cyan-700">
          <FontAwesomeIcon icon={faUserGear} />
        </span>
        <div>
          <h2 className="text-xl font-black">Admin Permissions</h2>
          <p className="mt-1 text-sm text-slate-500">Control what administrators and instructors can manage.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {filteredPermissions.map((permission) => (
          <article className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50 p-5 md:flex-row md:items-center md:justify-between" key={permission[0]}>
            <div>
              <h3 className="font-black">{permission[0]}</h3>
              <p className="mt-1 text-sm text-slate-500">{permission[1]}</p>
            </div>
            <FontAwesomeIcon className="text-2xl text-violet-600" icon={faToggleOn} />
          </article>
        ))}
      </div>
    </section>

    <section className="mt-8 grid gap-5 md:grid-cols-3">
      {filteredFooterSettings.map((item) => (
        <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/50" key={item[0]}>
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-xl text-violet-700">
            <FontAwesomeIcon icon={item[2]} />
          </span>
          <h2 className="mt-5 text-lg font-black">{item[0]}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{item[1]}</p>
        </article>
      ))}
    </section>
  </div>
  )
}

export default SettingsPage
