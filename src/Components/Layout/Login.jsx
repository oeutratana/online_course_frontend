import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEnvelope,
  faEye,
  faEyeSlash,
  faGraduationCap,
  faLock,
} from '@fortawesome/free-solid-svg-icons'
import { authRequest, getLoginRedirectPath, getResponseUser, hasTokenSession, saveAuthSession } from '../../lib/authApi'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  })
  const [error, setError] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      const data = await authRequest('/login', formData)
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
                    className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-base text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-[#2459df] focus:ring-4 focus:ring-blue-100"
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
                  <a className="text-sm font-semibold text-[#0d49c8] transition hover:text-[#06328e]" href="#forgot">
                    Forgot Password?
                  </a>
                </span>
                <div className="relative">
                  <FontAwesomeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-slate-500" icon={faLock} />
                  <input
                    className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-12 text-base text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-[#2459df] focus:ring-4 focus:ring-blue-100"
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
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? 'Logging in...' : 'Login'}
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
