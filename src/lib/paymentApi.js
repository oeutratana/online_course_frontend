import { ApiError, apiRequest } from './authApi'

const unwrapPaymentData = (data) => {
  if (!data || typeof data !== 'object') return null

  if (data.payment && typeof data.payment === 'object') return data.payment
  if (data.data && typeof data.data === 'object') return data.data

  return data
}

const looksLikeImage = (value) => (
  /^(https?:|data:image|data:text\/svg|blob:)/i.test(String(value || ''))
)

const toImageSrc = (value) => {
  if (!value) return ''
  if (looksLikeImage(value)) return value

  const isPlainBase64 = /^[A-Za-z0-9+/=\r\n]+$/.test(String(value))

  return isPlainBase64 ? `data:image/png;base64,${value}` : value
}

/**
 * PayWay may only return an `abapay_deeplink` (e.g.
 * abamobilebank://ababank.com?type=payway&qrcode=0102...). The qrcode
 * parameter is the full KHQR string, used to render a scannable QR code.
 */
const getDeeplinkQrPayload = (deeplink) => {
  if (!deeplink) return ''

  try {
    return decodeURIComponent(new URL(deeplink).searchParams.get('qrcode') || '')
  } catch {
    const match = String(deeplink).match(/[?&]qrcode=([^&]+)/)
    return match ? decodeURIComponent(match[1]) : ''
  }
}

/**
 * Normalizes the Laravel /api/payments responses.
 *
 * The backend (PaymentController::formatPaymentResponse) returns the
 * provider fields it received from PayWay:
 *   payment_id, course_id, amount, currency, status, transaction_id,
 *   checkout_url, checkout_form, qr_url, qr_string, abapay_deeplink, paid_at
 *
 * Depending on the PayWay sandbox mode either the hosted-checkout fields
 * (checkout_url + checkout_form) or the mobile-app fields
 * (qr_url / qr_string / abapay_deeplink) are populated; the other side is null.
 */
export const normalizePayment = (data) => {
  const payment = unwrapPaymentData(data) || {}
  const course = payment.course || {}

  const qrImage = toImageSrc(payment.qr_url ?? payment.checkout_qr_url ?? '')
  const qrString = payment.qr_string ?? ''
  const deeplink = payment.abapay_deeplink ?? ''

  return {
    id: payment.payment_id ?? payment.id ?? null,
    courseId: payment.course_id ?? course.id ?? null,
    courseTitle: course.title ?? payment.course_title ?? '',
    amount: Number(payment.amount ?? 0),
    currency: payment.currency ?? 'USD',
    status: String(payment.status ?? 'pending').toLowerCase(),
    requiresNewCheckout: Boolean(payment.requires_new_checkout),
    method: payment.method ?? 'payway',
    transactionId: payment.transaction_id ?? payment.transactionId ?? '',
    checkoutUrl: payment.checkout_url ?? '',
    checkoutForm: payment.checkout_form ?? null,
    qrImage,
    qrString,
    deeplink,
    qrPayload: qrString || getDeeplinkQrPayload(deeplink),
    paidAt: payment.paid_at ?? null,
    message: data?.message ?? '',
    raw: payment,
  }
}

export const createPayment = async (courseId) => {
  if (!courseId) {
    throw new Error('A course must be selected before creating a payment.')
  }

  const data = await apiRequest('/payments', {
    method: 'POST',
    body: JSON.stringify({ course_id: courseId, method: 'payway' }),
  })

  return normalizePayment(data)
}

export const checkPayment = async (paymentId) => {
  if (!paymentId) {
    throw new Error('Missing payment id.')
  }

  try {
    const data = await apiRequest(`/payments/${paymentId}/check`, {
      method: 'POST',
    })

    return normalizePayment(data)
  } catch (error) {
    // A failed or expired transaction_id is single-use, so the backend refuses
    // to check it again (409). Surface the row instead of treating it as a
    // request failure: the page then offers a brand new PayWay checkout.
    if (error instanceof ApiError && error.status === 409 && error.data?.data) {
      return normalizePayment(error.data)
    }

    throw error
  }
}