import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEnvelope,
  faEye,
  faEyeSlash,
  faGraduationCap,
  faLock,
} from '@fortawesome/free-solid-svg-icons'
import {
  authRequest,
  getGoogleAuthUrl,
  getLoginRedirectPath,
  getResponseUser,
  hasTokenSession,
  saveAuthSession,
} from '../../lib/authApi'

const GoogleIcon = () => (
  <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09A7.01 7.01 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
      fill="#EA4335"
    />
  </svg>
)

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  })
  const [error, setError] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)

  const requestedRedirect = new URLSearchParams(window.location.search).get('redirect')
  const googleAuthUrl = getGoogleAuthUrl(requestedRedirect)

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const data = await authRequest('/login', {
        ...formData,
        email: formData.email.trim(),
      })
      const user = getResponseUser(data)

      saveAuthSession(data)

      if (localStorage.getItem('auth_mode') !== 'cookie' && !hasTokenSession()) {
        throw new Error('Login reached the backend, but Sanctum cookies are blocked by CORS and no token was returned.')
      }

      window.location.href = getLoginRedirectPath(user)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = () => {
    setError('')
    setIsGoogleSubmitting(true)
    window.location.assign(googleAuthUrl)
  }

  return (
    <main className="h-screen overflow-hidden bg-white text-[#111827]">
      <section className="grid h-screen overflow-hidden lg:grid-cols-[50%_50%]">
        <aside className="auth-code-panel relative hidden h-full overflow-hidden bg-[#08264a] text-white lg:block">
          <img
            className="auth-code-image absolute inset-0 h-full w-full object-cover"
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=85"
            alt="Student learning coding on a laptop"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#071d35]/78 via-[#0b3c78]/48 to-[#0b3f96]/88" />
          <div className="auth-panel-glow" />

          <div className="relative z-10 flex h-full flex-col justify-between px-12 py-10">
            <a className="inline-flex items-center gap-3 text-2xl font-black tracking-tight" href="/">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2459df] text-lg shadow-lg shadow-blue-950/30">
                <FontAwesomeIcon icon={faGraduationCap} />
              </span>
              Online Course
            </a>

            <div className="max-w-xl pb-2">
              <h1 className="text-5xl font-black leading-[1.08] tracking-tight text-white drop-shadow-lg">
                Continue your coding journey.
              </h1>
              <p className="mt-5 max-w-lg text-xl leading-8 text-white/90">
                Resume lessons, finish projects, and keep building practical skills with focused courses.
              </p>
            </div>
          </div>
        </aside>

        <section className="flex h-full items-center justify-center overflow-hidden bg-white px-6 py-5 sm:px-10">
          <div className="w-full max-w-[520px]">
            <a className="mb-8 inline-flex items-center gap-3 text-xl font-black text-[#2459df] lg:hidden" href="/">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2459df] text-sm text-white">
                <FontAwesomeIcon icon={faGraduationCap} />
              </span>
              Online Course
            </a>

            <div>
              <h2 className="text-4xl font-black tracking-tight">Welcome Back</h2>
              <p className="mt-2 text-base text-slate-500">Enter your details to access your learning dashboard.</p>
            </div>

            <form className="mt-10 grid gap-5" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm font-semibold tracking-wide">
                Email Address
                <div className="relative">
                  <FontAwesomeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-slate-500" icon={faEnvelope} />
                  <input
                    autoComplete="email"
                    className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-base text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-[#2459df] focus:ring-4 focus:ring-blue-100"
                    disabled={isSubmitting}
                    name="email"
                    onChange={handleChange}
                    placeholder="name@company.com"
                    required
                    type="email"
                    value={formData.email}
                  />
                </div>
              </label>

              <label className="grid gap-2 text-sm font-semibold tracking-wide">
                <span className="flex items-center justify-between gap-4">
                  Password
                  <a className="text-sm font-semibold text-[#0d49c8] transition hover:text-[#06328e]" href="/forgot-password">
                    Forgot Password?
                  </a>
                </span>
                <div className="relative">
                  <FontAwesomeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-slate-500" icon={faLock} />
                  <input
                    autoComplete="current-password"
                    className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-12 text-base text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-[#2459df] focus:ring-4 focus:ring-blue-100"
                    disabled={isSubmitting}
                    name="password"
                    onChange={handleChange}
                    placeholder="Password"
                    required
                    type={isPasswordVisible ? 'text' : 'password'}
                    value={formData.password}
                  />
                  <button
                    aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-[#2459df]"
                    onClick={() => setIsPasswordVisible((current) => !current)}
                    type="button"
                  >
                    <FontAwesomeIcon icon={isPasswordVisible ? faEyeSlash : faEye} />
                  </button>
                </div>
              </label>

              <label className="flex items-center gap-3 text-base text-slate-700">
                <input
                  checked={formData.remember}
                  className="h-4 w-4 rounded border-slate-300 accent-[#2459df]"
                  name="remember"
                  onChange={handleChange}
                  type="checkbox"
                />
                Remember me
              </label>

              {error && (
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}

              <button
                className="h-12 rounded-lg bg-[#2459df] text-base font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-[#1746bc] disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={isSubmitting || isGoogleSubmitting}
                type="submit"
              >
                {isSubmitting ? 'Logging in...' : 'Login'}
              </button>

              <div className="relative flex items-center justify-center">
                <span className="absolute inset-x-0 border-t border-slate-200" />
                <span className="relative bg-white px-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  or
                </span>
              </div>

              <button
                className="flex h-12 items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white text-base font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
                disabled={isSubmitting || isGoogleSubmitting}
                onClick={handleGoogleLogin}
                type="button"
              >
                <GoogleIcon />
                {isGoogleSubmitting ? 'Connecting to Google...' : 'Continue with Google'}
              </button>
            </form>

            <p className="mt-10 text-center text-base text-slate-700">
              Don&apos;t have an account?{' '}
              <a className="font-bold text-[#0d49c8] hover:text-[#06328e]" href="/register">
                Join for Free
              </a>
            </p>
          </div>
        </section>
      </section>
    </main>
  )
}

export default Login
