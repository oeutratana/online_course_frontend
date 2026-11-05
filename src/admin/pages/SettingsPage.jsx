import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBell,
  faBuilding,
  faChevronRight,
  faCreditCard,
  faEnvelope,
  faGear,
  faGlobe,
  faInfoCircle,
  faKey,
  faLock,
  faPalette,
  faShieldHalved,
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
  <div className="px-4 py-6 sm:px-5 xl:px-8">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <AdminPageHeader title="Settings" text="Platform configuration is managed from the Laravel backend." />
    </div>

    <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <FontAwesomeIcon icon={faInfoCircle} />
        </span>
        <div>
          <h2 className="text-base font-black text-amber-900">Environment Configuration Only</h2>
          <p className="mt-1 text-sm leading-6 text-amber-800">
            There is no admin settings endpoint in the API, so these values cannot be edited from this console and no secret is ever returned. Change them in the Laravel <code className="rounded bg-amber-100 px-1 py-0.5">.env</code> file and clear the config cache.
          </p>
        </div>
      </div>
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

    <div className="mt-6 grid gap-6 2xl:grid-cols-[1fr_420px]">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-xl text-violet-700">
            <FontAwesomeIcon icon={faGear} />
          </span>
          <div>
            <h2 className="text-lg font-black text-slate-950 sm:text-xl">Platform Settings</h2>
            <p className="mt-1 text-sm text-slate-500">Displayed for reference only. Values are read from Laravel configuration.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="grid gap-2 text-sm font-semibold text-slate-700">
            Platform Name
            <div className="flex h-11 items-center rounded-lg border border-slate-200 bg-slate-50 px-4 text-slate-600">Online Course</div>
          </div>
          <div className="grid gap-2 text-sm font-semibold text-slate-700">
            Support Email
            <div className="relative">
              <FontAwesomeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" icon={faEnvelope} />
              <div className="flex h-11 w-full items-center rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-slate-600">Configured via Laravel</div>
            </div>
          </div>
          <div className="grid gap-2 text-sm font-semibold text-slate-700">
            Default Language
            <div className="flex h-11 items-center rounded-lg border border-slate-200 bg-slate-50 px-4 text-slate-600">English</div>
          </div>
          <div className="grid gap-2 text-sm font-semibold text-slate-700">
            Time Zone
            <div className="flex h-11 items-center rounded-lg border border-slate-200 bg-slate-50 px-4 text-slate-600">Asia/Bangkok</div>
          </div>
          <div className="grid gap-2 text-sm font-semibold text-slate-700 lg:col-span-2">
            Platform Description
            <div className="min-h-28 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">Professional online learning platform for students, instructors, and institutions.</div>
          </div>
        </div>
      </section>

      <aside className="grid gap-6">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-xl text-emerald-700">
              <FontAwesomeIcon icon={faLock} />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-950 sm:text-xl">Security</h2>
              <p className="mt-1 text-sm text-slate-500">Protect admin access.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            {['Two-factor authentication', 'Require strong passwords', 'Auto logout after inactivity']
              .filter((item) => matchesSearch(normalizedSearch, ['Security', item]))
              .map((item) => (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3" key={item}>
                <span className="text-sm font-semibold text-slate-700">{item}</span>
                <span className="text-xs font-semibold text-slate-500">Managed in .env</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-xl text-amber-700">
              <FontAwesomeIcon icon={faKey} />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-950 sm:text-xl">Access Keys</h2>
              <p className="mt-1 text-sm text-slate-500">API and integration controls.</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-600">Credentials are stored in Laravel environment files. No keys are exposed to this interface.</p>
        </section>
      </aside>
    </div>

    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-xl text-cyan-700">
          <FontAwesomeIcon icon={faUserGear} />
        </span>
        <div>
          <h2 className="text-lg font-black text-slate-950 sm:text-xl">Admin Permissions</h2>
          <p className="mt-1 text-sm text-slate-500">Authorization is enforced by the Laravel <code className="rounded bg-slate-100 px-1 py-0.5">admin</code> middleware.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {filteredPermissions.map((permission) => (
          <article className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between" key={permission[0]}>
            <div>
              <h3 className="font-semibold text-slate-900">{permission[0]}</h3>
              <p className="mt-1 text-sm text-slate-500">{permission[1]}</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">Backend controlled</span>
          </article>
        ))}
      </div>
    </section>

    <section className="mt-6 grid gap-4 md:grid-cols-3">
      {filteredFooterSettings.map((item) => (
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" key={item[0]}>
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-violet-100 text-lg text-violet-700">
            <FontAwesomeIcon icon={item[2]} />
          </span>
          <h2 className="mt-4 text-base font-black text-slate-950">{item[0]}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{item[1]}</p>
        </article>
      ))}
    </section>
  </div>
  )
}

export default SettingsPage
