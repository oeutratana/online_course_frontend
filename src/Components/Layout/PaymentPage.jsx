import { useCallback, useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faArrowUpRightFromSquare,
  faCheck,
  faCircleExclamation,
  faQrcode,
  faRotateRight,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons'
import { QRCodeSVG } from 'qrcode.react'
import { checkPayment, createPayment } from '../../lib/paymentApi'
import { ApiError, getCurrentUser } from '../../lib/authApi'

const POLL_INTERVAL_MS = 5000
const SUCCESS_REDIRECT_DELAY_MS = 1800
// PayWay payment lifetime configured in the backend (PAYWAY_LIFETIME_MINUTES = 60).
const MAX_PAYMENT_WAIT_MS = 60 * 60 * 1000

const getPaymentIdFromPath = () => {
  const path = window.location.pathname.replace(/\/+$/, '')
  const parts = path.split('/').filter(Boolean)
  const lastSegment = parts[parts.length - 1]

  return /^\d+$/.test(lastSegment) ? lastSegment : ''
}

const getStoredPayment = (paymentId) => {
  try {
    return JSON.parse(sessionStorage.getItem(`payment_draft_${paymentId}`) || 'null')
  } catch {
    return null
  }
}

const findLatestDraftPaymentId = () => {
  let latestId = ''

  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const key = window.sessionStorage.key(index)

    if (key && key.startsWith('payment_draft_')) {
      latestId = key.slice('payment_draft_'.length)
    }
  }

  return latestId
}

const formatAmount = (payment) => {
  const currency = payment?.currency || 'USD'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(Number(payment?.amount || 0))
}

const getCheckErrorMessage = (error) => {
  if (error instanceof ApiError) {
    if (error.status === 401) return ''
    if (error.status === 403) return 'You do not have access to this payment.'
    if (error.status === 404) return 'Payment was not found. Please start a new purchase.'
    if (error.status === 409) return 'This payment cannot be checked. Please create a new payment.'
    if (error.status === 402) return 'Unable to check payment. Please try again.'
    if (error.status === 502 || error.status === 503) {
      return 'The payment service is busy. Please try again in a moment.'
    }
    if (error.status === 422) return error.message

    return 'Unable to check payment. Please try again.'
  }

  return 'Cannot reach the backend. Check your connection and try again.'
}

const getInitialSessionState = (paymentId) => {
  if (!paymentId) return 'no-payment'

  const status = String(getStoredPayment(paymentId)?.status || '').toLowerCase()

  // A failed/expired transaction_id is single-use: never poll or retry it,
  // show the fresh-checkout action straight away.
  if (status === 'expired') return 'expired'
  if (status === 'failed' || status === 'cancelled' || status === 'error') return 'failed'

  return 'pending'
}

const PaymentPage = () => {
  const paymentId = getPaymentIdFromPath()
  const [payment, setPayment] = useState(() => paymentId ? getStoredPayment(paymentId) : null)
  const [sessionState, setSessionState] = useState(() => getInitialSessionState(paymentId))
  const [checkError, setCheckError] = useState('')
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const checkingRef = useRef(false)
  const isPayWayReturnPage = window.location.pathname.startsWith('/payment/payway/')

  useEffect(() => {
    let isMounted = true

    getCurrentUser().catch(() => {
      if (isMounted) {
        const redirectPath = encodeURIComponent(window.location.pathname)
        window.location.replace(`/login?redirect=${redirectPath}`)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (paymentId) return undefined

    // PayWay redirects back to /payment/payway/return (or /cancel) after the
    // customer finishes on the hosted page or in the ABA app. Restore the most
    // recent in-progress payment so the status can be refreshed.
    if (!isPayWayReturnPage) return undefined

    const latestId = findLatestDraftPaymentId()

    if (latestId) {
      window.location.replace(`/payment/${latestId}`)
    }

    return undefined
  }, [paymentId, isPayWayReturnPage])

  const handleCheckResult = useCallback((result) => {
    const status = result?.status || 'pending'

    if (status === 'paid') {
      sessionStorage.removeItem(`payment_draft_${paymentId || result?.id}`)
      setPayment(result)
      setSessionState('paid')
      return
    }

    if (status === 'expired' || status === 'cancelled' || status === 'failed' || status === 'error') {
      setPayment(result)
      setSessionState(status === 'expired' ? 'expired' : 'failed')
      setCheckError('')
      return
    }

    setPayment((current) => (result && Object.keys(result).length > 0 ? result : current))
    setCheckError('')
  }, [paymentId])

  const runCheck = useCallback(async () => {
    if (!paymentId) return
    if (checkingRef.current) return

    checkingRef.current = true
    setIsChecking(true)

    try {
      const result = await checkPayment(paymentId)
      handleCheckResult(result)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        const redirectPath = encodeURIComponent(window.location.pathname)
        window.location.replace(`/login?redirect=${redirectPath}`)
        return
      }

      setCheckError(getCheckErrorMessage(error))
    } finally {
      checkingRef.current = false
      setIsChecking(false)
    }
  }, [paymentId, handleCheckResult])

  useEffect(() => {
    if (!paymentId || sessionState !== 'pending') return undefined

    let isActive = true

    const tick = async () => {
      if (!isActive) return
      await runCheck()
    }

    const timer = window.setInterval(tick, POLL_INTERVAL_MS)
    tick()

    return () => {
      isActive = false
      window.clearInterval(timer)
    }
  }, [paymentId, sessionState, runCheck])

  useEffect(() => {
    if (!paymentId || sessionState !== 'pending') return undefined

    const timer = window.setTimeout(() => {
      setSessionState('expired')
      setCheckError('')
    }, MAX_PAYMENT_WAIT_MS)

    return () => window.clearTimeout(timer)
  }, [paymentId, sessionState])

  useEffect(() => {
    if (sessionState === 'paid') {
      return undefined
    }

    // Keep the stored draft in sync so a browser refresh restores the QR /
    // deeplink. Preserve any display-only fields from the original draft.
    if (payment?.id) {
      const existing = getStoredPayment(payment.id) || {}

      try {
        sessionStorage.setItem(`payment_draft_${payment.id}`, JSON.stringify({
          ...payment,
          courseTitle: payment.courseTitle || existing.courseTitle || '',
          paidLabel: payment.paidLabel || existing.paidLabel || '',
        }))
      } catch {
        // sessionStorage may be unavailable; state stays in memory.
      }
    }

    return undefined
  }, [payment, sessionState])

  useEffect(() => {
    if (sessionState !== 'paid') return undefined

    const timer = window.setTimeout(() => {
      const destination = payment?.courseId ? `/lesson?course=${payment.courseId}` : '/my-courses'
      window.location.replace(destination)
    }, SUCCESS_REDIRECT_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [sessionState, payment?.courseId])

  const createNewPayment = async () => {
    const courseId = payment?.courseId

    if (!courseId) {
      window.location.href = '/courses'
      return
    }

    setIsCreatingNew(true)
    setCheckError('')

    try {
      const nextPayment = await createPayment(courseId)
      sessionStorage.removeItem(`payment_draft_${paymentId}`)

      if (nextPayment.status === 'paid') {
        setPayment(nextPayment)
        setSessionState('paid')
        return
      }

      const existing = getStoredPayment(nextPayment.id) || {}

      sessionStorage.setItem(`payment_draft_${nextPayment.id}`, JSON.stringify({
        ...nextPayment,
        courseTitle: nextPayment.courseTitle || existing.courseTitle || payment?.courseTitle || '',
        paidLabel: nextPayment.paidLabel || existing.paidLabel || payment?.paidLabel || '',
      }))
      window.location.replace(`/payment/${nextPayment.id}`)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        const redirectPath = encodeURIComponent(window.location.pathname)
        window.location.replace(`/login?redirect=${redirectPath}`)
        return
      }

      setCheckError(getCheckErrorMessage(error))
    } finally {
      setIsCreatingNew(false)
    }
  }

  const returnToCourse = () => {
    const courseId = payment?.courseId
    window.location.href = courseId ? `/course-detail?course=${courseId}` : '/courses'
  }

  const isPending = sessionState === 'pending'
  const paymentStatus = payment?.status || 'pending'
  const qrValue = payment?.qrString || payment?.qrPayload || ''
  const hasDeeplink = Boolean(payment?.deeplink)
  const hasCheckoutForm = Boolean(payment?.checkoutUrl && payment?.checkoutForm)

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f7f8ff] px-4 py-12 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-2xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#302be2]">
              <FontAwesomeIcon icon={faQrcode} />
              Secure Payment
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Complete Payment</h1>
          </div>
          <a
            className="hidden items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-[#302be2] sm:inline-flex"
            href="/courses"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to courses
          </a>
        </div>

        {!paymentId && sessionState === 'no-payment' && (
          <div className="mt-8 rounded-xl border border-slate-300 bg-white p-10 text-center shadow-sm">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-xl text-amber-600">
              <FontAwesomeIcon icon={faCircleExclamation} />
            </span>
            <h2 className="mt-4 text-xl font-black">No active payment</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              We could not find an in-progress payment for this page. Please choose a course and
              start a new purchase.
            </p>
            <a
              className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-[#302be2] px-7 text-sm font-black text-white transition hover:bg-[#1916b8]"
              href="/courses"
            >
              Browse Courses
            </a>
          </div>
        )}

        {paymentId && !payment && (
          <div className="mt-8 rounded-xl border border-slate-300 bg-white p-10 text-center shadow-sm">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-xl text-[#302be2]">
              <FontAwesomeIcon icon={faSpinner} spin />
            </span>
            <h2 className="mt-4 text-xl font-black">Checking your payment...</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Loading the PayWay payment details for this purchase.
            </p>

            {checkError && (
              <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                {checkError}
              </p>
            )}

            <button
              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#302be2] px-6 text-sm font-black text-white transition hover:bg-[#1916b8]"
              onClick={runCheck}
              type="button"
            >
              <FontAwesomeIcon icon={faRotateRight} />
              Check Payment
            </button>
          </div>
        )}

        {payment && (
          <div className="mt-8 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <p className="text-sm text-slate-600">Course</p>
              <h2 className="mt-1 text-xl font-black">{payment.courseTitle || 'Course purchase'}</h2>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-600">Amount</p>
                  <p className="mt-1 text-3xl font-black text-[#1f22e8]">{formatAmount(payment)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-[#302be2]">
                    {payment.currency || 'USD'}
                  </span>
                  <span className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-slate-600">
                    Payment Method: PayWay
                  </span>
                </div>
              </div>
            </div>

            <div className="grid justify-items-center bg-slate-50 p-6 sm:p-8">
              {payment.qrImage ? (
                <img
                  className="h-56 w-56 rounded-xl border-4 border-white bg-white object-contain p-2 shadow-sm sm:h-64 sm:w-64"
                  src={payment.qrImage}
                  alt="PayWay payment QR code"
                />
              ) : qrValue ? (
                <div className="rounded-xl border-4 border-white bg-white p-3 shadow-sm">
                  <QRCodeSVG className="h-52 w-52" value={qrValue} size={208} />
                </div>
              ) : hasDeeplink ? (
                <div className="grid h-56 w-56 place-items-center rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm font-semibold text-slate-500">
                  Payment created. Open the ABA Pay app to complete it.
                </div>
              ) : (
                <div className="grid h-56 w-56 place-items-center rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-500">
                  The backend did not return a QR code or payment link for this payment.
                </div>
              )}

              {hasDeeplink && !payment.qrImage && !qrValue && (
                <a
                  className="mt-4 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#302be2] px-6 text-sm font-black text-white transition hover:bg-[#1916b8]"
                  href={payment.deeplink}
                  rel="noreferrer"
                  target="_blank"
                >
                  <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                  Open ABA Pay App
                </a>
              )}

              {hasDeeplink && (
                <p className="mt-5 max-w-sm text-center text-sm leading-6 text-slate-600">
                  Scan the QR code with the <strong>ABA Pay app</strong> or tap{' '}
                  <button
                    className="inline text-[#302be2] underline underline-offset-2"
                    onClick={() => {
                      const deeplinkWindow = window.open(payment.deeplink, '_blank', 'noopener')
                      if (!deeplinkWindow) window.location.href = payment.deeplink
                    }}
                    type="button"
                  >
                    Open ABA Pay
                  </button>{' '}
                  to pay with your ABA mobile banking app.
                </p>
              )}

              {payment.transactionId && (
                <p className="mt-3 max-w-full truncate rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-slate-500">
                  Ref: {payment.transactionId}
                </p>
              )}

              {hasCheckoutForm && (
                <div className="mt-5 w-full max-w-sm rounded-xl bg-white p-5 text-center shadow-sm">
                  <p className="text-sm leading-6 text-slate-600">
                    Continue to the secure <strong>PayWay</strong> checkout page to complete your
                    payment.
                  </p>
                  <form action={payment.checkoutUrl} method="POST" target="_blank">
                    {Object.entries(payment.checkoutForm).map(([field, value]) => (
                      <input
                        key={field}
                        name={field}
                        type="hidden"
                        value={typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '')}
                      />
                    ))}
                    <button
                      className="mt-4 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#302be2] px-6 text-sm font-black text-white transition hover:bg-[#1916b8]"
                      type="submit"
                    >
                      <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                      Continue to PayWay
                    </button>
                  </form>
                </div>
              )}
            </div>

            <div className="space-y-3 p-6">
              <div className="rounded-lg bg-indigo-50 px-4 py-3">
                <p className="text-sm font-black text-[#302be2]">
                  {isPending
                    ? 'Waiting for payment...'
                    : sessionState === 'paid'
                      ? 'Payment successful!'
                      : sessionState === 'expired'
                        ? 'Payment session expired.'
                        : sessionState === 'failed'
                          ? 'Payment failed.'
                          : 'Payment status unknown.'}
                </p>
              </div>

              {isPending && (
                <>
                  <p className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="flex h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                    Status: {paymentStatus === 'pending' ? 'Waiting for payment...' : paymentStatus}
                  </p>
                  <p className="text-sm leading-6 text-slate-600">
                    Complete the payment in the ABA Pay app or on the PayWay checkout page. The
                    payment status updates automatically and is confirmed by the course backend.
                  </p>
                </>
              )}

              {checkError && (
                <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                  {checkError}
                </p>
              )}

              {isPending && (
                <>
                  <button
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-[#302be2] text-sm font-black text-white transition hover:bg-[#1916b8] disabled:cursor-not-allowed disabled:bg-slate-400"
                    disabled={isChecking || isCreatingNew}
                    onClick={runCheck}
                    type="button"
                  >
                    {isChecking ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faRotateRight} />}
                    {isChecking ? 'Checking payment...' : 'Check Payment'}
                  </button>
                  <button
                    className="h-12 w-full rounded-lg border border-slate-200 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                    onClick={returnToCourse}
                    type="button"
                  >
                    Cancel &amp; Return to Course
                  </button>
                </>
              )}

              {sessionState === 'paid' && (
                <div className="grid gap-3">
                  <div className="flex items-center gap-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                    <FontAwesomeIcon icon={faCheck} />
                    Your payment was confirmed and the course is being unlocked...
                  </div>
                  <a
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#302be2] text-sm font-black text-white transition hover:bg-[#1916b8]"
                    href={payment?.courseId ? `/lesson?course=${payment.courseId}` : '/my-courses'}
                  >
                    Watch Video Now
                  </a>
                </div>
              )}

              {sessionState === 'expired' && (
                <div className="grid gap-3">
                  <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                    Payment session expired. Please create a new payment.
                  </div>
                  <button
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-[#302be2] text-sm font-black text-white transition hover:bg-[#1916b8] disabled:cursor-not-allowed disabled:bg-slate-400"
                    disabled={isCreatingNew}
                    onClick={createNewPayment}
                    type="button"
                  >
                    {isCreatingNew ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin />
                        Creating payment...
                      </>
                    ) : (
                      'Create New Payment'
                    )}
                  </button>
                  <button
                    className="h-12 w-full rounded-lg border border-slate-200 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                    onClick={returnToCourse}
                    type="button"
                  >
                    Back to Course
                  </button>
                </div>
              )}

              {sessionState === 'failed' && (
                <div className="grid gap-3">
                  <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    Payment failed. Please try again.
                  </div>
                  <button
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-[#302be2] text-sm font-black text-white transition hover:bg-[#1916b8] disabled:cursor-not-allowed disabled:bg-slate-400"
                    disabled={isCreatingNew}
                    onClick={createNewPayment}
                    type="button"
                  >
                    {isCreatingNew ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin />
                        Creating payment...
                      </>
                    ) : (
                      'Try Again'
                    )}
                  </button>
                  <button
                    className="h-12 w-full rounded-lg border border-slate-200 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                    onClick={returnToCourse}
                    type="button"
                  >
                    Back to Course
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default PaymentPage