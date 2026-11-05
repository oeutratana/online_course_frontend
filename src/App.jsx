import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useOutletContext,
} from 'react-router-dom'
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
import ForgotPassword from './Components/Layout/ForgotPassword'
import ResetPassword from './Components/Layout/ResetPassword'
import GoogleCallback from './Components/Layout/GoogleCallback'
import CardDetail from './Components/Layout/CardDetail'
import CartPage from './Components/Layout/CartPage'
import Profile from './Components/Views/Profile'
import AdminDashboard from './admin/AdminDashboard'
import DashboardPage from './admin/pages/DashboardPage'
import CoursesPage from './admin/pages/CoursesPage'
import LessonsPage from './admin/pages/LessonsPage'
import QuizzesPage from './admin/pages/QuizzesPage'
import QuestionsPage from './admin/pages/QuestionsPage'
import EnrollmentsPage from './admin/pages/EnrollmentsPage'
import ProgressPage from './admin/pages/ProgressPage'
import PaymentsPage from './admin/pages/PaymentsPage'
import UsersPage from './admin/pages/UsersPage'
import PayWaySetupPage from './admin/pages/PayWaySetupPage'
import CertificatesPage from './admin/pages/CertificatesPage'
import ReviewsPage from './admin/pages/ReviewsPage'
import CategoryPage from './admin/pages/CategoryPage'
import SettingsPage from './admin/pages/SettingsPage'
import PaymentPage from './Components/Layout/PaymentPage'
import MyCourses from './Components/Views/MyCourses'
import LessonPage from './Components/Views/LessonPage'
import QuizPage from './Components/Views/QuizPage'
import CertificatePage from './Components/Views/CertificatePage'
import {
  getCurrentUser,
  getLoginRedirectPath,
  getStoredAuthUser,
  hasAuthSession,
  isAdminUser,
} from './lib/authApi'

const protectedPathPrefixes = [
  '/admin',
  '/dashboard',
  '/profile',
  '/users',
  '/enrollments',
  '/lesson-progress',
  '/payments',
  '/payment',
  '/cart',
  '/my-courses',
  '/lesson',
  '/quiz',
  '/certificate',
]

const isStandalonePath = (pathname) => (
  pathname === '/login'
  || pathname === '/register'
  || pathname === '/forgot-password'
  || pathname === '/reset-password'
  || pathname === '/auth/google/callback'
  || pathname === '/admin'
  || pathname.startsWith('/admin/')
)

const AdminRoute = ({ component: Page }) => {
  const { searchQuery } = useOutletContext() || {}

  return <Page searchQuery={searchQuery || ''} />
}

const AuthenticatedApp = () => {
  const { pathname } = useLocation()
  const [authStatus, setAuthStatus] = useState('checking')

  const isAuthPage = pathname === '/login' || pathname === '/register'
  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/')
  const isProtectedPage = protectedPathPrefixes.some((path) => (
    pathname === path || pathname.startsWith(`${path}/`)
  ))

  useEffect(() => {
    let isMounted = true

    if (isAuthPage && hasAuthSession()) {
      window.location.replace(getLoginRedirectPath(getStoredAuthUser()))
      return undefined
    }

    if (!isProtectedPage) {
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
  }, [isProtectedPage, isAuthPage, isAdminPage, pathname])

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
      <Routes>
        <Route path="/" element={<><Banner /><Home /></>} />
        <Route path="/courses" element={<Coursre />} />
        <Route path="/mentors" element={<Coursre />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/enterprise" element={<Contact />} />
        <Route path="/popular" element={<Popular />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route path="/course-detail" element={<CardDetail />} />
        <Route path="/courses/detail" element={<CardDetail />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/payment/:id" element={<PaymentPage />} />
        <Route path="/my-courses" element={<MyCourses />} />
        <Route path="/lesson" element={<LessonPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/certificate" element={<CertificatePage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminDashboard />}>
          <Route index element={<Navigate replace to="/admin/dashboard" />} />
          <Route path="dashboard" element={<AdminRoute component={DashboardPage} />} />
          <Route path="courses" element={<AdminRoute component={CoursesPage} />} />
          <Route path="lessons" element={<AdminRoute component={LessonsPage} />} />
          <Route path="quizzes" element={<AdminRoute component={QuizzesPage} />} />
          <Route path="questions" element={<AdminRoute component={QuestionsPage} />} />
          <Route path="enrollments" element={<AdminRoute component={EnrollmentsPage} />} />
          <Route path="progress" element={<AdminRoute component={ProgressPage} />} />
          <Route path="payments" element={<AdminRoute component={PaymentsPage} />} />
          <Route path="users" element={<AdminRoute component={UsersPage} />} />
          <Route path="students" element={<Navigate replace to="/admin/users" />} />
          <Route path="payway" element={<AdminRoute component={PayWaySetupPage} />} />
          <Route path="certificates" element={<AdminRoute component={CertificatesPage} />} />
          <Route path="reviews" element={<AdminRoute component={ReviewsPage} />} />
          <Route path="categories" element={<AdminRoute component={CategoryPage} />} />
          <Route path="settings" element={<AdminRoute component={SettingsPage} />} />
        </Route>
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </div>
  )
}

const Shell = () => {
  const { pathname } = useLocation()
  const isStandalone = isStandalonePath(pathname)

  return (
    <div>
      {!isStandalone && <Navbar />}
      <AuthenticatedApp />
      {!isStandalone && <Footer />}
    </div>
  )
}

const App = () => (
  <BrowserRouter>
    <Shell />
  </BrowserRouter>
)

export default App
