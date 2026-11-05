import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBars,
  faBell,
  faBookOpen,
  faBookOpenReader,
  faCalendarDays,
  faCertificate,
  faChartLine,
  faChartPie,
  faChevronDown,
  faCircleQuestion,
  faCreditCard,
  faGear,
  faLayerGroup,
  faListCheck,
  faMagnifyingGlass,
  faRightFromBracket,
  faStar,
  faTimes,
  faUserGraduate,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'
import { getStoredAuthUser, getUserRole, logout } from '../lib/authApi'
import { getAdminDashboard } from '../lib/adminDashboardApi'
import { formatRelativeTime, getInitials } from './adminUtils'

const navGroups = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', to: '/admin/dashboard', icon: faChartPie },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Courses', to: '/admin/courses', icon: faBookOpen },
      { label: 'Categories', to: '/admin/categories', icon: faLayerGroup },
      { label: 'Lessons', to: '/admin/lessons', icon: faBookOpenReader },
      { label: 'Quizzes', to: '/admin/quizzes', icon: faListCheck },
      { label: 'Questions', to: '/admin/questions', icon: faCircleQuestion },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Users', to: '/admin/users', icon: faUsers },
      { label: 'Enrollments', to: '/admin/enrollments', icon: faUserGraduate },
      { label: 'Lesson Progress', to: '/admin/progress', icon: faChartLine },
      { label: 'Certificates', to: '/admin/certificates', icon: faCertificate },
      { label: 'Course Reviews', to: '/admin/reviews', icon: faStar },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Payments', to: '/admin/payments', icon: faCreditCard },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Settings', to: '/admin/settings', icon: faGear },
    ],
  },
]

const activityIcons = {
  enrollment: { icon: faUserGraduate, tone: 'bg-blue-500/15 text-blue-300' },
  payment: { icon: faCreditCard, tone: 'bg-emerald-500/15 text-emerald-300' },
  user: { icon: faUsers, tone: 'bg-violet-500/15 text-violet-300' },
  course_created: { icon: faBookOpen, tone: 'bg-amber-500/15 text-amber-300' },
  course_updated: { icon: faBookOpen, tone: 'bg-cyan-500/15 text-cyan-300' },
}

const AdminDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const profileRef = useRef(null)
  const notificationsRef = useRef(null)
  const user = getStoredAuthUser()
  const role = getUserRole(user) || 'admin'
  const adminName = user?.name || 'Admin'
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  useEffect(() => {
    let isMounted = true

    getAdminDashboard({ range: '7d' })
      .then((data) => {
        if (isMounted) setNotifications(data.recentActivity.slice(0, 6))
      })
      .catch(() => {
        if (isMounted) setNotifications([])
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }

      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)

    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      await logout()
    } finally {
      window.location.href = '/login'
    }
  }

  const navigateTo = (to) => {
    window.location.href = to
  }

  const sidebarWidthClass = sidebarCollapsed ? 'xl:w-20' : 'xl:w-72'
  const contentOffsetClass = sidebarCollapsed ? 'xl:pl-20' : 'xl:pl-72'

  return (
    <main className="min-h-screen bg-[#f4f7fe] text-slate-900">
      {mobileMenuOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 cursor-default bg-slate-950/60 backdrop-blur-sm xl:hidden"
          onClick={() => setMobileMenuOpen(false)}
          type="button"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#0b1437] text-slate-200 shadow-2xl transition-all duration-300 xl:translate-x-0 ${sidebarWidthClass} ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className={`flex h-20 items-center gap-3 border-b border-white/10 px-5 ${sidebarCollapsed ? 'xl:justify-center xl:px-0' : ''}`}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2563eb] text-xl text-white shadow-lg shadow-blue-950/40">
            <FontAwesomeIcon icon={faBookOpen} />
          </span>
          <div className={`min-w-0 ${sidebarCollapsed ? 'xl:hidden' : ''}`}>
            <h1 className="truncate text-base font-black tracking-tight text-white">CourseHub</h1>
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-300">
              Admin panel
            </p>
          </div>
          <button
            aria-label="Close sidebar"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white xl:hidden"
            onClick={() => setMobileMenuOpen(false)}
            type="button"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-4">
          {navGroups.map((group) => (
            <div className="mb-4" key={group.label}>
              <p className={`px-3 pb-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 ${sidebarCollapsed ? 'xl:hidden' : ''}`}>
                {group.label}
              </p>
              <div className="grid gap-1">
                {group.items.map((item) => (
                  <NavLink
                    className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-[#2563eb] text-white shadow-lg shadow-blue-950/30'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    } ${sidebarCollapsed ? 'xl:justify-center xl:px-0' : ''}`}
                    key={item.to}
                    onClick={() => {
                      setSearchQuery('')
                      setMobileMenuOpen(false)
                    }}
                    title={sidebarCollapsed ? item.label : undefined}
                    to={item.to}
                  >
                    <FontAwesomeIcon className="w-4 shrink-0 text-center" icon={item.icon} />
                    <span className={`truncate ${sidebarCollapsed ? 'xl:hidden' : ''}`}>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-60 ${
              sidebarCollapsed ? 'xl:justify-center xl:px-0' : ''
            }`}
            disabled={isLoggingOut}
            onClick={handleLogout}
            title="Logout"
            type="button"
          >
            <FontAwesomeIcon className="w-4 shrink-0" icon={faRightFromBracket} />
            <span className={sidebarCollapsed ? 'xl:hidden' : ''}>
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </span>
          </button>
        </div>
      </aside>

      <section className={`min-h-screen transition-all duration-300 ${contentOffsetClass}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-[72px] items-center gap-3 px-4 sm:px-6 xl:px-8">
            <button
              aria-label="Open sidebar"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 xl:hidden"
              onClick={() => setMobileMenuOpen(true)}
              type="button"
            >
              <FontAwesomeIcon icon={faBars} />
            </button>
            <button
              aria-label="Toggle sidebar"
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 xl:flex"
              onClick={() => setSidebarCollapsed((current) => !current)}
              type="button"
            >
              <FontAwesomeIcon icon={faBars} />
            </button>

            <div className="relative w-full max-w-md">
              <FontAwesomeIcon
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400"
                icon={faMagnifyingGlass}
              />
              <input
                aria-label="Global search"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search courses, students, payments..."
                type="search"
                value={searchQuery}
              />
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 lg:flex">
                <FontAwesomeIcon className="text-blue-500" icon={faCalendarDays} />
                {today}
              </div>

              <div className="relative" ref={notificationsRef}>
                <button
                  aria-label="Notifications"
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                  onClick={() => {
                    setNotificationsOpen((current) => !current)
                    setProfileOpen(false)
                  }}
                  type="button"
                >
                  <FontAwesomeIcon icon={faBell} />
                  {notifications.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white ring-2 ring-white">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-300/40">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="text-sm font-black text-slate-900">Recent activity</p>
                      <p className="text-xs text-slate-500">Derived from real platform records</p>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-slate-500">No activity yet.</p>
                    ) : (
                      <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                        {notifications.map((event) => {
                          const meta = activityIcons[event.type] || activityIcons.user

                          return (
                            <li className="flex gap-3 px-4 py-3" key={event.id}>
                              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs ${meta.tone}`}>
                                <FontAwesomeIcon icon={meta.icon} />
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-black text-slate-800">{event.title}</p>
                                <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{event.description}</p>
                                <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                  {formatRelativeTime(event.timestamp)}
                                </p>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div className="relative" ref={profileRef}>
                <button
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 pr-2 transition hover:bg-slate-50 sm:gap-3 sm:pr-3"
                  onClick={() => {
                    setProfileOpen((current) => !current)
                    setNotificationsOpen(false)
                  }}
                  type="button"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563eb] text-xs font-black text-white">
                    {getInitials(adminName)}
                  </span>
                  <span className="hidden min-w-0 text-left sm:block">
                    <span className="block max-w-32 truncate text-xs font-black text-slate-900">{adminName}</span>
                    <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      {role}
                    </span>
                  </span>
                  <FontAwesomeIcon className="hidden text-[10px] text-slate-400 sm:block" icon={faChevronDown} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-300/40">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="truncate text-sm font-black text-slate-900">{adminName}</p>
                      <p className="truncate text-xs text-slate-500">{user?.email || role}</p>
                    </div>
                    <div className="grid p-1.5">
                      <button
                        className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        onClick={() => navigateTo('/profile')}
                        type="button"
                      >
                        My profile
                      </button>
                      <button
                        className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        onClick={() => navigateTo('/admin/settings')}
                        type="button"
                      >
                        Account settings
                      </button>
                      <button
                        className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                        disabled={isLoggingOut}
                        onClick={handleLogout}
                        type="button"
                      >
                        {isLoggingOut ? 'Logging out...' : 'Logout'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <Outlet context={{ searchQuery }} />
      </section>
    </main>
  )
}

export default AdminDashboard
