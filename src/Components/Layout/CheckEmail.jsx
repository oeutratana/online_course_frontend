import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faCircleCheck,
  faEnvelope,
  faGraduationCap,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons'
import { requestPasswordReset } from '../../lib/authApi'

const CheckEmail = () => {
  const [searchParams] = useSearchParams()
  const email = (searchParams.get('email') || '').trim()

  const [isResending, setIsResending] = useState(false)
  const [resendError, setResendError] = useState('')
  const [resendSent, setResendSent] = useState(false)
  // Cooldown in seconds before allowing another resend (matches Laravel's throttle: 60s)
  const RESEND_COOLDOWN = 60
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (!resendSent) return undefined

    // Start cooldown so user can't invalidate the new link immediately
    setResendCooldown(RESEND_COOLDOWN)
    const timer = window.setTimeout(() => setResendSent(false), 5000)

    return () => window.clearTimeout(timer)
  }, [resendSent])

  // Countdown ticker
  useEffect(() => {
    if (resendCooldown <= 0) return undefined

    const tick = window.setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(tick)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(tick)
  }, [resendCooldown])

  const handleResend = async () => {
    if (!email || isResending || resendCooldown > 0) return

    setResendError('')
    setIsResending(true)

    try {
      await requestPasswordReset(email)
      setResendSent(true)
    } catch (requestError) {
      setResendError(
        requestError?.status
          ? requestError.message
          : 'Unable to reach the server. Please check your connection and try again.',
      )
    } finally {
      setIsResending(false)
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

        <div className="mx-auto mt-10 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
          <FontAwesomeIcon className="text-2xl" icon={faEnvelope} />
        </div>

        <h1 className="mt-6 text-2xl font-black tracking-tight">Check your email</h1>
        <p className="mt-3 text-base leading-7 text-slate-500" role="status">
          {email ? (
            <>
              We sent a password reset link to{' '}
              <span className="font-semibold text-slate-700">{email}</span>. Open the email and
              click the reset button to choose a new password.
            </>
          ) : (
            'We sent a password reset link to your email address. Open the email and click the reset button to choose a new password.'
          )}
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          The link expires in 60 minutes. If you do not see the email, check your spam folder or
          request a new link.
        </p>
        {import.meta.env.DEV && (
          <p className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-left text-sm leading-6 text-amber-800">
            Local development with <code>MAIL_MAILER=log</code> writes the reset email to{' '}
            <code>Laravel_Online_Course/storage/logs/laravel.log</code> instead of sending it to your inbox.
            Keep the reset link private.
          </p>
        )}

        {resendSent && (
          <p className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-700" role="status">
            A new reset link has been sent. The previous link is now invalid — use only the latest one.
          </p>
        )}

        {resendError && (
          <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
            {resendError}
          </p>
        )}

        <button
          className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#2459df] px-5 text-base font-semibold text-white transition hover:bg-[#1746bc] disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isResending || !email || resendCooldown > 0}
          onClick={handleResend}
          type="button"
        >
          <FontAwesomeIcon icon={faPaperPlane} />
          {isResending
            ? 'Sending again...'
            : resendCooldown > 0
              ? `Resend available in ${resendCooldown}s`
              : 'Resend reset link'}
        </button>

        <div className="mt-4 grid gap-3">
          <a
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#0d49c8] transition hover:text-[#06328e]"
            href="/forgot-password"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Use a different email
          </a>
          <a
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            href="/login"
          >
            Back to login
          </a>
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <FontAwesomeIcon icon={faCircleCheck} />
          Secure password recovery
        </p>
      </div>
    </main>
  )
}

export default CheckEmail
