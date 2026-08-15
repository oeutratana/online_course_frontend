import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBell,
  faBookOpen,
  faGear,
  faLayerGroup,
  faRightFromBracket,
  faMagnifyingGlass,
  faTableList,
  faHouse,
  faUserGroup,
  faUserTie,
} from '@fortawesome/free-solid-svg-icons'
import DashboardPage from './pages/DashboardPage'
import CoursesPage from './pages/CoursesPage'
import StudentsPage from './pages/StudentsPage'
import SettingsPage from './pages/SettingsPage'
import { logout } from '../lib/authApi'
import CategoryPage from './pages/CategoryPage'

const navItems = [
  { label: 'Dashboard', icon: faHouse, page: DashboardPage },
  { label: 'Courses', icon: faTableList, page: CoursesPage },
  { label: 'Students', icon: faUserGroup, page: StudentsPage },
  { label: 'Categories', icon: faLayerGroup, page: CategoryPage },
  { label: 'Settings', icon: faGear, page: SettingsPage },
]

const AdminDashboard = () => {
  const [activePage, setActivePage] = useState('Dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const CurrentPage = navItems.find((item) => item.label === activePage)?.page || DashboardPage

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      await logout()
    } finally {
      window.location.href = '/login'
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8ff] text-[#151a33]">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 flex-col border-r border-slate-200 bg-white text-slate-700 xl:flex">
        <div className="flex items-center gap-4 border-b border-slate-100 px-8 py-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-3xl text-violet-600">
            <FontAwesomeIcon icon={faBookOpen} />
          </span>
          <div>
            <h1 className="text-[23px] font-black text-blue-700">Online Course</h1>
            <p className="text-sm text-slate-500">Online Course Platform</p>
          </div>
        </div>

        <nav className="mt-6 grid gap-2 px-4">
          {navItems.map((item) => (
            <button
              className={`flex items-center gap-4 rounded-xl px-5 py-3.5 text-left text-base font-semibold transition ${
                activePage === item.label
                  ? 'bg-violet-50 text-violet-700 ring-1 ring-violet-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-violet-700'
              }`}
              key={item.label}
              onClick={() => {
                setActivePage(item.label)
                setSearchQuery('')
              }}
              type="button"
            >
              <FontAwesomeIcon className="w-6" icon={item.icon} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="xl:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-20 flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between xl:px-8">
            <div className="relative w-full max-w-md">
              <FontAwesomeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" icon={faMagnifyingGlass} />
              <input
                className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={`Search ${activePage.toLowerCase()}...`}
                type="search"
                value={searchQuery}
              />
            </div>

            <div className="flex items-center justify-between gap-5 md:justify-end">
              <button className="relative text-xl text-slate-600" type="button" aria-label="Notifications">
                <FontAwesomeIcon icon={faBell} />
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white">
                  0
                </span>
              </button>
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:text-slate-400"
                disabled={isLoggingOut}
                onClick={handleLogout}
                type="button"
              >
                <FontAwesomeIcon icon={faRightFromBracket} />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </header>

        <CurrentPage searchQuery={searchQuery} />
      </section>
    </main>
  )
}

export default AdminDashboard
