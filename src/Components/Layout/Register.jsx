import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEnvelope,
  faEye,
  faEyeSlash,
  faGraduationCap,
  faLock,
  faUser,
} from '@fortawesome/free-solid-svg-icons'
import {
  authRequest,
  getGoogleAuthUrl,
  getRedirectPath,
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

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    acceptedTerms: false,
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)
  const [visibleField, setVisibleField] = useState('')

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

    if (!formData.acceptedTerms) {
      setError('Please agree to the terms and privacy policy.')
      return
    }

    if (formData.password !== formData.password_confirmation) {
      setError('Password confirmation does not match.')
      return
    }

    setIsSubmitting(true)

    try {
      const data = await authRequest('/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      })

      saveAuthSession(data)

      if (localStorage.getItem('auth_mode') !== 'cookie' && !hasTokenSession()) {
        throw new Error('Registration reached the backend, but Sanctum cookies are blocked by CORS and no token was returned.')
      }

      window.location.href = getRedirectPath()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignUp = () => {
    setError('')
    setIsGoogleSubmitting(true)
    window.location.assign(googleAuthUrl)
  }

  const isBusy = isSubmitting || isGoogleSubmitting

  return (
    <main className="min-h-screen bg-white text-[#111827]">
      <section className="grid min-h-screen lg:grid-cols-[50%_50%]">
        <aside className="auth-code-panel relative hidden overflow-hidden bg-[#08264a] text-white lg:block lg:min-h-screen">
          <img
            className="auth-code-image absolute inset-0 h-full w-full object-cover"
            src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1400&q=85"
            alt="Learners studying programming together"
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
                Build coding skills with expert mentors.
              </h1>
              <p className="mt-5 max-w-lg text-xl leading-8 text-white/90">
                Learn through guided lessons, real projects, and a path designed for steady progress.
              </p>
            </div>
          </div>
        </aside>

        <section className="flex items-center justify-center bg-white px-6 py-8 sm:px-10">
          <div className="w-full max-w-[440px]">
            <a className="mb-6 inline-flex items-center gap-3 text-xl font-black text-[#2459df] lg:hidden" href="/">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2459df] text-sm text-white">
                <FontAwesomeIcon icon={faGraduationCap} />
              </span>
              Online Course
            </a>

            <div>
              <h2 className="text-2xl font-black tracking-tight">Create Account</h2>
              <p className="mt-1.5 text-sm text-slate-500">Start learning with coding courses built around real projects.</p>
            </div>

            <form className="mt-6 grid gap-3.5" onSubmit={handleSubmit}>
              <label className="grid gap-1.5 text-sm font-semibold tracking-wide">
                Full Name
                <div className="relative">
                  <FontAwesomeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500" icon={faUser} />
                  <input
                    autoComplete="name"
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-[#2459df] focus:ring-4 focus:ring-blue-100"
                    name="name"
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    type="text"
                    value={formData.name}
                  />
                </div>
              </label>

              <label className="grid gap-1.5 text-sm font-semibold tracking-wide">
                Email Address
                <div className="relative">
                  <FontAwesomeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500" icon={faEnvelope} />
                  <input
                    autoComplete="email"
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-[#2459df] focus:ring-4 focus:ring-blue-100"
                    name="email"
                    onChange={handleChange}
                    placeholder="name@company.com"
                    required
                    type="email"
                    value={formData.email}
                  />
                </div>
              </label>

              <label className="grid gap-1.5 text-sm font-semibold tracking-wide">
                Password
                <div className="relative">
                  <FontAwesomeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500" icon={faLock} />
                  <input
                    autoComplete="new-password"
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-[#2459df] focus:ring-4 focus:ring-blue-100"
                    minLength={8}
                    name="password"
                    onChange={handleChange}
                    placeholder="Create a password"
                    required
                    type={visibleField === 'password' ? 'text' : 'password'}
                    value={formData.password}
                  />
                  <button
                    aria-label={visibleField === 'password' ? 'Hide password' : 'Show password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-[#2459df]"
                    onClick={() => setVisibleField((current) => (current === 'password' ? '' : 'password'))}
                    type="button"
                  >
                    <FontAwesomeIcon icon={visibleField === 'password' ? faEyeSlash : faEye} />
                  </button>
                </div>
              </label>

              <label className="grid gap-1.5 text-sm font-semibold tracking-wide">
                Confirm Password
                <div className="relative">
                  <FontAwesomeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500" icon={faLock} />
                  <input
                    autoComplete="new-password"
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-[#2459df] focus:ring-4 focus:ring-blue-100"
                    minLength={8}
                    name="password_confirmation"
                    onChange={handleChange}
                    placeholder="Confirm password"
                    required
                    type={visibleField === 'password_confirmation' ? 'text' : 'password'}
                    value={formData.password_confirmation}
                  />
                  <button
                    aria-label={visibleField === 'password_confirmation' ? 'Hide password' : 'Show password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-[#2459df]"
                    onClick={() => setVisibleField((current) => (current === 'password_confirmation' ? '' : 'password_confirmation'))}
                    type="button"
                  >
                    <FontAwesomeIcon icon={visibleField === 'password_confirmation' ? faEyeSlash : faEye} />
                  </button>
                </div>
              </label>

              <label className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-slate-700">
                <input
                  checked={formData.acceptedTerms}
                  className="h-4 w-4 rounded border-slate-300 accent-[#2459df]"
                  name="acceptedTerms"
                  onChange={handleChange}
                  type="checkbox"
                />
                <span>I agree to the</span>
                <a className="font-semibold text-[#0d49c8] hover:text-[#06328e]" href="#terms">Terms</a>
                <span>and</span>
                <a className="font-semibold text-[#0d49c8] hover:text-[#06328e]" href="#privacy">Privacy Policy</a>
              </label>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700" role="alert">
                  {error}
                </p>
              )}

              <button
                className="h-11 rounded-lg bg-[#2459df] text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-[#1746bc] disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={isBusy}
                type="submit"
              >
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </button>

              <div className="relative flex items-center justify-center">
                <span className="absolute inset-x-0 border-t border-slate-200" />
                <span className="relative bg-white px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  or
                </span>
              </div>

              <button
                className="flex h-11 items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
                disabled={isBusy}
                onClick={handleGoogleSignUp}
                type="button"
              >
                <GoogleIcon />
                {isGoogleSubmitting ? 'Connecting to Google...' : 'Continue with Google'}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-slate-700">
              Already have an account?{' '}
              <a className="font-bold text-[#0d49c8] hover:text-[#06328e]" href="/login">
                Log In
              </a>
            </p>
          </div>
        </section>
      </section>
    </main>
  )
}

export default Register
