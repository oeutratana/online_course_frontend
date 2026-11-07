import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faCircleCheck,
  faEye,
  faEyeSlash,
  faGraduationCap,
  faLock,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import { clearAuthSession, resetPassword } from '../../lib/authApi'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const decodeQueryValue = (value) => {
  let decoded = (value || '').trim()

  for (let attempt = 0; attempt < 2 && /%[0-9a-f]{2}/i.test(decoded); attempt += 1) {
    try {
      decoded = decodeURIComponent(decoded)
    } catch {
      break
    }
  }

  return decoded.trim()
}

const readResetParams = () => {
  // Reset links copied from the HTML part of the logged email can contain
  // `&amp;` and one or more layers of percent-encoding. Normalise both before
  // validating so the email never reaches the API as `user%40example.com`.
  const search = window.location.search.replace(/&amp;/gi, '&')
  const params = new URLSearchParams(search)

  return {
    token: decodeQueryValue(params.get('token')),
    email: decodeQueryValue(params.get('email')),
  }
}

const ResetPassword = () => {
  const navigate = useNavigate()
  const { token, email } = readResetParams()
  const isLinkValid = Boolean(token && EMAIL_PATTERN.test(email))

  const [formData, setFormData] = useState({
    password: '',
    password_confirmation: '',
  })
  const [visibleFields, setVisibleFields] = useState({
    password: false,
    password_confirmation: false,
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReset, setIsReset] = useState(false)

  useEffect(() => {
    if (!isReset) return undefined

    const timer = window.setTimeout(() => {
      navigate('/login', { replace: true })
    }, 3000)

    return () => window.clearTimeout(timer)
  }, [isReset, navigate])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setError('')
  }

  const toggleVisibility = (name) => {
    setVisibleFields((current) => ({ ...current, [name]: !current[name] }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!isLinkValid) {
      setError('This reset link is invalid or has expired. Request a new one to continue.')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (!formData.password_confirmation) {
      setError('Please confirm your new password.')
      return
    }

    if (formData.password !== formData.password_confirmation) {
      setError('Password confirmation does not match.')
      return
    }

    setIsSubmitting(true)

    try {
      await resetPassword({
        token,
        email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      })

      clearAuthSession()
      setFormData({ password: '', password_confirmation: '' })
      setIsReset(true)
    } catch (requestError) {
      setError(
        requestError?.status
          ? requestError.message
          : 'Unable to reach the server. Please check your connection and try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (name, label, autoComplete) => (
    <label className="grid gap-2 text-sm font-semibold tracking-wide">
      {label}
      <div className="relative">
        <FontAwesomeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-slate-500" icon={faLock} />
        <input
          autoComplete={autoComplete}
          className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-12 text-base text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-[#2459df] focus:ring-4 focus:ring-blue-100"
          minLength={8}
          name={name}
          onChange={handleChange}
          placeholder={label}
          required
          type={visibleFields[name] ? 'text' : 'password'}
          value={formData[name]}
        />
        <button
          aria-label={visibleFields[name] ? 'Hide password' : 'Show password'}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-[#2459df]"
          onClick={() => toggleVisibility(name)}
          type="button"
        >
          <FontAwesomeIcon icon={visibleFields[name] ? faEyeSlash : faEye} />
        </button>
      </div>
    </label>
  )

  return (
    <main className="flex min-h-screen items-start justify-center bg-[#f5f7fb] px-6 py-8 text-[#111827] sm:items-center sm:py-12">
      <div className="my-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/70 sm:p-10">
        <a className="inline-flex items-center gap-3 text-xl font-black text-[#2459df]" href="/">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2459df] text-lg text-white">
            <FontAwesomeIcon icon={faGraduationCap} />
          </span>
          Online Course
        </a>

        {!isLinkValid ? (
          <>
            <div className="mx-auto mt-10 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
              <FontAwesomeIcon className="text-2xl" icon={faTriangleExclamation} />
            </div>
            <h1 className="mt-6 text-2xl font-black tracking-tight">Invalid reset link</h1>
            <p className="mt-3 text-base leading-7 text-slate-500">
              This password reset link is missing, malformed, or has expired. Request a new one to continue.
            </p>
            <a
              className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#2459df] px-5 text-base font-semibold text-white transition hover:bg-[#1746bc]"
              href="/forgot-password"
            >
              Request a new link
            </a>
          </>
        ) : isReset ? (
          <>
            <div className="mx-auto mt-10 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
              <FontAwesomeIcon className="text-2xl" icon={faCircleCheck} />
            </div>
            <h1 className="mt-6 text-2xl font-black tracking-tight">Password updated</h1>
            <p className="mt-3 text-base leading-7 text-slate-500">
              Your password has been reset. You can now log in with your new password.
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-400" role="status">
              Redirecting you to the login page...
            </p>
            <a
              className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#2459df] px-5 text-base font-semibold text-white transition hover:bg-[#1746bc]"
              href="/login"
            >
              Continue to login
            </a>
          </>
        ) : (
          <>
            <div className="mx-auto mt-10 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#2459df]">
              <FontAwesomeIcon className="text-2xl" icon={faLock} />
            </div>
            <h1 className="mt-6 text-2xl font-black tracking-tight">Set a new password</h1>
            <p className="mt-3 text-base leading-7 text-slate-500">
              Choose a new password for <span className="font-semibold text-slate-700">{email}</span>.
            </p>

            <form className="mt-8 grid gap-5 text-left" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm font-semibold tracking-wide">
                Email Address
                <input
                  autoComplete="email"
                  className="h-12 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 text-base text-slate-600 outline-none"
                  name="email"
                  readOnly
                  type="email"
                  value={email}
                />
              </label>
              {renderField('password', 'New Password', 'new-password')}
              {renderField('password_confirmation', 'Confirm Password', 'new-password')}

              {error && (
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
                  {error}
                </p>
              )}

              <button
                className="h-12 rounded-lg bg-[#2459df] text-base font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-[#1746bc] disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? 'Updating password...' : 'Update password'}
              </button>
            </form>

            <a
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#0d49c8] transition hover:text-[#06328e]"
              href="/login"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              Back to login
            </a>
          </>
        )}
      </div>
    </main>
  )
}

export default ResetPassword
