import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEnvelope,
  faGraduationCap,
  faLock,
  faUser,
} from '@fortawesome/free-solid-svg-icons'
import { authRequest, getRedirectPath, hasTokenSession, saveAuthSession } from '../../lib/authApi'

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

  return (
    <main className="h-screen overflow-hidden bg-white text-[#111827]">
      <section className="grid h-screen overflow-hidden lg:grid-cols-[50%_50%]">
        <aside className="auth-code-panel relative hidden h-full overflow-hidden bg-[#08264a] text-white lg:block">
          <img
            className="auth-code-image absolute inset-0 h-full w-full object-cover"
            src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1400&q=85"
            alt="Learners studying programming together"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#071d35]/82 via-[#0b3c78]/50 to-[#0b3f96]/90" />
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

        <section className="flex h-full items-center justify-center overflow-hidden bg-white px-6 py-4 sm:px-10">
          <div className="w-full max-w-[520px]">
            <a className="mb-6 inline-flex items-center gap-3 text-xl font-black text-[#2459df] lg:hidden" href="/">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2459df] text-sm text-white">
                <FontAwesomeIcon icon={faGraduationCap} />
              </span>
              Online Course
            </a>

            <div>
              <h2 className="text-4xl font-black tracking-tight">Create Account</h2>
              <p className="mt-2 text-base text-slate-500">Start learning with coding courses built around real projects.</p>
            </div>

            <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-1.5 text-sm font-semibold tracking-wide">
                Full Name
                <div className="relative">
                  <FontAwesomeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-slate-500" icon={faUser} />
                  <input
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-base text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-[#2459df] focus:ring-4 focus:ring-blue-100"
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
                  <FontAwesomeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-slate-500" icon={faEnvelope} />
                  <input
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-base text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-[#2459df] focus:ring-4 focus:ring-blue-100"
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
                  <FontAwesomeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-slate-500" icon={faLock} />
                  <input
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-base text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-[#2459df] focus:ring-4 focus:ring-blue-100"
                    minLength={8}
                    name="password"
                    onChange={handleChange}
                    placeholder="Create a password"
                    required
                    type="password"
                    value={formData.password}
                  />
                </div>
              </label>

              <label className="grid gap-1.5 text-sm font-semibold tracking-wide">
                Confirm Password
                <div className="relative">
                  <FontAwesomeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-slate-500" icon={faLock} />
                  <input
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-base text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-[#2459df] focus:ring-4 focus:ring-blue-100"
                    minLength={8}
                    name="password_confirmation"
                    onChange={handleChange}
                    placeholder="Confirm password"
                    required
                    type="password"
                    value={formData.password_confirmation}
                  />
                </div>
              </label>

              <label className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-5 text-slate-700">
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
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}

              <button
                className="h-12 rounded-lg bg-[#2459df] text-base font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-[#1746bc] disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="mt-7 text-center text-base text-slate-700">
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
