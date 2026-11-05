import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faCartShopping, faMoon, faSun, faUser, faXmark } from '@fortawesome/free-solid-svg-icons'
import { getCurrentUser, hasAuthSession, logout } from '../../lib/authApi'
import { clearUnseenCartCount, getUnseenCartCount } from '../../lib/cartNotifications'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme')

    if (savedTheme) {
      return savedTheme === 'dark'
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [user, setUser] = useState(null)
  const [isAuthChecking, setIsAuthChecking] = useState(() => hasAuthSession())
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const pathname = window.location.pathname
  const linkClass = (path) =>
    `py-5 transition hover:text-[#2d2be8] dark:hover:text-indigo-300 ${
      pathname === path
        ? 'border-b-2 border-[#2d2be8] text-[#2d2be8] dark:border-indigo-300 dark:text-indigo-300'
        : ''
    }`
  const mobileLinkClass = (path) =>
    `rounded-lg px-4 py-3 text-base font-semibold transition ${
      pathname === path
        ? 'bg-[#edf0ff] text-[#2d2be8] dark:bg-indigo-400/18 dark:text-indigo-100'
        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-700'
    }`

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  useEffect(() => {
    let isMounted = true

    if (!hasAuthSession()) {
      return undefined
    }

    getCurrentUser()
      .then((currentUser) => {
        if (isMounted) {
          setUser(currentUser)
          setCartCount(getUnseenCartCount(currentUser))
          setIsAuthChecking(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null)
          setCartCount(0)
          setIsAuthChecking(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!user) {
      return undefined
    }

    const updateCartCount = () => setCartCount(getUnseenCartCount(user))

    window.addEventListener('storage', updateCartCount)
    window.addEventListener('focus', updateCartCount)
    window.addEventListener('cart-unseen-change', updateCartCount)
    updateCartCount()

    return () => {
      window.removeEventListener('storage', updateCartCount)
      window.removeEventListener('focus', updateCartCount)
      window.removeEventListener('cart-unseen-change', updateCartCount)
    }
  }, [user])

  useEffect(() => {
    if (pathname !== '/cart' || !user) return

    clearUnseenCartCount(user)
    window.dispatchEvent(new Event('cart-unseen-change'))
  }, [pathname, user])

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      await logout()
    } finally {
      setUser(null)
      window.location.href = '/login'
    }
  }

  const authButton = isAuthChecking && !user ? (
    <span className="inline-block h-5 w-14" aria-hidden="true" />
  ) : user ? (
    <button
      className="text-sm font-medium text-slate-500 hover:text-[#2d2be8] disabled:cursor-not-allowed disabled:text-slate-400 dark:text-slate-300 dark:hover:text-indigo-300"
      disabled={isLoggingOut}
      onClick={handleLogout}
      type="button"
    >
      {isLoggingOut ? 'Logging out...' : 'Logout'}
    </button>
  ) : (
    <div className="flex items-center gap-4">
      <a className="text-sm font-medium text-slate-500 hover:text-[#2d2be8] dark:text-slate-300 dark:hover:text-indigo-300" href="/login">
        Login
      </a>
      <a
        className="rounded-lg bg-[#2d2be8] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#201ec7] dark:bg-indigo-600 dark:hover:bg-indigo-500"
        href="/register"
      >
        Register
      </a>
    </div>
  )

  const mobileAuthButton = isAuthChecking && !user ? (
    <span className="block h-12" aria-hidden="true" />
  ) : user ? (
    <button
      className="rounded-lg border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-[#2d2be8] hover:text-[#2d2be8] disabled:cursor-not-allowed disabled:text-slate-400 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-100 dark:hover:border-indigo-300 dark:hover:text-indigo-100"
      disabled={isLoggingOut}
      onClick={handleLogout}
      type="button"
    >
      {isLoggingOut ? 'Logging out...' : 'Logout'}
    </button>
  ) : (
    <div className="flex items-center gap-3">
      <a
        className="text-sm font-medium text-slate-600 transition hover:text-[#2d2be8] dark:text-slate-300 dark:hover:text-indigo-300"
        href="/login"
      >
        Login
      </a>
      <a
        className="rounded-lg bg-[#2d2be8] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#201ec7] dark:bg-indigo-600 dark:hover:bg-indigo-500"
        href="/register"
      >
        Register
      </a>
    </div>
  )
  const cartButton = user ? (
    <a
      className={`relative flex h-10 w-10 items-center justify-center rounded-lg border transition ${
        pathname === '/cart'
          ? 'border-[#2d2be8] bg-[#edf0ff] text-[#2d2be8] dark:border-indigo-300 dark:bg-indigo-400/18 dark:text-indigo-100'
          : 'border-slate-200 text-slate-700 hover:border-[#2d2be8] hover:text-[#2d2be8] dark:border-slate-600 dark:bg-slate-700/70 dark:text-indigo-100 dark:hover:border-indigo-300 dark:hover:text-indigo-100'
      }`}
      href="/cart"
      onClick={() => {
        clearUnseenCartCount(user)
        setCartCount(0)
      }}
      aria-label="Open cart list"
      title="Cart list"
    >
      <FontAwesomeIcon icon={faCartShopping} />
      {cartCount > 0 && (
        <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black leading-none text-white">
          {cartCount}
        </span>
      )}
    </a>
  ) : null
  const profileButton = user ? (
    <a
      className={`flex h-10 w-10 items-center justify-center rounded-lg border transition ${
        pathname === '/profile'
          ? 'border-[#2d2be8] bg-[#edf0ff] text-[#2d2be8] dark:border-indigo-300 dark:bg-indigo-400/18 dark:text-indigo-100'
          : 'border-slate-200 text-slate-700 hover:border-[#2d2be8] hover:text-[#2d2be8] dark:border-slate-600 dark:bg-slate-700/70 dark:text-indigo-100 dark:hover:border-indigo-300 dark:hover:text-indigo-100'
      }`}
      href="/profile"
      aria-label="Open profile"
      title="Profile"
    >
      <FontAwesomeIcon icon={faUser} />
    </a>
  ) : null

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur transition-colors dark:border-slate-700 dark:bg-[#1b273a]/95">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="/" className="text-2xl font-black tracking-tight text-[#1f22e8] dark:text-indigo-200">
          Online Course
        </a>

        <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
          <a className={linkClass('/')} href="/">
            Home
          </a>
          <a className={linkClass('/courses')} href="/courses">
            Courses
          </a>
          {user && (
            <a className={linkClass('/my-courses')} href="/my-courses">
              My Courses
            </a>
          )}
          <a className={linkClass('/popular')} href="/popular">
            Popular
          </a>
          <a className={linkClass('/about')} href="/about">
            About
          </a>
          <a className={linkClass('/contact')} href="/contact">
            Contact
          </a>
        </div>

        <div className="hidden items-center gap-5 md:flex">
          {cartButton}
          {profileButton}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:border-[#2d2be8] hover:text-[#2d2be8] dark:border-slate-600 dark:bg-slate-700/70 dark:text-indigo-100 dark:hover:border-indigo-300 dark:hover:text-indigo-100"
            type="button"
            onClick={() => setIsDarkMode((darkMode) => !darkMode)}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDarkMode ? 'Light mode' : 'Dark mode'}
          >
            <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} />
          </button>
          {authButton}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {cartButton}
          {profileButton}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:border-[#2d2be8] hover:text-[#2d2be8] dark:border-slate-600 dark:bg-slate-700/70 dark:text-indigo-100 dark:hover:border-indigo-300 dark:hover:text-indigo-100"
            type="button"
            onClick={() => setIsDarkMode((darkMode) => !darkMode)}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDarkMode ? 'Light mode' : 'Dark mode'}
          >
            <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} />
          </button>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-800 transition hover:border-[#2d2be8] hover:text-[#2d2be8] dark:border-slate-600 dark:bg-slate-700/70 dark:text-slate-100 dark:hover:border-indigo-300 dark:hover:text-indigo-100 md:hidden"
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMenuOpen}
          >
            <FontAwesomeIcon icon={isMenuOpen ? faXmark : faBars} />
          </button>
        </div>
      </nav>

      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-slate-950/40 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
          <aside className="fixed right-0 top-0 z-50 h-screen w-full bg-white shadow-2xl shadow-slate-950/20 dark:bg-[#1b273a] md:hidden">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-700">
              <a href="/" className="text-lg font-black tracking-tight text-[#1f22e8] dark:text-indigo-200">
                Online Course
              </a>
              <div className="flex items-center gap-2">
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:border-[#2d2be8] hover:text-[#2d2be8] dark:border-slate-600 dark:bg-slate-700/70 dark:text-indigo-100 dark:hover:border-indigo-300 dark:hover:text-indigo-100"
                  type="button"
                  onClick={() => setIsDarkMode((darkMode) => !darkMode)}
                  aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                  title={isDarkMode ? 'Light mode' : 'Dark mode'}
                >
                  <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} />
                </button>
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-2xl leading-none text-slate-700 transition hover:border-[#2d2be8] hover:text-[#2d2be8] dark:border-slate-600 dark:bg-slate-700/70 dark:text-slate-100 dark:hover:border-indigo-300 dark:hover:text-indigo-100"
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  aria-label="Close navigation menu"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            </div>

            <div className="grid gap-2 px-5 py-6">
              <a className={mobileLinkClass('/')} href="/">
                Home
              </a>
              <a className={mobileLinkClass('/courses')} href="/courses">
                Courses
              </a>
              {user && (
                <a className={mobileLinkClass('/my-courses')} href="/my-courses">
                  My Courses
                </a>
              )}
              <a className={mobileLinkClass('/popular')} href="/popular">
                Popular
              </a>
              <a className={mobileLinkClass('/about')} href="/about">
                About
              </a>
              <a className={mobileLinkClass('/contact')} href="/contact">
                Contact
              </a>
            </div>

            <div className="absolute bottom-0 left-0 right-0 grid gap-3 border-t border-slate-200 p-5 dark:border-slate-700">
              {mobileAuthButton}
            </div>
          </aside>
        </>
      )}
    </header>
  )
}

export default Navbar
