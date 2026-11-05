import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faCircleNotch,
  faGraduationCap,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import {
  exchangeGoogleCode,
  getLoginRedirectPath,
  getResponseUser,
  hasTokenSession,
  saveAuthSession,
} from '../../lib/authApi'

const errorMessages = {
  google_state: 'Your Google sign-in session expired. Please try again.',
  google_denied: 'Google sign-in was cancelled.',
  google_email_unverified: 'Google could not confirm your email address. Please use a verified Google account.',
  google_account_conflict: 'This email is already linked to a different Google account. Contact support for help.',
  google_not_configured: 'Google sign-in is not configured yet. Please use email and password for now.',
  google_auth_failed: 'Google sign-in could not be completed. Please try again.',
}

const GoogleCallback = () => {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code') || ''
  const oauthError = params.get('error') || ''
  const initialError = oauthError
    ? (errorMessages[oauthError] || 'Google sign-in could not be completed. Please try again.')
    : (code ? '' : 'Google sign-in did not return an authorization code.')
  const [error, setError] = useState(initialError)
  const [isLoading, setIsLoading] = useState(Boolean(code) && !oauthError)
  const exchangePromiseRef = useRef(null)
  const completedRef = useRef(false)

  useEffect(() => {
    if (!code || oauthError) {
      return undefined
    }

    let isActive = true

    const completeSignIn = async () => {
      try {
        if (!exchangePromiseRef.current) {
          exchangePromiseRef.current = exchangeGoogleCode(code)
        }

        const data = await exchangePromiseRef.current

        if (completedRef.current) return
        completedRef.current = true

        const user = getResponseUser(data)

        saveAuthSession(data)

        if (localStorage.getItem('auth_mode') !== 'cookie' && !hasTokenSession()) {
          throw new Error('Google sign-in completed, but no login token was returned.')
        }

        const requestedRedirect = data?.redirect
        const destination = requestedRedirect?.startsWith('/') && !requestedRedirect.startsWith('//')
          ? requestedRedirect
          : getLoginRedirectPath(user)

        window.location.replace(destination)
      } catch (requestError) {
        if (isActive) {
          setError(requestError.message || 'Google sign-in could not be completed. Please try again.')
          setIsLoading(false)
        }
      }
    }

    completeSignIn()

    return () => {
      isActive = false
    }
  }, [code, oauthError])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-6 py-12 text-[#111827]">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/70 sm:p-10">
        <a className="inline-flex items-center gap-3 text-xl font-black text-[#2459df]" href="/">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2459df] text-lg text-white">
            <FontAwesomeIcon icon={faGraduationCap} />
          </span>
          Online Course
        </a>

        {isLoading ? (
          <>
            <div className="mx-auto mt-10 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#2459df]">
              <FontAwesomeIcon className="animate-spin text-2xl" icon={faCircleNotch} />
            </div>
            <h1 className="mt-6 text-2xl font-black tracking-tight">Completing sign-in</h1>
            <p className="mt-3 text-base leading-7 text-slate-500">
              Verifying your Google account and preparing your dashboard. This only takes a moment.
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto mt-10 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
              <FontAwesomeIcon className="text-2xl" icon={faTriangleExclamation} />
            </div>
            <h1 className="mt-6 text-2xl font-black tracking-tight">Sign-in unsuccessful</h1>
            <p className="mt-3 text-base leading-7 text-slate-500" role="alert">
              {error}
            </p>
            <a
              className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#2459df] px-5 text-base font-semibold text-white transition hover:bg-[#1746bc]"
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

export default GoogleCallback
