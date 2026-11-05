import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faCircleCheck,
  faEnvelope,
  faGraduationCap,
} from '@fortawesome/free-solid-svg-icons'
import { requestPasswordReset } from '../../lib/authApi'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await requestPasswordReset(email.trim())
      setIsSent(true)
    } catch (requestError) {
      setError(requestError.message || 'We could not send the reset link. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-6 py-12 text-[#111827]">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/70 sm:p-10">
        <a className="inline-flex items-center gap-3 text-xl font-black text-[#2459df]" href="/">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2459df] text-lg text-white">
            <FontAwesomeIcon icon={faGraduationCap} />
          </span>
          Online Course
        </a>

        {isSent ? (
          <>
            <div className="mx-auto mt-10 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
              <FontAwesomeIcon className="text-2xl" icon={faCircleCheck} />
            </div>
            <h1 className="mt-6 text-2xl font-black tracking-tight">Check your email</h1>
            <p className="mt-3 text-base leading-7 text-slate-500" role="status">
              If an account exists for <span className="font-semibold text-slate-700">{email}</span>, we
              have sent a password reset link. It expires in 60 minutes. Use the most recent email —
              requesting a new link cancels any earlier ones.
            </p>
            <a
              className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#2459df] px-5 text-base font-semibold text-white transition hover:bg-[#1746bc]"
              href="/login"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              Back to login
            </a>
          </>
        ) : (
          <>
            <div className="mx-auto mt-10 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#2459df]">
              <FontAwesomeIcon className="text-2xl" icon={faEnvelope} />
            </div>
            <h1 className="mt-6 text-2xl font-black tracking-tight">Forgot your password?</h1>
            <p className="mt-3 text-base leading-7 text-slate-500">
              Enter the email address linked to your account and we will send you a reset link.
            </p>

            <form className="mt-8 grid gap-5 text-left" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm font-semibold tracking-wide">
                Email Address
                <div className="relative">
                  <FontAwesomeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-slate-500" icon={faEnvelope} />
                  <input
                    autoComplete="email"
                    className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-base text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-[#2459df] focus:ring-4 focus:ring-blue-100"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@company.com"
                    required
                    type="email"
                    value={email}
                  />
                </div>
              </label>

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
                {isSubmitting ? 'Sending link...' : 'Send reset link'}
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

export default ForgotPassword
