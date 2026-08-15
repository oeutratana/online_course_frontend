import { useEffect, useState } from 'react'
import Home from './Components/Views/Home'
import Navbar from './Components/Views/Navbar'
import Banner from './Components/Views/Banner'
import Footer from './Components/Views/Footer'
import Coursre from './Components/Views/Coursre'
import About from './Components/Views/About'
import Contact from './Components/Views/Contact'
import Popular from './Components/Views/Popular'
import Login from './Components/Layout/Login'
import Register from './Components/Layout/Register'
import CardDetail from './Components/Layout/CardDetail'
import CartPage from './Components/Layout/CartPage'
import Profile from './Components/Views/Profile'
import AdminDashboard from './admin/AdminDashboard'
import { getCurrentUser, isAdminUser } from './lib/authApi'

const protectedPathPrefixes = [
  '/admin',
  '/dashboard',
  '/profile',
  '/users',
  '/enrollments',
  '/lesson-progress',
  '/payments',
  '/cart',
]

const App = () => {
  const [authStatus, setAuthStatus] = useState('checking')
  const pathname = window.location.pathname
  const isCoursePage = pathname === '/courses' || pathname === '/mentors'
  const isAboutPage = pathname === '/about'
  const isContactPage = pathname === '/enterprise' || pathname === '/contact'
  const isPopularPage = pathname === '/popular'
  const isLoginPage = pathname === '/login'
  const isRegisterPage = pathname === '/register'
  const isProfilePage = pathname === '/profile'
  const isCartPage = pathname === '/cart'
  const isCardDetailPage = pathname === '/course-detail' || pathname === '/courses/detail'
  const isAdminPage = pathname === '/admin' || pathname === '/admin/dashboard'
  const isAuthPage = isLoginPage || isRegisterPage
  const isStandalonePage = isAuthPage || isAdminPage
  const isProtectedPage = protectedPathPrefixes.some((path) => (
    pathname === path || pathname.startsWith(`${path}/`)
  ))

  useEffect(() => {
    let isMounted = true

    if (!isProtectedPage) {
      setAuthStatus('ready')
      return undefined
    }

    getCurrentUser()
      .then((user) => {
        if (isMounted) {
          if (isAdminPage && !isAdminUser(user)) {
            window.location.replace('/')
            return
          }

          setAuthStatus('authenticated')
        }
      })
      .catch(() => {
        if (isMounted) {
          const redirectPath = encodeURIComponent(`${pathname}${window.location.search}`)
          window.location.replace(`/login?redirect=${redirectPath}`)
        }
      })

    return () => {
      isMounted = false
    }
  }, [isProtectedPage, pathname])

  if (isProtectedPage && authStatus === 'checking') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6 text-center text-slate-700">
        <div>
          <p className="text-lg font-bold text-[#111827]">Checking your session...</p>
          <p className="mt-2 text-sm">Please wait while we verify your access.</p>
        </div>
      </main>
    )
  }

  return (
    <div>
      {!isStandalonePage && <Navbar />}
      {isAdminPage ? (
        <AdminDashboard />
      ) : isContactPage ? (
        <Contact />
      ) : isCardDetailPage ? (
        <CardDetail />
      ) : isCartPage ? (
        <CartPage />
      ) : isProfilePage ? (
        <Profile />
      ) : isRegisterPage ? (
        <Register />
      ) : isLoginPage ? (
        <Login />
      ) : isPopularPage ? (
        <Popular />
      ) : isAboutPage ? (
        <About />
      ) : isCoursePage ? (
        <Coursre />
      ) : (
        <>
          <Banner />
          <Home />
        </>
      )}
      {!isStandalonePage && <Footer />}
    </div>
  )
}

export default App
